#!/bin/bash

domain="mizuki-clinic.jp"
email=""  # ここにメールアドレスを設定
staging=0 # テスト時は1に設定（Let's Encryptのレート制限回避）

if [ -z "$email" ]; then
  echo "Error: init-letsencrypt.sh 内の email を設定してください"
  exit 1
fi

echo "### ディレクトリ作成 ###"
mkdir -p certbot/conf certbot/www

echo "### 一時的にHTTPのみのnginx設定を作成 ###"
cat > nginx/default.conf.template.tmp <<'NGINX'
server {
    listen 80;
    server_name ${SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://next_app:3000;
    }
}
NGINX

# 元の設定をバックアップして一時設定に差し替え
cp nginx/default.conf.template nginx/default.conf.template.bak
cp nginx/default.conf.template.tmp nginx/default.conf.template

echo "### nginx起動（HTTPのみ） ###"
docker compose up -d nginx
sleep 3

# nginx起動確認
if ! docker compose ps nginx | grep -q "Up"; then
  echo "Error: nginxの起動に失敗しました"
  cp nginx/default.conf.template.bak nginx/default.conf.template
  rm -f nginx/default.conf.template.tmp
  exit 1
fi

echo "### Let's Encrypt 証明書を取得 ###"
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    -d $domain \
    -d www.$domain \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

# 証明書取得確認
if [ ! -f "certbot/conf/live/$domain/fullchain.pem" ]; then
  echo "Error: 証明書の取得に失敗しました"
  cp nginx/default.conf.template.bak nginx/default.conf.template
  rm -f nginx/default.conf.template.tmp
  exit 1
fi

echo "### HTTPS設定に切り替え ###"
cp nginx/default.conf.template.bak nginx/default.conf.template
rm -f nginx/default.conf.template.tmp nginx/default.conf.template.bak

echo "### nginx再起動（HTTPS有効） ###"
docker compose restart nginx

echo "### 完了! https://$domain でアクセスできます ###"
