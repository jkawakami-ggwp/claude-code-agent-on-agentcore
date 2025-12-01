import { config as loadEnv } from 'dotenv';
import express, { Request, Response } from 'express';
import { Agent } from './agent';
import { loadTools } from './tools';

loadEnv();

const app = express();
app.use(express.json());

// ヘルスチェック用エンドポイント（AWS Bedrock AgentCore要件）
app.get('/ping', (_req: Request, res: Response) => {
  res.json({ status: 'Healthy' });
});

// AIエージェントを呼び出すエンドポイント（AWS Bedrock AgentCore要件に準拠）
app.post('/invocations', async (req: Request, res: Response): Promise<void> => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({
      response: 'プロンプトが必要です',
      status: 'error',
    });
    return;
  }

  try {
    // ツールを読み込み
    const tools = await loadTools();

    // Agentクラスのインスタンスを作成
    const agent = new Agent({
      model: process.env['CLAUDE_MODEL'] as string,
      tools,
    });

    // エージェントにメッセージを送信して応答を取得
    const response = await agent.invoke(prompt);

    // 応答を返す（AWS Bedrock AgentCore形式）
    if (!response.content) {
      res.json({
        response: '(応答なし)',
        status: 'success',
      });
      return;
    }

    res.json({
      response: response.content,
      status: 'success',
    });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).json({
      response: 'エージェントの実行中にエラーが発生しました',
      status: 'error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// サーバーを起動
const PORT = process.env['PORT'] || 8080;
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`ヘルスチェック: http://localhost:${PORT}/ping`);
  console.log(`エージェント実行: POST http://localhost:${PORT}/invocations`);
});
