#!/bin/sh
set -e

CERT_PATH="/etc/letsencrypt/live/mizuki-clinic.jp/fullchain.pem"

# 環境変数を展開
envsubst '${SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# SSL証明書が存在する場合、HTTPS設定を追加
if [ -f "$CERT_PATH" ]; then
    echo "SSL certificate found. Enabling HTTPS..."
    cat >> /etc/nginx/conf.d/default.conf << 'EOF'

# HTTPS
server {
    listen 443 ssl;
    server_name ${SERVER_NAME};

    ssl_certificate /etc/letsencrypt/live/mizuki-clinic.jp/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mizuki-clinic.jp/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://static.wixstatic.com; frame-src https://www.google.com; connect-src 'self' https://www.google.com;" always;

    client_max_body_size 10M;

    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location / {
        proxy_pass http://next_app:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://next_app:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static/ {
        proxy_pass http://next_app:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# www → non-www リダイレクト (HTTPS)
server {
    listen 443 ssl;
    server_name www.${SERVER_NAME};

    ssl_certificate /etc/letsencrypt/live/mizuki-clinic.jp/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mizuki-clinic.jp/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;

    return 301 https://${SERVER_NAME}$request_uri;
}
EOF
    # SERVER_NAME を再度展開
    sed -i "s/\${SERVER_NAME}/${SERVER_NAME}/g" /etc/nginx/conf.d/default.conf
else
    echo "SSL certificate not found. Running HTTP only..."
    # HTTPSリダイレクトを無効化し、HTTPで直接サービス
    cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name www.${SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 http://${SERVER_NAME}\$request_uri;
    }
}

EOF
    cat >> /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    client_max_body_size 10M;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://next_app:3000;
        proxy_http_version 1.1;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://next_app:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /static/ {
        proxy_pass http://next_app:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF
fi

exec nginx -g 'daemon off;'
