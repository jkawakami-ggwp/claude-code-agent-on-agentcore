import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';

// CI/CD パイプライン（ECR プッシュまで）
export class CicdPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===== GitHub 設定（cdk.context.json の context から取得）=====
    const githubOwner = this.node.tryGetContext('githubOwner');
    const githubRepo = this.node.tryGetContext('githubRepo');
    const githubBranch = this.node.tryGetContext('githubBranch');
    const connectionArn = this.node.tryGetContext('codestarConnectionArn');

    // ===== ECR リポジトリ =====
    const repository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: 'ts-langchain-agent',
      removalPolicy: cdk.RemovalPolicy.RETAIN, // 削除時もイメージを保持
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
        },
      ],
    });

    // ===== CodeBuild プロジェクト（Docker build & ECR push）=====
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      // リポジトリルートからの相対パスで buildspec の場所を指定
      // ここでは infra/buildspec.yml を利用する
      buildSpec: codebuild.BuildSpec.fromSourceFilename('infra/buildspec.yml'),
      environment: {
        buildImage: codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        computeType: codebuild.ComputeType.SMALL, // ARM64環境用のコンピュートタイプ
        privileged: true, // Docker build / push に必要
      },
      environmentVariables: {
        REPOSITORY_URI: {
          value: repository.repositoryUri,
        },
        AWS_DEFAULT_REGION: {
          value: this.region,
        },
        AWS_ACCOUNT_ID: {
          value: this.account,
        },
      },
    });

    // CodeBuild ロールに ECR への push 権限を付与
    repository.grantPullPush(buildProject.role!);

    // ===== CodePipeline =====
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'LangChainAgent-ECR-Pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new cpactions.CodeStarConnectionsSourceAction({
              actionName: 'GitHub_Source',
              owner: githubOwner,
              repo: githubRepo,
              branch: githubBranch,
              connectionArn: connectionArn,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new cpactions.CodeBuildAction({
              actionName: 'Build_and_Push_Image',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ],
    });

    // ===== Outputs =====
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'RepositoryName', {
      value: repository.repositoryName,
      description: 'ECR Repository Name',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline Name',
    });
  }
}


