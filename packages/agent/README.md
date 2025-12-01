# LangChain Claude プロジェクト

LangChain の `createAgent` 関数を使用して Claude と連携する TypeScript サンプルです。エージェントは LangChain のツール機能に対応しており、Claude 3.7 Sonnet をデフォルトモデルとして利用します。

## 主な特徴
- **LangChain Agent**: `createAgent` を使用したシンプルなエージェント構成
- **Agentクラス**: エージェントをラップした使いやすいクラスAPI
- **Express REST API**: HTTPエンドポイント経由でエージェントを利用可能
- **AWS Bedrock AgentCore対応**: AWS Bedrock AgentCore ランタイムの要件に準拠
- **ツール対応**: Zod スキーマを使用した型安全なツール定義
- **TypeScript**: 完全な型安全性でサンプルを拡張可能
- **Docker対応**: Docker Compose による開発環境を提供（ARM64対応）

## 前提条件
- Node.js 18 以上
- pnpm（パッケージマネージャー）
- Docker & Docker Compose（Docker環境を使用する場合）
- AWS CLI（AWS環境にデプロイする場合）
- AWS CDK（AWS環境にデプロイする場合）

## セットアップ

```bash
git clone <repository-url>
cd langchain-claude-project

# 環境変数のセットアップ
cp env.example .env
```

`.env` に以下を設定してください。

```dotenv
# Anthropic設定
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MODEL=claude-3-7-sonnet-20250219

# アプリケーション設定
NODE_ENV=development
PORT=8080
```

**注意**: `ANTHROPIC_API_KEY` は必須です。Anthropic ダッシュボードで API キーを発行してください。

## 実行方法

### REST API サーバーとして実行

デフォルトでは、Expressサーバーとして起動します。

#### ローカル環境での実行

```bash
# 依存関係のインストール（初回のみ）
pnpm install

# サーバーを起動
pnpm dev

# または、ビルド後に実行
pnpm build
pnpm start
```

#### Docker環境での実行

```bash
# コンテナを起動（自動的にサーバーが起動します）
docker-compose up -d

# ログを確認
docker-compose logs -f app
```

サーバーが起動すると、以下のエンドポイントが利用可能になります：

- **ヘルスチェック**: `GET http://localhost:8080/ping`
- **エージェント実行**: `POST http://localhost:8080/invocations`

#### API使用例

```bash
# ヘルスチェック
curl http://localhost:8080/ping
# レスポンス: {"status":"Healthy"}

# エージェントにクエリを送信（非ストリーミング）
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "東京の天気を教えてください"}'
# レスポンス: {"response":"...", "status":"success"}

# エージェントにクエリを送信（ストリーミング）
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "東京の天気を教えてください", "stream": true}'
# レスポンス: text/event-stream (SSE形式)
```

#### AWS Bedrock AgentCore ランタイム対応

