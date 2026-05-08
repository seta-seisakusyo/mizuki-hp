# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

mizuki-hpは医療機関のホームページです。Next.js 15 (App Router) を使用したフルスタックWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 15.1.7 (App Router)
- **言語**: TypeScript
- **UI**: React 19, Material UI (MUI) 6, Tailwind CSS
- **認証**: NextAuth v5 (Auth.js)
- **データベース**: MySQL + Prisma ORM
- **フォーム**: React Hook Form + Zod
- **デプロイ**: Docker (nginx, certbot, fail2ban)

## ディレクトリ構成

```
/
├── next/                    # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/            # App Routerページ・APIルート
│   │   ├── components/     # 共通コンポーネント
│   │   ├── lib/            # ユーティリティ・ヘルパー
│   │   ├── actions/        # Server Actions
│   │   ├── theme/          # MUIテーマ設定
│   │   └── auth.ts         # NextAuth設定
│   └── prisma/             # Prismaスキーマ・マイグレーション
├── nginx/                  # nginx設定
├── mysql/                  # MySQL設定
├── certbot/                # SSL証明書 (Let's Encrypt)
├── fail2ban/               # セキュリティ設定
└── docker-compose.yml      # Docker構成
```

## 開発コマンド

```bash
# 開発サーバー起動 (nextディレクトリで実行)
cd next && npm run dev

# ビルド
cd next && npm run build

# Lint
cd next && npm run lint

# Prismaマイグレーション
cd next && npx prisma migrate dev

# Prisma Studio (DBビューア)
cd next && npx prisma studio

# Docker起動
docker-compose up -d
```

## 主要ページ

- `/` - トップページ
- `/blog` - ブログ
- `/news` - お知らせ
- `/doctor` - 医師紹介
- `/services` - 診療案内
- `/consultation` - 診療時間
- `/contact` - お問い合わせ
- `/online` - オンライン診療
- `/vaccine` - ワクチン予約
- `/portal-admin` - 管理画面
- `/portal-login` - ログイン

## コーディング規約

- コンポーネントは`components/`に配置
- Server Actionsは`actions/`に配置
- API Routesは`app/api/`に配置
- 型定義は`app/types/`に配置
- 日本語コメント可

## 環境変数

`.env`ファイルに以下の環境変数を設定:
- `DATABASE_URL` - MySQL接続文字列
- `AUTH_SECRET` - NextAuth シークレット
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA シークレットキー
