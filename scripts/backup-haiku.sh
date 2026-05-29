#!/bin/bash
# Haiku backup script for host cron.
# Example cron: 30 3 * * * cd /home/seta/mizuki-hp && ./scripts/backup-haiku.sh >> /tmp/mizuki-haiku-backup.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."

APP_URL="${HAIKU_BACKUP_URL:-http://127.0.0.1:2999}"
BACKUP_DIR="${HAIKU_BACKUP_DIR:-./backups/haiku}"
ENV_FILE="${HAIKU_BACKUP_ENV_FILE:-./next/.env}"
KEEP_DAYS="${HAIKU_BACKUP_KEEP_DAYS:-30}"

read_env_value() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

if [ -z "${HAIKU_BACKUP_TOKEN:-}" ] && [ -f "$ENV_FILE" ]; then
  HAIKU_BACKUP_TOKEN="$(read_env_value "$ENV_FILE" "HAIKU_BACKUP_TOKEN" || true)"
fi

if [ -z "${HAIKU_BACKUP_TOKEN:-}" ]; then
  echo "[$(date)] ERROR: HAIKU_BACKUP_TOKEN is not set."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

DATE=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="${BACKUP_DIR}/mizuki-haiku-backup-${DATE}.json"
TMP_FILE="${BACKUP_FILE}.tmp"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

curl -fsS   -H "Authorization: Bearer ${HAIKU_BACKUP_TOKEN}"   "${APP_URL%/}/api/blog/backup"   -o "$TMP_FILE"

mv "$TMP_FILE" "$BACKUP_FILE"
trap - EXIT

find "$BACKUP_DIR" -type f -name 'mizuki-haiku-backup-*.json' -mtime +"$KEEP_DAYS" -delete

echo "[$(date)] Haiku backup created: $BACKUP_FILE"
