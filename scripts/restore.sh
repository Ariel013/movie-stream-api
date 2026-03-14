#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# HEMOSAFE — Database restore script
#
# Usage:
#   ./restore.sh <backup-file.enc>        # restore from local encrypted file
#   ./restore.sh s3://bucket/key.enc      # restore from S3
#
# IMPORTANT: This will DROP and RECREATE the target database.
# Run only when directed by the DBA or incident commander.
# ─────────────────────────────────────────────────────────────────────────────

set -e

BACKUP_SOURCE="${1}"
TARGET_DB="${PGDATABASE:-hemosafe_prod}"
WORK_DIR="/tmp/restore_$$"

if [ -z "${BACKUP_SOURCE}" ]; then
  echo "Usage: $0 <backup-file.enc> | <s3://bucket/key.enc>"
  exit 1
fi

echo "=== HEMOSAFE RESTORE ==="
echo "Source:   ${BACKUP_SOURCE}"
echo "Database: ${TARGET_DB}@${PGHOST}"
echo ""
echo "WARNING: This will overwrite ${TARGET_DB}. Press Ctrl+C to abort."
sleep 10

mkdir -p "${WORK_DIR}"
ENCRYPTED_FILE="${WORK_DIR}/backup.enc"
DUMP_FILE="${WORK_DIR}/backup.dump"

# ── 1. Fetch backup ──────────────────────────────────────────────────────────
if echo "${BACKUP_SOURCE}" | grep -q "^s3://"; then
  echo "[1/5] Downloading from S3…"
  aws s3 cp "${BACKUP_SOURCE}" "${ENCRYPTED_FILE}"

  # Verify checksum if available
  if aws s3 cp "${BACKUP_SOURCE}.sha256" "${WORK_DIR}/expected.sha256" 2>/dev/null; then
    EXPECTED=$(awk '{print $1}' "${WORK_DIR}/expected.sha256")
    ACTUAL=$(sha256sum "${ENCRYPTED_FILE}" | awk '{print $1}')
    if [ "${EXPECTED}" != "${ACTUAL}" ]; then
      echo "ERROR: Checksum mismatch! Backup file may be corrupted."
      exit 1
    fi
    echo "Checksum OK: ${ACTUAL}"
  fi
else
  cp "${BACKUP_SOURCE}" "${ENCRYPTED_FILE}"
fi

# ── 2. Decrypt ───────────────────────────────────────────────────────────────
if [ -n "${BACKUP_ENCRYPTION_KEY}" ]; then
  echo "[2/5] Decrypting backup…"
  openssl enc -d -aes-256-cbc \
    -in  "${ENCRYPTED_FILE}" \
    -out "${DUMP_FILE}" \
    -pass "pass:${BACKUP_ENCRYPTION_KEY}" \
    -pbkdf2
else
  echo "[2/5] No encryption key — treating as plaintext dump"
  cp "${ENCRYPTED_FILE}" "${DUMP_FILE}"
fi

# ── 3. Verify dump ───────────────────────────────────────────────────────────
echo "[3/5] Verifying dump integrity…"
pg_restore --list "${DUMP_FILE}" | head -20
echo ""

# ── 4. Drop & recreate database ──────────────────────────────────────────────
echo "[4/5] Recreating database ${TARGET_DB}…"
psql -U "${PGUSER}" -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();
"
psql -U "${PGUSER}" -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
psql -U "${PGUSER}" -d postgres -c "CREATE DATABASE ${TARGET_DB} OWNER ${PGUSER};"
psql -U "${PGUSER}" -d "${TARGET_DB}" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U "${PGUSER}" -d "${TARGET_DB}" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# ── 5. Restore ───────────────────────────────────────────────────────────────
echo "[5/5] Restoring data…"
pg_restore \
  --dbname="${TARGET_DB}" \
  --no-owner \
  --no-acl \
  --jobs=4 \
  --verbose \
  "${DUMP_FILE}"

echo ""
echo "=== RESTORE COMPLETE ==="
echo "Database ${TARGET_DB} has been restored."
echo "Next step: run 'npx prisma migrate deploy' if schema changed."

# Cleanup
rm -rf "${WORK_DIR}"
