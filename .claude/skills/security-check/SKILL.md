---
name: security-check
description: セキュリティ監査とベストプラクティスチェックを実行
model: sonnet
---

# Security Check Skill

このスキルは医療機関Webサイトのセキュリティ監査を実行します。

## チェック項目

### 1. 環境変数の保護
- .envファイルが.gitignoreに含まれているか
- 本番環境の機密情報がコードにハードコードされていないか

### 2. 認証・認可
- NextAuth設定でuseSecureCookiesが本番環境で有効か
- 管理画面へのアクセス制御が適切か

### 3. XSS/インジェクション対策
- ユーザー入力が適切にサニタイズされているか
- HTML出力時にエスケープ処理があるか

### 4. reCAPTCHA
- 本番環境でreCAPTCHAバイパスが無効になっているか

### 5. レート制限
- APIエンドポイントにレート制限が実装されているか

## 実行方法
/security-check
