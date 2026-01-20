import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class ClaudeCodeAgentAuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 環境変数から各種URLを取得
    // デフォルトはローカル開発環境用
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const callbackPath = process.env.CALLBACK_PATH || "/api/auth/callback/cognito";

    // Cognito User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      // User Poolの名前（任意、デフォルト: 自動生成）
      userPoolName: "ClaudeCodeAgentUserPool",

      // サインインに使用する識別子（任意、デフォルト: username）
      // email: メールアドレスでサインイン可能
      signInAliases: { email: true },

      // ユーザー自身がサインアップできるか（任意、デフォルト: false）
      selfSignUpEnabled: false,

      // 自動検証する属性（任意、デフォルト: なし）
      // email: メールアドレスを自動検証
      autoVerify: { email: true },

      // パスワードポリシー（任意、デフォルト: AWS推奨ポリシー）
      passwordPolicy: {
        minLength: 8, // 最小文字数（デフォルト: 8）
        requireLowercase: true, // 小文字必須（デフォルト: true）
        requireUppercase: false, // 大文字必須（デフォルト: true）
        requireDigits: false, // 数字必須（デフォルト: true）
        requireSymbols: false, // 記号必須（デフォルト: true）
      },

      // 標準属性の設定（任意、デフォルト: なし）
      standardAttributes: {
        email: {
          required: true, // この属性を必須にするか（デフォルト: false）
          mutable: true, // ユーザーが後で変更できるか（デフォルト: true）
        },
      },
    });

    // Cognito User Pool Domain (必須: OAuth用)
    this.userPoolDomain = this.userPool.addDomain("UserPoolDomain", {
      cognitoDomain: {
        domainPrefix: `claude-code-agent-${this.account}`,
      },
    });

    // Cognito User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      // クライアント名（任意、デフォルト: 自動生成）
      userPoolClientName: "ClaudeCodeAgentUserPoolClient",

      // 関連付けるUser Pool（必須）
      userPool: this.userPool,

      // クライアントシークレットを生成するか（任意、デフォルト: false）
      // NextAuthのOAuth使用時は必須
      generateSecret: true,

      // 認証フロー（任意、デフォルト: すべてfalse）
      authFlows: {
        userPassword: true, // ユーザー名とパスワードでの認証を許可
        userSrp: true, // Secure Remote Protocol (SRP) 認証を許可（推奨）
      },

      // OAuth設定（任意、デフォルト: なし）
      oAuth: {
        // OAuthフロー（必須: oAuthを使用する場合）
        flows: {
          authorizationCodeGrant: true, // 認可コードグラント（最も安全な方式）
        },
        // OAuthスコープ（必須: oAuthを使用する場合）
        scopes: [
          cognito.OAuthScope.EMAIL, // メールアドレスへのアクセス
          cognito.OAuthScope.OPENID, // OpenID Connect（必須）
          cognito.OAuthScope.PROFILE, // プロフィール情報へのアクセス
        ],
        // コールバックURL（必須: oAuthを使用する場合）
        // 認証成功後にリダイレクトされるURL
        callbackUrls: [`${appUrl}${callbackPath}`],
        // ログアウトURL（任意、デフォルト: なし）
        // ログアウト後にリダイレクトされるURL
        logoutUrls: [appUrl],
      },

      // サポートする Identity Provider（任意、デフォルト: COGNITO）
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO, // Cognito User Pool
      ],
    });

    // Outputs
    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
      exportName: "UserPoolClientId",
    });

    new CfnOutput(this, "CognitoIssuer", {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
      description: "Cognito Issuer URL for NextAuth",
      exportName: "CognitoIssuer",
    });
  }
}
