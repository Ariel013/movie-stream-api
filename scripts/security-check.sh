#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# HEMOSAFE — Pre-deploy security check
#
# Runs a series of sanity checks before production deployment.
# Exit code 0 = all checks passed
# Exit code 1 = one or more checks failed (blocks deployment)
#
# Usage: ./scripts/security-check.sh [--env-file .env.prod]
# ─────────────────────────────────────────────────────────────────────────────

set -e

ENV_FILE="${1:-.env.prod}"
PASS=0
FAIL=0
WARN=0

# Colours (disabled in CI)
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; NC=''
fi

ok()   { echo "${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN+1)); }

echo "========================================"
echo " HEMOSAFE — Security Check"
echo " $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo "========================================"
echo ""

# ── 1. Environment file ───────────────────────────────────────────────────────
echo "--- Environment ---"

if [ -f "${ENV_FILE}" ]; then
  ok ".env file exists: ${ENV_FILE}"
else
  fail ".env file not found: ${ENV_FILE}"
fi

# Required vars
for var in DATABASE_URL REDIS_PASSWORD JWT_SECRET JWT_REFRESH_SECRET \
           BACKUP_ENCRYPTION_KEY GRAFANA_ADMIN_PASSWORD; do
  val=$(grep -s "^${var}=" "${ENV_FILE}" | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -z "${val}" ]; then
    fail "Missing required env var: ${var}"
  else
    ok "Env var set: ${var}"
  fi
done

# Secrets must not be default/weak values
JWT_SECRET=$(grep -s "^JWT_SECRET=" "${ENV_FILE}" | cut -d= -f2- | tr -d '"')
if echo "${JWT_SECRET}" | grep -qiE "^(secret|changeme|password|hemosafe|example|test)"; then
  fail "JWT_SECRET appears to be a weak/default value"
else
  ok "JWT_SECRET is not a default value"
fi

JWT_LEN=${#JWT_SECRET}
if [ "${JWT_LEN}" -lt 32 ]; then
  fail "JWT_SECRET is too short (${JWT_LEN} chars, minimum 32)"
else
  ok "JWT_SECRET length: ${JWT_LEN} chars"
fi

# ── 2. TLS certificates ───────────────────────────────────────────────────────
echo ""
echo "--- TLS ---"

CERT_DIR="${NGINX_CERT_DIR:-/opt/hemosafe/nginx/certs}"
if [ -f "${CERT_DIR}/hemosafe.crt" ] && [ -f "${CERT_DIR}/hemosafe.key" ]; then
  ok "TLS certificate and key found"

  # Check cert expiry (warn if < 30 days)
  if command -v openssl >/dev/null 2>&1; then
    EXPIRY=$(openssl x509 -enddate -noout -in "${CERT_DIR}/hemosafe.crt" 2>/dev/null | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "${EXPIRY}" +%s 2>/dev/null || echo 0)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ "${DAYS_LEFT}" -lt 0 ]; then
      fail "TLS certificate has EXPIRED (${EXPIRY})"
    elif [ "${DAYS_LEFT}" -lt 30 ]; then
      warn "TLS certificate expires in ${DAYS_LEFT} days (${EXPIRY})"
    else
      ok "TLS certificate valid for ${DAYS_LEFT} days"
    fi
  fi
else
  fail "TLS certificate or key missing in ${CERT_DIR}"
fi

# ── 3. File permissions ───────────────────────────────────────────────────────
echo ""
echo "--- File Permissions ---"

for f in "${ENV_FILE}" "${CERT_DIR}/hemosafe.key" scripts/backup.sh scripts/restore.sh; do
  if [ -f "${f}" ]; then
    PERMS=$(stat -c "%a" "${f}" 2>/dev/null || stat -f "%Lp" "${f}" 2>/dev/null)
    if [ "${PERMS}" = "600" ] || [ "${PERMS}" = "400" ]; then
      ok "${f} permissions: ${PERMS}"
    else
      fail "${f} permissions too open: ${PERMS} (should be 600)"
    fi
  fi
done

# ── 4. Docker image security ──────────────────────────────────────────────────
echo ""
echo "--- Docker Images ---"

if command -v trivy >/dev/null 2>&1; then
  ok "Trivy available — running image scan"
  for img in hemosafe-api hemosafe-web; do
    VULN_COUNT=$(trivy image --exit-code 0 --severity HIGH,CRITICAL --format json \
      "ghcr.io/${GITHUB_REPOSITORY:-hemosafe/hemosafe}/${img}:latest" 2>/dev/null \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(sum(len(r.get('Vulnerabilities') or []) for r in d.get('Results',[])))" 2>/dev/null || echo "?")
    if [ "${VULN_COUNT}" = "0" ]; then
      ok "${img}: no HIGH/CRITICAL vulnerabilities"
    else
      warn "${img}: ${VULN_COUNT} HIGH/CRITICAL vulnerabilities found (run 'trivy image' for details)"
    fi
  done
else
  warn "Trivy not installed — skipping image vulnerability scan"
fi

# ── 5. Exposed ports ──────────────────────────────────────────────────────────
echo ""
echo "--- Network Exposure ---"

# Verify internal services are NOT bound to 0.0.0.0
for port in 5432 6379 9090 3100 9093 9187 9121; do
  BINDING=$(ss -tlnp 2>/dev/null | awk -v p=":${port}" '$0 ~ p {print $4}' | head -1)
  if echo "${BINDING}" | grep -q "0.0.0.0:${port}"; then
    fail "Port ${port} is bound to 0.0.0.0 (should be 127.0.0.1 only)"
  elif [ -z "${BINDING}" ]; then
    ok "Port ${port}: not listening on host (Docker internal — OK)"
  else
    ok "Port ${port}: ${BINDING}"
  fi
done

# ── 6. npm audit ─────────────────────────────────────────────────────────────
echo ""
echo "--- Dependency Audit ---"

for dir in hemosafe-api hemosafe-web; do
  if [ -d "${dir}" ]; then
    HIGH=$(cd "${dir}" && npm audit --audit-level=high --json 2>/dev/null \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0)+d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo "?")
    if [ "${HIGH}" = "0" ]; then
      ok "${dir}: no high/critical npm vulnerabilities"
    else
      fail "${dir}: ${HIGH} high/critical npm vulnerabilities (run 'npm audit' for details)"
    fi
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo " Results: ${GREEN}${PASS} passed${NC}  ${YELLOW}${WARN} warnings${NC}  ${RED}${FAIL} failed${NC}"
echo "========================================"

if [ "${FAIL}" -gt 0 ]; then
  echo "Security check FAILED — deployment blocked."
  exit 1
fi

if [ "${WARN}" -gt 0 ]; then
  echo "Security check passed with warnings."
else
  echo "Security check PASSED."
fi

exit 0
