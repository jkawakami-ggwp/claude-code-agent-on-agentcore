import { config as loadEnv } from 'dotenv';
import express, { Request, Response } from 'express';
import { Agent } from './agent';

loadEnv();

const app = express();
app.use(express.json());

// ヘルスチェック用エンドポイント（AWS Bedrock AgentCore要件）
app.get('/ping', (_req: Request, res: Response) => {
  res.json({ status: 'Healthy' });
});

// AIエージェントを呼び出すエンドポイント（AWS Bedrock AgentCore要件に準拠）
app.post('/invocations', async (req: Request, res: Response): Promise<void> => {
  const { prompt, actorId, sessionId } = req.body as {
    prompt?: string;
    actorId?: string;
    sessionId?: string;
  };

  if (!prompt) {
    res.status(400).json({
      response: 'プロンプトが必要です',
      status: 'error',
    });
    return;
  }

  try {
    const resolvedActorId = actorId?.trim() ? actorId.trim() : 'anonymous';
    const resolvedSessionId = sessionId?.trim() ? sessionId.trim() : crypto.randomUUID();

    // Agentクラスのインスタンスを作成
    const agent = new Agent();

    // エージェントにメッセージを送信して応答を取得
    const response = await agent.invoke(prompt, resolvedActorId, resolvedSessionId);

    // 応答を返す（AWS Bedrock AgentCore形式）
    if (!response) {
      res.json({
        response: '(応答なし)',
        status: 'success',
        actorId: resolvedActorId,
        sessionId: resolvedSessionId,
      });
      return;
    }

    res.json({
      response: response,
      status: 'success',
      actorId: resolvedActorId,
      sessionId: resolvedSessionId,
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
