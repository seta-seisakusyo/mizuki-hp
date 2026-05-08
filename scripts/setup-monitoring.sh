#!/bin/bash
# サーバー監視ツール一括セットアップスクリプト
# 使用方法: sudo bash scripts/setup-monitoring.sh
#
# インストール対象:
#   1. msmtp (メール送信)
#   2. fail2ban (不正アクセスブロック)
#   3. logwatch (日次ログレポート)
#   4. サービス監視cron

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ALERT_EMAIL="info@setaseisakusyo.com"

echo "=== みずきクリニック サーバー監視セットアップ ==="
echo ""

# ---- 対話式入力 ----
read -sp "メール送信用パスワード (info@setaseisakusyo.com): " MAIL_PASSWORD
echo ""
read -p "SSHポート番号: " SSH_PORT
echo ""

# ---- 1. msmtp (メール送信) ----
echo "[1/4] msmtp インストール..."
apt-get update -qq
apt-get install -y -qq msmtp msmtp-mta

cat > /etc/msmtprc << EOF
defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

account        default
host           mail1042.onamae.ne.jp
port           465
tls_starttls   off
from           info@setaseisakusyo.com
user           info@setaseisakusyo.com
password       ${MAIL_PASSWORD}
EOF

chmod 600 /etc/msmtprc
echo "  ✓ msmtp 設定完了"

# ---- 2. fail2ban ----
echo "[2/4] fail2ban インストール..."
apt-get install -y -qq fail2ban

# 設定ファイルコピー
cp "${PROJECT_DIR}/fail2ban/jail.local" /etc/fail2ban/jail.local
cp "${PROJECT_DIR}/fail2ban/filter.d/nginx-404.conf" /etc/fail2ban/filter.d/nginx-404.conf
cp "${PROJECT_DIR}/fail2ban/filter.d/nginx-proxy.conf" /etc/fail2ban/filter.d/nginx-proxy.conf

# SSHポートを設定
sed -i "s/port = ssh/port = ${SSH_PORT}/" /etc/fail2ban/jail.local

# nginxログディレクトリ作成
mkdir -p /var/log/nginx

# fail2ban 起動
systemctl enable fail2ban
systemctl restart fail2ban
echo "  ✓ fail2ban 設定完了"

# ---- 3. logwatch ----
echo "[3/4] logwatch インストール..."
apt-get install -y -qq logwatch

mkdir -p /etc/logwatch/conf
cp "${PROJECT_DIR}/logwatch/logwatch.conf" /etc/logwatch/conf/logwatch.conf

echo "  ✓ logwatch 設定完了"

# ---- 4. cron 設定 ----
echo "[4/4] cron 設定..."

# 既存のmizuki関連cronを削除して再設定
crontab -l 2>/dev/null | grep -v "mizuki" | grep -v "logwatch" > /tmp/crontab.tmp || true

cat >> /tmp/crontab.tmp << CRON
# === mizuki-clinic.jp 監視 ===
# サービス死活監視 (5分ごと)
*/5 * * * * ${PROJECT_DIR}/scripts/monitor.sh
# SSL証明書自動更新 (毎月1日 3:00)
0 3 1 * * ${PROJECT_DIR}/scripts/renew-ssl.sh >> /var/log/certbot-renew.log 2>&1
# DBバックアップ (毎日 4:00)
0 4 * * * ${PROJECT_DIR}/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
# Logwatch日次レポート (毎朝 7:00)
0 7 * * * /usr/sbin/logwatch --output mail
CRON

crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp
echo "  ✓ cron 設定完了"

# ---- スクリプト実行権限 ----
chmod +x "${PROJECT_DIR}/scripts/monitor.sh"
chmod +x "${PROJECT_DIR}/scripts/renew-ssl.sh"
chmod +x "${PROJECT_DIR}/scripts/backup-db.sh"

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "設定済み:"
echo "  • サービス監視: 5分ごとにコンテナ状態チェック → ダウン時メール通知"
echo "  • fail2ban: SSH(3回失敗→24h BAN) / Nginx不正アクセスブロック"
echo "  • logwatch: 毎朝7:00にログサマリーを ${ALERT_EMAIL} に送信"
echo "  • SSL更新: 毎月1日 3:00"
echo "  • DBバックアップ: 毎日 4:00"
echo ""
echo "確認コマンド:"
echo "  fail2ban-client status         # fail2ban状態"
echo "  fail2ban-client status sshd    # SSH jail詳細"
echo "  crontab -l                     # cron一覧"
echo "  cat /var/log/mizuki-monitor.log # 監視ログ"
