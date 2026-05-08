# 開発環境セットアップガイド

## 開発環境と本番環境の違い

### 開発環境（docker-compose.dev.yml）
- コード変更がリアルタイムで反映される
- ホットリロードが有効
- `npm run dev` で起動
- MySQLデータは `mysql_dev_data` ボリュームに保存

### 本番環境（docker-compose.yml）
- 固定イメージ `ghcr.io/ryuji0128/mizuki-hp:latest` を使用
- コード変更は反映されない（再ビルドが必要）
- `node server.js` で起動
- MySQLデータは `./mysql/data` に保存

## 開発環境の起動

```bash
# 開発環境を起動（certbotなし）
docker compose -f docker-compose.dev.yml up -d

# ログを確認
docker compose -f docker-compose.dev.yml logs -f next

# 停止
docker compose -f docker-compose.dev.yml down
```

## 本番環境の起動

```bash
# 本番環境を起動
docker compose up -d next mysql nginx

# SSL証明書も含めて起動
docker compose --profile ssl up -d

# 停止
docker compose down
```

## 環境変数

### 必須の環境変数（本番環境）

`next/.env` に設定:

```bash
# 管理者アカウント（seed用）
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password

# SMTP設定（お名前メール）
SMTP_HOST=smtp22.gmoserver.jp
SMTP_PORT=465
SMTP_USER=info@mizuki-clinic.jp
SMTP_PASS=your-password
CONTACT_TO_EMAIL=info@mizuki-clinic.jp

# NextAuth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://mizuki-clinic.jp

# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
```

## セキュリティチェックリスト

- [ ] `ADMIN_PASSWORD` を変更済み
- [ ] `.env` ファイルを `.gitignore` に追加済み
- [ ] 本番環境では `RECAPTCHA_BYPASS` を設定しない
- [ ] `NEXTAUTH_URL` が正しいドメインを指している
- [ ] SMTP認証情報が正しい

## トラブルシューティング

### メール送信ができない

1. SMTP設定を確認:
```bash
docker exec next_app_dev printenv | grep SMTP
```

2. お名前メールのDNS設定を確認:
   - MXレコード: `mx22.gmoserver.jp`
   - SPFレコード: `v=spf1 include:spf22.gmoserver.jp ~all`

### コード変更が反映されない

開発環境を使用していることを確認:
```bash
docker compose -f docker-compose.dev.yml restart next
```

### データベースがリセットされた

開発環境は `mysql_dev_data` ボリューム、本番環境は `./mysql/data` を使用しています。
混在しないように注意してください。
