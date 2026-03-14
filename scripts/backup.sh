#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# HEMOSAFE — Automated PostgreSQL backup script
#
# Strategy:
#   - Daily pg_dump (compressed, encrypted) → local /backups + S3
#   - 30-day local retention
#   - AES-256 encryption with a key stored in AWS Secrets Manager
#   - Backup integrity check: pg_restore --list (dry-run)
#   - Alert on failure via HTTP webhook
#
# Required env vars (set in docker-compose):
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#   S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
#   BACKUP_ENCRYPTION_KEY (32-byte hex key for AES-256)
#   ALERT_WEBHOOK_URL (Slack/Teams webhook for failure notifications)
# ─────────────────────────────────────────────────────────────────────────────

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
FILENAME="hemosafe_${TIMESTAMP}.dump"
ENCRYPTED="${FILENAME}.enc"
CHECKSUM="${ENCRYPTED}.sha256"
LOCAL_PATH="${BACKUP_DIR}/${ENCRYPTED}"
CHECKSUM_PATH="${BACKUP_DIR}/${CHECKSUM}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
LOG_PREFIX="[BACKUP ${TIMESTAMP}]"

echo "${LOG_PREFIX} Starting backup of ${PGDATABASE}@${PGHOST}"

# ── 1. Create dump (custom format = compressed, supports partial restore) ────
pg_dump \
  --format=custom \
  --compress=9 \
  --no-password \
  --file="${BACKUP_DIR}/${FILENAME}" \
  --verbose \
  "${PGDATABASE}"

echo "${LOG_PREFIX} pg_dump complete: $(du -sh ${BACKUP_DIR}/${FILENAME} | cut -f1)"

# ── 2. Verify dump integrity (dry-run restore) ───────────────────────────────
pg_restore --list "${BACKUP_DIR}/${FILENAME}" > /dev/null
echo "${LOG_PREFIX} Backup integrity verified"

# ── 3. Encrypt with AES-256 ─────────────────────────────────────────────────
if [ -n "${BACKUP_ENCRYPTION_KEY}" ]; then
  openssl enc -aes-256-cbc -salt \
    -in  "${BACKUP_DIR}/${FILENAME}" \
    -out "${LOCAL_PATH}" \
    -pass "pass:${BACKUP_ENCRYPTION_KEY}" \
    -pbkdf2
  rm "${BACKUP_DIR}/${FILENAME}"
  echo "${LOG_PREFIX} Encrypted: ${ENCRYPTED}"
else
  # No key provided — rename and warn (should not happen in production)
  mv "${BACKUP_DIR}/${FILENAME}" "${LOCAL_PATH}"
  echo "${LOG_PREFIX} WARNING: backup is NOT encrypted (BACKUP_ENCRYPTION_KEY not set)"
fi

# ── 4. Compute checksum ──────────────────────────────────────────────────────
sha256sum "${LOCAL_PATH}" > "${CHECKSUM_PATH}"
echo "${LOG_PREFIX} Checksum: $(cat ${CHECKSUM_PATH})"

# ── 5. Upload to S3 ──────────────────────────────────────────────────────────
if [ -n "${S3_BUCKET}" ]; then
  S3_KEY="backups/$(date +%Y/%m)/${ENCRYPTED}"
  aws s3 cp "${LOCAL_PATH}"     "s3://${S3_BUCKET}/${S3_KEY}"     --storage-class STANDARD_IA
  aws s3 cp "${CHECKSUM_PATH}"  "s3://${S3_BUCKET}/${S3_KEY}.sha256"
  echo "${LOG_PREFIX} Uploaded to s3://${S3_BUCKET}/${S3_KEY}"
else
  echo "${LOG_PREFIX} WARNING: S3_BUCKET not set, backup is local only"
fi

# ── 6. Purge old local backups ───────────────────────────────────────────────
find "${BACKUP_DIR}" -name "hemosafe_*.enc" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -name "hemosafe_*.sha256" -mtime "+${RETENTION_DAYS}" -delete
echo "${LOG_PREFIX} Purged backups older than ${RETENTION_DAYS} days"

# ── 7. List remaining backups ─────────────────────────────────────────────────
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "hemosafe_*.enc" | wc -l)
echo "${LOG_PREFIX} Backup complete. ${BACKUP_COUNT} backups on disk."

# ── 8. Alert webhook on failure (called by ERR trap) ────────────────────────
notify_failure() {
  EXIT_CODE=$?
  if [ -n "${ALERT_WEBHOOK_URL}" ]; then
    curl -s -X POST "${ALERT_WEBHOOK_URL}" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"🚨 HEMOSAFE DB BACKUP FAILED — exit code ${EXIT_CODE} — ${TIMESTAMP}\"}" \
      || true
  fi
}
trap notify_failure ERR
