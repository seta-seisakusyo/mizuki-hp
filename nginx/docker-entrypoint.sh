#!/bin/sh
set -eu

: "${SERVER_NAME:?SERVER_NAME is required}"
CERT_NAME="${CERT_NAME:-$SERVER_NAME}"
CERT_PATH="/etc/letsencrypt/live/${CERT_NAME}/fullchain.pem"
CONFIG_PATH="/etc/nginx/conf.d/default.conf"

if [ -f "$CERT_PATH" ]; then
  envsubst '${SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > "$CONFIG_PATH"
  cat >> "$CONFIG_PATH" <<'EOF'

server {
    listen 443 ssl;
    http2 on;
    server_name ${SERVER_NAME};
    server_tokens off;

    ssl_certificate /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT_NAME}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;

    client_max_body_size 10M;

    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
    }

    location /_next/static/ {
        proxy_pass http://next:3000;
        expires 1y;
    }

    location /static/ {
        proxy_pass http://next:3000;
        expires 1y;
    }

    location / {
        proxy_pass http://next:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header CF-Connecting-IP "";
        proxy_set_header X-Middleware-Subrequest "";
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 15s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name www.${SERVER_NAME};
    server_tokens off;
    ssl_certificate /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT_NAME}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    return 301 https://${SERVER_NAME}$request_uri;
}
EOF
  sed -i "s/\${SERVER_NAME}/${SERVER_NAME}/g; s/\${CERT_NAME}/${CERT_NAME}/g" "$CONFIG_PATH"
else
  echo "TLS certificate not found; serving ACME challenges only."
  cat > "$CONFIG_PATH" <<EOF
server {
    listen 80 default_server;
    server_name ${SERVER_NAME} www.${SERVER_NAME};
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        add_header Retry-After "300" always;
        add_header X-Content-Type-Options "nosniff" always;
        return 503 "TLS certificate unavailable. Retry later.\n";
    }
}
EOF
fi

nginx -t
exec nginx -g 'daemon off;'
