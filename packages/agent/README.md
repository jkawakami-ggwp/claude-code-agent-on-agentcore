# Claude Code Agent

Claude Code AgentをベースにしたAIエージェントサーバー実装です。AWS Bedrock AgentCoreの要件に準拠したREST APIを提供します。

## 概要

このパッケージは、AnthropicのClaude Code Agent SDKを使用したAIエージェントのサーバー実装です。ExpressベースのREST APIを通じて、エージェントとの対話を可能にします。

### 主な機能

- **エージェント実行エンドポイント**: エージェントとの対話をシンプルなHTTPリクエストで実行
- **ヘルスチェック**: AWS Bedrock AgentCore要件に準拠した `/ping` エンドポイント
- **Dockerサポート**: Docker Composeによる開発環境とDockerfile による本番環境の構築

## 必要要件

- Node.js 20以上
- pnpm
- Docker & Docker Compose（開発環境の場合）

## インストール

```bash
# 依存関係のインストール（コンテナ内で実行）
docker-compose exec app pnpm install
```

## 環境変数

`.env`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Anthropic API Key
ANTHROPIC_API_KEY=your_api_key_here

# サーバーポート（デフォルト: 8080）
PORT=8080
```

`.env.example`を参考にしてください。

## 開発

### Docker Composeを使用した開発

```bash
# コンテナを起動
docker-compose up -d

# 開発サーバーを起動（ホットリロード有効）
docker-compose exec app pnpm dev

# ログを確認
docker-compose logs -f app
```

### ビルド

```bash
# TypeScriptをコンパイル
docker-compose exec app pnpm build
```

### テスト

```bash
# テストを実行
docker-compose exec app pnpm test

# ウォッチモードでテストを実行
docker-compose exec app pnpm test:watch

# カバレッジレポートを生成
docker-compose exec app pnpm test:coverage
```

### コード品質

```bash
# リンターを実行
docker-compose exec app pnpm lint

# リンターを実行して自動修正
docker-compose exec app pnpm lint:fix

# フォーマッターを実行
docker-compose exec app pnpm format

# フォーマットをチェック
docker-compose exec app pnpm format:check
```

## API エンドポイント

### ヘルスチェック

```bash
GET /ping
```

**curlコマンド例:**
```bash
curl http://localhost:8080/ping
```

**レスポンス例:**
```json
{
  "status": "Healthy"
}
```

### エージェント実行

```bash
POST /invocations
Content-Type: application/json

{
  "prompt": "こんにちは"
}
```

**curlコマンド例:**
```bash
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "こんにちは"}'
```

**レスポンス例:**
```json
{
  "response": "こんにちは！何かお手伝いできることはありますか？",
  "status": "success"
}
```

## アーキテクチャ

### ディレクトリ構造

```
packages/agent/
├── src/
│   ├── agent.ts              # Agentクラス（エージェントのラッパー）
│   ├── index.ts              # Expressサーバーとエンドポイント
│   └── tools/                # カスタムツール
│       ├── getCurrentDateTimeTool.ts
│       ├── getWeatherTool.ts
│       ├── mcpTools.ts
│       └── index.ts
├── dist/                     # ビルド出力
├── Dockerfile                # 本番環境用Dockerイメージ
├── docker-compose.yml        # 開発環境用Docker Compose設定
├── package.json
├── tsconfig.json
└── README.md
```

### Agentクラス

`Agent`クラスは、Claude Code Agent SDKをラップし、以下の機能を提供します：

- `invoke(prompt: string)`: エージェントを実行し、最終的な応答を返す

## デプロイ

### Dockerイメージのビルド

```bash
# Dockerイメージをビルド
docker build -t claude-code-agent .

# Dockerコンテナを実行
docker run --env-file .env -p 8080:8080 claude-code-agent
```

### AWS Bedrock AgentCoreへのデプロイ

このエージェントは、AWS Bedrock AgentCoreの要件に準拠しています：

1. `/ping` エンドポイントでヘルスチェックを提供
2. `/invocations` エンドポイントでエージェント実行を提供
3. ポート8080でリッスン

詳細は `/packages/infra` のCDKスタックを参照してください。

## トラブルシューティング

### ANTHROPIC_API_KEYが設定されていない

エラー: `ANTHROPIC_API_KEY is not set`

解決方法: `.env`ファイルに`ANTHROPIC_API_KEY`を設定してください。

### ポートが既に使用されている

エラー: `EADDRINUSE: address already in use :::8080`

解決方法: 
- 別のポートを使用する: `PORT=3000 pnpm dev`
- または、既存のプロセスを停止する

### Dockerコンテナが起動しない

解決方法:
```bash
# コンテナの状態を確認
docker-compose ps

# ログを確認
docker-compose logs app

# コンテナを再ビルド
docker-compose up --build
```

## 関連パッケージ

- `/packages/web`: Next.jsベースのWebフロントエンド
- `/packages/infra`: AWS CDKによるインフラストラクチャ定義
