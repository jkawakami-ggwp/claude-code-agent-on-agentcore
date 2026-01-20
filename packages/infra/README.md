# Infrastructure (AWS CDK)

AWS Bedrock Agent と Cognito 認証を使用したエージェントのインフラストラクチャ。

## スタック構成

- **AuthStack**: Cognito User Pool と OAuth 設定
- **AgentStack**: Bedrock Agent Runtime (Docker コンテナ)

## 事前準備

### 必須：シークレットの設定

デプロイ前に、AWS Secrets Managerで以下のシークレットを作成する必要があります：

```bash
# Anthropic API Key の設定
aws secretsmanager create-secret \
  --name claude-code-agent/anthropic-api-key \
  --secret-string "your-anthropic-api-key-here"
```

または、AWS Management Consoleから作成：
1. AWS Secrets Manager コンソールを開く
2. 「新しいシークレットを保存」をクリック
3. シークレットタイプ：「その他のシークレット」
4. キー/値：
   - プレーンテキストタブで直接APIキーを入力
5. シークレット名：`claude-code-agent/anthropic-api-key`

## デプロイ

```bash
# 依存関係のインストール
pnpm install

# デプロイ
npx cdk deploy --all
```

## 環境変数（任意）

デフォルトは `http://localhost:3000` です。本番環境では以下を設定してください：

```bash
export APP_URL=https://your-app-domain.com
export CALLBACK_PATH=/api/auth/callback/cognito
```

## コマンド

- `npx cdk deploy --all` - すべてのスタックをデプロイ
- `npx cdk diff` - 変更内容を確認
- `npx cdk synth` - CloudFormation テンプレートを生成
- `npx cdk destroy --all` - すべてのスタックを削除
