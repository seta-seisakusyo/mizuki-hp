---
name: docker-deploy
description: Docker本番環境へのデプロイワークフローを実行
model: sonnet
allowed-tools: Bash, Read, Grep
---

# Docker Deploy Skill

本番環境へのDockerデプロイワークフローを実行します。

## デプロイ手順

### 1. 事前チェック
- docker-compose.ymlの環境変数確認
- イメージタグの確認
- データベースマイグレーションの確認

### 2. イメージビルド
cd next && npm run build
docker build -t ghcr.io/ryuji0128/mizuki-hp:latest .

### 3. 本番環境でのデプロイ
docker compose pull
docker compose up -d --force-recreate
docker compose logs -f

## 注意事項
- データベースマイグレーション: デプロイ前に手動で実行
- 環境変数: .envファイルが本番サーバーに配置されていること確認
- バックアップ: デプロイ前にデータベースのバックアップを取得

## 実行方法
/docker-deploy
