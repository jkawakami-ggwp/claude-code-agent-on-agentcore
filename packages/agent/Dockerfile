# Node.js 20の最新LTSイメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# pnpmをグローバルにインストール
RUN npm install -g pnpm

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml* ./

# 依存関係をインストール（開発用）
RUN pnpm install

# ソースコードをコピー
COPY . .

# ビルド
RUN pnpm build

# ポート8080を公開（AWS Bedrock AgentCore要件）
EXPOSE 8080

# 本番用コマンドを実行
CMD ["pnpm", "start"]