このAPIは [AWS Bedrock AgentCore ランタイム](https://docs.aws.amazon.com/marketplace/latest/userguide/bedrock-agentcore-runtime.html)の要件に準拠しています：

- **`/ping` エンドポイント**: ヘルスチェック用のGETエンドポイント（JSON形式のレスポンス）
- **`/invocations` エンドポイント**: エージェント実行用のPOSTエンドポイント
- **ARM64コンテナ**: ARM64アーキテクチャ対応のDockerコンテナ
- **ポート8080**: HTTP通信用のポートを公開
- **ストリーミング対応**: Server-Sent Events (SSE)によるストリーミングレスポンス対応

### CLIモードで実行

CLI形式で実行したい場合は、`src/cli.ts` を使用します。

```bash
# ローカル環境
pnpm run cli

# Docker環境
docker-compose exec app pnpm run cli
```

コンソールには Claude からの応答が表示されます。`src/cli.ts` の `message` やシステムプロンプト、利用するツールを編集することで挙動をカスタマイズできます。

## Agentクラスの使い方

`Agent`クラスは、LangChainエージェントをラップした簡単に使えるAPIを提供します。

### 基本的な使い方

```typescript
import { Agent } from './agent';
import { loadTools } from './tools';

// ツールを読み込み
const tools = await loadTools();

// エージェントのインスタンスを作成
const agent = new Agent({
  model: 'claude-3-7-sonnet-20250219',
  tools,
});

// メッセージを送信して応答を取得
const response = await agent.invoke('東京の天気を教えてください');
console.log(response.content);
```

### 複数のメッセージを使用する

```typescript
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { loadTools } from './tools';

// ツールを読み込み
const tools = await loadTools();

const messages = [
  new HumanMessage('こんにちは'),
  new AIMessage('こんにちは！どのようにお手伝いできますか？'),
  new HumanMessage('天気を教えてください'),
];

const agent = new Agent({
  model: 'claude-3-7-sonnet-20250219',
  tools,
});

const response = await agent.invokeWithMessages(messages);
```

### カスタムツールの追加

```typescript
import { tool } from 'langchain';
import { z } from 'zod';
import { loadTools } from './tools';

// デフォルトのツールを読み込み
const defaultTools = await loadTools();

// カスタムツールを定義
const myCustomTool = tool(
  (input: { name: string }) => {
    return `こんにちは、${input.name}さん！`;
  },
  {
    name: 'greet',
    description: 'ユーザーに挨拶する',
    schema: z.object({
      name: z.string().describe('ユーザーの名前'),
    }),
  }
);

// デフォルトツールとカスタムツールを組み合わせる
const agent = new Agent({
  model: 'claude-3-7-sonnet-20250219',
  tools: [...defaultTools, myCustomTool],
});
```

## ツールの追加

`src/tools` 配下にツールを定義し、`src/tools/index.ts` の配列に追加するとエージェントが利用できるようになります。

### ツールの定義例

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

// Zodスキーマでツールの入力を定義
const weatherSchema = z.object({
  city: z.string(),
});

type WeatherInput = z.infer<typeof weatherSchema>;

// ツールを作成
export const getWeatherTool = tool<typeof weatherSchema>(
  (input: WeatherInput) => {
    const city = input.city;
    return { content: `It's always sunny in ${city}!` };
  },
  {
    name: 'get_weather',
    description: 'Get the weather for a given city',
    schema: weatherSchema,
  }
);
```

## Docker環境での開発

このプロジェクトでは Docker Compose を使用した開発環境を提供しています。

### 基本的な使い方

```bash
# コンテナを起動
docker-compose up -d

# コンテナ内でコマンドを実行
docker-compose exec app pnpm run dev

# コンテナを停止
docker-compose down
```

### node_modulesについて

エディタの型チェックとインテリセンスのために、ホスト上にも `node_modules` をインストールすることを推奨します。

```bash
# ホスト上でインストール（エディタ用）
pnpm install

# コンテナを起動
docker-compose up -d

# コンテナ内で実行（実際の開発作業）
docker-compose exec app pnpm run dev
```

### パッケージの追加

新しいパッケージを追加する場合は、以下の手順で行います：

```bash
# 1. ホスト上で追加（エディタの型チェック用）
pnpm add <package-name>

# 2. コンテナを再ビルド（実行環境に反映）
docker-compose down
docker-compose build
docker-compose up -d
```

## テスト & 品質チェック

### ローカル環境

```bash
pnpm test          # Jest テスト実行
pnpm test:watch    # Jest ウォッチモード
pnpm test:coverage # カバレッジレポート生成
pnpm lint          # ESLint
pnpm lint:fix      # ESLint 自動修正
pnpm format        # Prettier フォーマット
pnpm format:check  # Prettier チェックのみ
```

### Docker環境

```bash
docker-compose exec app pnpm test
docker-compose exec app pnpm lint
docker-compose exec app pnpm format:check
```

## 環境変数リファレンス

| 変数名 | 必須 | 説明 | デフォルト値 |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic ダッシュボードで発行した API キー | - |
| `CLAUDE_MODEL` | ✅ | 使用するモデル ID | `claude-3-7-sonnet-20250219` |
| `PORT` | ⬜️ | Expressサーバーのポート番号 | `8080` |
| `NODE_ENV` | ⬜️ | Node.js の実行モード | `development` |

## AWS Bedrock AgentCore ランタイム準拠

このプロジェクトは [AWS Bedrock AgentCore ランタイム](https://docs.aws.amazon.com/marketplace/latest/userguide/bedrock-agentcore-runtime.html) の要件に完全準拠しています。

### 準拠している要件

| 要件 | ステータス | 実装詳細 |
|------|-----------|----------|
| `/ping` エンドポイント (GET) | ✅ | JSON形式のヘルスチェックレスポンス |
| `/invocations` エンドポイント (POST) | ✅ | エージェント実行用エンドポイント |
| 非ストリーミングレスポンス | ✅ | `{"response": "...", "status": "success"}` 形式 |
| ストリーミングレスポンス | ✅ | Server-Sent Events (SSE) 対応 |
| ARM64 コンテナ | ✅ | `--platform=linux/arm64` 指定 |
| ポート 8080 | ✅ | HTTP通信用ポート公開 |

### エンドポイント仕様

#### `/ping` - ヘルスチェック

```bash
curl http://localhost:8080/ping
```

**レスポンス**:
```json
{"status": "Healthy"}
```

#### `/invocations` - エージェント実行

**非ストリーミング**:
```bash
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "東京の天気を教えてください"}'
```

**レスポンス**:
```json
{
  "response": "エージェントからの応答",
  "status": "success"
}
```

**ストリーミング（実装予定）**:
```bash
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "東京の天気を教えてください", "stream": true}'
```

**レスポンス**: `Content-Type: text/event-stream`
```
data: {"event": "部分的な応答1"}

