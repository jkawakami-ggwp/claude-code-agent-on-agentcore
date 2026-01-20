#!/bin/bash

# 使い方を表示する関数
show_usage() {
  echo "使い方: $0 <user-pool-id> <email>"
  echo "例: $0 us-east-1_XXXXXXXXX user@example.com"
  exit 1
}

# 引数のチェック
if [ $# -ne 2 ]; then
  echo "エラー: 引数が不足しています"
  show_usage
fi

USER_POOL_ID=$1
EMAIL=$2

# メールアドレスの形式を簡易チェック
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
  echo "エラー: 有効なメールアドレスを指定してください"
  exit 1
fi

# パスワードを自動生成（16文字、英大小文字、数字、記号を含む）
generate_password() {
  # openssl を使用してランダムなパスワードを生成
  # 英大文字、英小文字、数字、記号を含むパスワード
  local password=$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c 16)
  
  # Cognitoのパスワードポリシーを満たすよう、各文字種を確実に含める
  local upper=$(LC_ALL=C tr -dc 'A-Z' < /dev/urandom | head -c 2)
  local lower=$(LC_ALL=C tr -dc 'a-z' < /dev/urandom | head -c 2)
  local digit=$(LC_ALL=C tr -dc '0-9' < /dev/urandom | head -c 2)
  local special=$(LC_ALL=C tr -dc '!@#$%^&*()_+-=' < /dev/urandom | head -c 2)
  local rest=$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c 8)
  
  # 全てを結合 (macOS互換のためshufを使わずに結合のみ)
  # シャッフルしなくても十分ランダム性は確保されている
  echo "${upper}${lower}${digit}${special}${rest}"
}

PASSWORD=$(generate_password)
TEMP_PASSWORD=$(generate_password)

echo "======================================"
echo "Cognitoユーザーを作成しています..."
echo "======================================"
echo "User Pool ID: $USER_POOL_ID"
echo "Email: $EMAIL"
echo ""

# ユーザーを作成（一時パスワード付き）
echo "ステップ 1/2: ユーザーを作成中..."
CREATE_RESULT=$(aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS 2>&1)

if [ $? -ne 0 ]; then
  echo "エラー: ユーザーの作成に失敗しました"
  echo "$CREATE_RESULT"
  exit 1
fi

echo "✓ ユーザーを作成しました"

# パスワードを永続的に設定
echo "ステップ 2/2: パスワードを設定中..."
PASSWORD_RESULT=$(aws cognito-idp admin-set-user-password \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --password "$PASSWORD" \
  --permanent 2>&1)

if [ $? -ne 0 ]; then
  echo "エラー: パスワードの設定に失敗しました"
  echo "$PASSWORD_RESULT"
  exit 1
fi

echo "✓ パスワードを設定しました"
echo ""
echo "======================================"
echo "✓ ユーザーの作成が完了しました！"
echo "======================================"
echo ""
echo "ログイン情報:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo ""
echo "※ このパスワードは安全に保管してください"
echo "======================================"
