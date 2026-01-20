import { query } from '@anthropic-ai/claude-agent-sdk';

/**
 * Claude Code Agentをラップするクラス
 * メッセージの管理、エージェントの実行を簡素化
 */
export class Agent {
  /**
   * ユーザーメッセージを送信してエージェントから応答を取得
   * @param prompt ユーザーメッセージ
   * @returns エージェントの応答テキスト
   */
  async invoke(prompt: string): Promise<string> {
    console.log('[Agent] prompt:', { prompt });

    let response = '';
    for await (const message of query({
      prompt: prompt,
      options: { allowedTools: [] },
    })) {
      console.log('[Agent] message:', message);

      // 結果メッセージのみを処理
      if (message.type !== 'result') continue;

      // 成功時のみresultプロパティが存在する
      if (message.subtype === 'success') {
        response = message.result;
      } else {
        throw new Error(message.errors.join(', '));
      }
    }

    return response;
  }
}
