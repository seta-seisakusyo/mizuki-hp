#!/bin/bash
# Haiku backup script for host cron.
# Example cron: 30 3 * * * cd /home/ubuntu/mizuki-hp && ./scripts/backup-haiku.sh >> /tmp/mizuki-haiku-backup.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${HAIKU_BACKUP_DIR:-./backups/haiku}"
ENV_FILE="${HAIKU_BACKUP_COMPOSE_ENV_FILE:-./.env}"
KEEP_DAYS="${HAIKU_BACKUP_KEEP_DAYS:-30}"

read_env_value() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

if [ -f "$ENV_FILE" ]; then
  MYSQL_DATABASE="${MYSQL_DATABASE:-$(read_env_value "$ENV_FILE" "MYSQL_DATABASE" || true)}"
  MYSQL_USER="${MYSQL_USER:-$(read_env_value "$ENV_FILE" "MYSQL_USER" || true)}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD:-$(read_env_value "$ENV_FILE" "MYSQL_PASSWORD" || true)}"
fi

MYSQL_DATABASE="${MYSQL_DATABASE:-app_db}"
MYSQL_USER="${MYSQL_USER:-app_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-app_pass}"

mkdir -p "$BACKUP_DIR"

DATE=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="${BACKUP_DIR}/mizuki-haiku-backup-${DATE}.tar.gz"
TMP_DIR="${BACKUP_DIR}/.mizuki-haiku-backup-${DATE}"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$TMP_DIR"

docker compose exec -T \
  -e MYSQL_PWD="$MYSQL_PASSWORD" \
  mysql mysqldump \
  --no-tablespaces \
  -u "$MYSQL_USER" \
  "$MYSQL_DATABASE" \
  Blog | gzip > "${TMP_DIR}/blog.sql.gz"

if [ -d ./uploads ]; then
  tar -czf "${TMP_DIR}/uploads.tar.gz" -C ./uploads .
else
  tar -czf "${TMP_DIR}/uploads.tar.gz" --files-from /dev/null
fi

cat > "${TMP_DIR}/manifest.json" <<EOF
{
  "schemaVersion": 1,
  "source": "mizuki-hp-haiku-cron",
  "createdAt": "${DATE}",
  "database": "${MYSQL_DATABASE}",
  "files": ["blog.sql.gz", "uploads.tar.gz"]
}
EOF

tar -czf "$BACKUP_FILE" -C "$TMP_DIR" .

find "$BACKUP_DIR" -type f -name 'mizuki-haiku-backup-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

trap - EXIT
cleanup

echo "[$(date)] Haiku backup created: $BACKUP_FILE"
