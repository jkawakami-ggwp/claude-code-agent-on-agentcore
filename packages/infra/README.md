# CDK Infrastructure for ts-langchain-agent

このディレクトリには、CI/CD パイプライン（CodePipeline + CodeBuild + ECR）を構築する CDK コードが含まれています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. コンテキスト設定ファイルの作成

`cdk.context.json.example` をコピーして `cdk.context.json` を作成し、実際の値を設定してください：

```bash
cp cdk.context.json.example cdk.context.json
```

`cdk.context.json` に以下の値を設定：

- `githubOwner`: GitHub のユーザー名または Organization 名
- `githubRepo`: リポジトリ名
- `githubBranch`: 監視するブランチ名（通常は `main`）
- `codestarConnectionArn`: AWS CodeStar Connections の ARN（GitHub との接続）

### 3. デプロイ

```bash
npx cdk deploy
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## セキュリティ

`cdk.context.json` には機密情報（AWS リソース ARN など）が含まれるため、Git リポジトリにはコミットしないでください。
このファイルは `.gitignore` で除外されています。
