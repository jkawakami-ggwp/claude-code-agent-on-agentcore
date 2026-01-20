#!/opt/homebrew/opt/node/bin/node
import * as cdk from "aws-cdk-lib";
import { ClaudeCodeAgentAuthStack } from "../lib/claude-code-agent-auth-stack";
import { ClaudeCodeAgentStack } from "../lib/claude-code-agent-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

const authStack = new ClaudeCodeAgentAuthStack(app, "ClaudeCodeAgentAuthStack", { env });

const sharedAuthResources = {
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
};

new ClaudeCodeAgentStack(app, "ClaudeCodeAgentStack", {
  env,
  ...sharedAuthResources,
});
