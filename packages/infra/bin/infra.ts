#!/opt/homebrew/opt/node/bin/node
import * as cdk from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { AgentStack } from "../lib/agent-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

const authStack = new AuthStack(app, "AuthStack", { env });

const sharedAuthResources = {
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
};

new AgentStack(app, "AgentStack", {
  env,
  ...sharedAuthResources,
});
