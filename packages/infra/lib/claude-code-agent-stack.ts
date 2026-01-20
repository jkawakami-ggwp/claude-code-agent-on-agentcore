import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha";
import * as cognito from "aws-cdk-lib/aws-cognito";

interface AgentStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ClaudeCodeAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AgentStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = props;

    // Agent Runtime Artifact (Docker ビルド)
    const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
      path.join(__dirname, "../../agent")
    );

    // Runtime (Claude Code Agent)
    const runtime = new agentcore.Runtime(this, "AgentRuntime", {
      runtimeName: "ClaudeCodeAgent",
      agentRuntimeArtifact,
      description: "Claude Code Agent",
      authorizerConfiguration: agentcore.RuntimeAuthorizerConfiguration.usingCognito(
        userPool.userPoolId,
        userPoolClient.userPoolClientId,
      ),
      environmentVariables: {
        // TODO: Runtime Environment Variables を 設定する
        ANTHROPIC_API_KEY: "",
        CLAUDE_MODEL: "",
        NODE_ENV: "",
      },
    });
  }
}
