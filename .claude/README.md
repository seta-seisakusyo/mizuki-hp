# .claude ディレクトリ

このディレクトリには Claude Code の設定、スキル、エージェント、ルールが含まれています。

## 構成

- **settings.json** - チーム共有の設定（permissions, plansDirectory等）
- **settings.local.json** - 個人設定（gitignore対象）
- **skills/** - 再利用可能なスキル（`/skill-name`で起動）
- **agents/** - カスタムエージェント定義
- **rules/** - モジュラールール（特定のトピックに関する指示）
- **plans/** - 計画モードで生成されたプラン

## ベストプラクティス

1. **CLAUDE.md** は150行以下に保つ（現在: 68行 ✓）
2. **permissions** で頻繁に使うコマンドを事前承認
3. **skills** で再利用可能なワークフローを作成
4. **個人設定** は settings.local.json に記載（gitignore対象）

## 参考資料

- [Claude Code公式ドキュメント](https://code.claude.com/docs)
- [Claude Code Best Practice](https://github.com/shanraisshan/claude-code-best-practice)
