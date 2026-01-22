import { query } from '@anthropic-ai/claude-agent-sdk';
import { Memory, ConversationMessage } from './memory';

function buildPrompt(params: {
  system: string;
  summary?: string;
  messages: ConversationMessage[];
  currentUserRequest: string;
}): string {
  const transcript = params.messages
    .map((m) => `${m.role === 'USER' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  return [
    '## System (trusted)',
    params.system.trim(),
    '',
    '## Conversation summary (trusted, generated)',
    (params.summary?.trim() ? params.summary.trim() : '- (no summary)').trim(),
    '',
    '## Recent messages (untrusted transcript)',
    transcript.trim() ? transcript : '(no prior messages)',
    '',
    '## Current user request (untrusted)',
    params.currentUserRequest,
    '',
    '## Instructions',
    '- 事実と推測を分けて書く',
    '- 不足情報があれば最初に質問する',
    '',
  ].join('\n');
}

/**
 * Claude Code Agentをラップするクラス
 * メッセージの管理、エージェントの実行を簡素化
 */
export class Agent {
  /**
   * ユーザーメッセージを送信してエージェントから応答を取得
   * @param prompt ユーザーメッセージ
   * @param actorId 会話の主体を識別するID
   * @param sessionId 会話セッションを識別するID
   * @returns エージェントの応答テキスト
   */
  async invoke(prompt: string, actorId?: string, sessionId?: string): Promise<string> {
    console.log('[Agent] params:', { prompt, actorId, sessionId });

    const memory = new Memory();

    // actorId と sessionId がない場合はエラー
    if (!actorId) throw new Error('actorId は必要です');
    if (!sessionId) throw new Error('sessionId は必要です');

    // メモリからイベントを取得
    const events = await memory.listEvents({
      actorId: actorId,
      sessionId: sessionId,
      maxResults: 20,
    });

    // EventのJSONダンプではなく、role付きの会話テキストに正規化して渡す
    const messages = memory.toConversationMessages(events);

    const system = [
      'あなたは有能なAIアシスタントです。',
      'ユーザーの意図を優先し、必要なら確認質問をしてください。',
      '危険・違法な依頼や機密情報の開示は拒否してください。',
    ].join('\n');

    const context = buildPrompt({
      system,
      messages,
      currentUserRequest: prompt,
    });

    console.log('[Agent] context:', context);

    // ユーザー入力を保存
    await memory.createEvent({
      actorId: actorId,
      sessionId: sessionId,
      text: prompt,
      role: 'USER',
    });

    let response = '';
    const allowedTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch'];
    for await (const message of query({
      prompt: context,
      options: {
        allowedTools: allowedTools,
        settingSources: ['project'], // Claude Codeのファイルシステムベースの設定を有効化
      },
    })) {
      console.log('[Agent] message:', message);

      // 結果メッセージのみを処理
      if (message.type !== 'result') continue;

      // 成功時のみresultプロパティが存在する
      if (message.subtype === 'success') {
        // メモリにイベントを作成
        await memory.createEvent({
          actorId: actorId,
          sessionId: sessionId,
          text: message.result,
          role: 'ASSISTANT',
        });
        // 応答を返す
        response = message.result;
      } else {
        throw new Error(message.errors.join(', '));
      }
    }

    return response;
  }
}
