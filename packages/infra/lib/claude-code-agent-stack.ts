import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";

interface AgentStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ClaudeCodeAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = props;

    // Memory
    const memory = new agentcore.Memory(this, "AgentMemory", {
      memoryName: "claude_code_agent_memory",
      description: "Claude Code Agent Memory",
      expirationDuration: cdk.Duration.days(7),
    });

    // Create an S3 bucket for recordings
    const recordingBucket = new cdk.aws_s3.Bucket(this, "AgentBrowserRecordingBucket", {
      bucketName: `agent-browser-recordings-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // Browser
    const browser = new agentcore.BrowserCustom(this, "AgentBrowser", {
      browserCustomName: "agent_browser",
      description: "Agent Browser with recording enabled",
      networkConfiguration: agentcore.BrowserNetworkConfiguration.usingPublicNetwork(),
      recordingConfig: {
        enabled: true,
        s3Location: {
          bucketName: recordingBucket.bucketName,
          objectKey: "browser-recordings/",
        },
      },
    });

    // Agent Runtime Artifact (Docker ビルド)
    const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
      path.join(__dirname, "../../agent")
    );

    // Secret ManagerからAnthropic API Keyを取得
    const anthropicApiKey = secretsmanager.Secret.fromSecretNameV2(
      this,
      "ClaudeCodeAgentAnthropicApiKey",
      "claude-code-agent/anthropic-api-key"
    );

    // Runtime (Claude Code Agent)
    const runtime = new agentcore.Runtime(this, "AgentRuntime", {
      runtimeName: "ClaudeCodeAgent",
      agentRuntimeArtifact,
      description: "Claude Code Agent",
      authorizerConfiguration: agentcore.RuntimeAuthorizerConfiguration.usingCognito(
        userPool,
        [userPoolClient],
      ),
      environmentVariables: {
        ANTHROPIC_API_KEY: anthropicApiKey.secretValue.unsafeUnwrap(),
        AWS_AGENTCORE_MEMORY_ID: memory.memoryId,
        AWS_AGENTCORE_BROWSER_IDENTIFIER: browser.browserId,
      },
    });

    // Memory へのアクセス権限を Runtime 実行ロールに付与（ListEvents/CreateEvent）
    // これが無いと agent 側の Memory.listEvents/createEvent が 403 になる
    const memoryArn = cdk.Stack.of(this).formatArn({
      service: "bedrock-agentcore",
      resource: "memory",
      resourceName: memory.memoryId,
    });

    const memoryPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["bedrock-agentcore:ListEvents", "bedrock-agentcore:CreateEvent"],
      resources: [memoryArn],
    });

    // Runtime.role は iam.IRole なので addToPrincipalPolicy で付与
    runtime.role.addToPrincipalPolicy(memoryPolicy);
  }
}