data: {"event": "部分的な応答2"}

data: {"event": "最終応答"}

```

## AWS環境へのデプロイ

このプロジェクトには、AWS CodePipeline を使用した CI/CD パイプラインが含まれています。

### 前提条件

- AWS CLI がインストールされ、設定されていること
- AWS CDK がインストールされていること（`npm install -g aws-cdk`）
- GitHubアカウントへのアクセス権限

### 1. AWS CodeStar Connection の作成

GitHub との接続を確立するために、AWS CodeStar Connection を作成します。

#### 方法1: AWS CLI で作成

```bash
# GitHub へのConnection作成
aws codestar-connections create-connection \
  --provider-type GitHub \
  --connection-name ts-langchain-agent-github \
  --region ap-northeast-1

# 作成されたConnection ARNをメモ
# 出力例: arn:aws:codestar-connections:ap-northeast-1:123456789012:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### 方法2: AWS コンソールで作成

1. [AWS CodeStar Connections](https://console.aws.amazon.com/codesuite/settings/connections) にアクセス
2. 「接続を作成」をクリック
3. プロバイダーとして「GitHub」を選択
4. 接続名を入力（例: `ts-langchain-agent-github`）
5. 「GitHub に接続」をクリック

#### Connection の承認

**重要**: Connectionを作成後、GitHubでの承認が必要です。

1. AWS コンソールの Connections ページで作成した Connection を選択
2. **「保留中の接続を更新」**（Update pending connection）をクリック
3. GitHub にリダイレクトされるので、アクセスを承認
4. リポジトリへのアクセス権限を付与（特定のリポジトリまたは全リポジトリ）
5. ステータスが **「利用可能」**（Available）になることを確認

#### Connection ARN の取得

```bash
# Connection ARN を確認
aws codestar-connections list-connections --region ap-northeast-1
```

出力例：
```json
{
  "Connections": [
    {
      "ConnectionName": "ts-langchain-agent-github",
      "ConnectionArn": "arn:aws:codestar-connections:ap-northeast-1:123456789012:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "ProviderType": "GitHub",
      "ConnectionStatus": "AVAILABLE"
    }
  ]
}
```

### 2. CDK Context の設定

`infra/cdk.context.json` を作成し、以下の内容を記述します：

```json
{
  "githubOwner": "your-github-username",
  "githubRepo": "ts-langchain-agent",
  "githubBranch": "main",
  "codestarConnectionArn": "arn:aws:codestar-connections:ap-northeast-1:YOUR_ACCOUNT_ID:connection/YOUR_CONNECTION_ID"
}
```

**重要**: 
- `codestarConnectionArn` には、前のステップで取得した Connection ARN を設定してください
- `cdk.context.json` は `.gitignore` に追加されているため、リポジトリにコミットされません

### 3. CDK スタックのデプロイ

```bash
cd infra

# 依存関係のインストール
npm install

# CDK Bootstrap（初回のみ）
cdk bootstrap

# スタックのデプロイ
cdk deploy
```

### 4. デプロイされるリソース

- **CodeStar Connection**: GitHub との接続
- **ECR Repository**: Docker イメージを保存
- **CodeBuild Project**: Docker イメージのビルドと ECR へのプッシュ
- **CodePipeline**: GitHub からのソースコード取得とビルドの自動化

### CI/CD パイプラインの動作

1. GitHub の `main` ブランチにプッシュ
2. CodePipeline が自動的にトリガー（CodeStar Connection 経由）
3. CodeBuild が Docker イメージをビルド
4. ビルドしたイメージを ECR にプッシュ

### Connection の管理

#### Connection の確認

```bash
# Connection一覧を表示
aws codestar-connections list-connections --region ap-northeast-1

# 特定のConnectionの詳細を表示
aws codestar-connections get-connection \
  --connection-arn "arn:aws:codestar-connections:ap-northeast-1:123456789012:connection/xxx" \
  --region ap-northeast-1
```

#### Connection の削除（必要に応じて）

```bash
aws codestar-connections delete-connection \
  --connection-arn "arn:aws:codestar-connections:ap-northeast-1:123456789012:connection/xxx" \
  --region ap-northeast-1
```

### CodeStar Connection の利点

- **セキュリティ**: Personal Access Token を使用せず、OAuth ベースの認証
- **簡単な管理**: AWS がトークンのローテーションを自動処理
- **マルチプロバイダー対応**: GitHub、Bitbucket、GitLab をサポート
- **追加料金なし**: CodePipeline の利用料金のみ（Connection 自体は無料）

## トラブルシューティング

### CDKデプロイ時の「ResourceExistenceCheck」エラー

#### エラー内容
```
❌  CicdPipelineStack failed: ToolkitError: Failed to create ChangeSet cdk-deploy-change-set on CicdPipelineStack: FAILED, 
The following hook(s)/validation failed: [AWS::EarlyValidation::ResourceExistenceCheck]
```

#### 原因
CodeStar Connectionsの接続が以下のいずれかの状態にあります:
1. **PENDING（保留中）**: GitHubアプリの承認が完了していない
2. **存在しない**: 指定されたARNの接続が存在しない
3. **削除済み**: 以前作成した接続が削除されている

#### 解決方法

##### ステップ1: 接続の状態を確認

1. AWS Management Consoleにアクセス:
   ```
   https://ap-northeast-1.console.aws.amazon.com/codesuite/settings/connections
   ```

2. 接続リストで該当の接続を探す
   - 接続名またはARNで検索
   - ステータス列を確認（「利用可能」であるべき）

##### ステップ2: 接続が「保留中」の場合

1. 該当の接続をクリック
2. 「接続を更新」ボタンをクリック
3. GitHubの認証画面で「Authorize AWS Connector for GitHub」をクリック
4. 対象のリポジトリまたは組織へのアクセスを許可
5. ステータスが「利用可能」になるまで待つ（通常は数秒）

##### ステップ3: 接続が存在しない場合

新しい接続を作成します:

1. 「接続を作成」ボタンをクリック
2. 以下の設定を入力:
   - **プロバイダー**: GitHub
   - **接続名**: `github-ts-langchain-agent`（任意の名前）
   - **GitHub Apps**: 「新しいアプリをインストール」を選択
3. GitHubの認証画面で以下を実施:
   - AWS Connector for GitHubアプリをインストール
   - アクセスを許可するリポジトリを選択（`jkawakami-ggwp/ts-langchain-agent`）
4. 接続が作成されたら、ARNをコピー
5. `infra/cdk.context.json`の`codestarConnectionArn`を新しいARNに更新:

```json
{
  "githubOwner": "jkawakami-ggwp",
  "githubRepo": "ts-langchain-agent",
  "githubBranch": "main",
  "codestarConnectionArn": "arn:aws:codestar-connections:ap-northeast-1:886436930346:connection/<新しいID>"
}
```

##### ステップ4: 再デプロイ

```bash
cd infra
cdk deploy
```

### その他のよくあるエラー

#### エラー: 「No credentials found」

AWS CLIの認証情報が設定されていません。

```bash
# プロファイルが設定されているか確認
aws configure list

# プロファイルを設定
aws configure
```

#### エラー: 「Stack already exists」

スタックが既に存在する場合、更新デプロイが必要です。

```bash
# 変更内容を確認
cdk diff

# デプロイ
cdk deploy
```
```
