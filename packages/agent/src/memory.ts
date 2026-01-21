import {
  BedrockAgentCoreClient,
  CreateEventCommand,
  CreateEventCommandInput,
  ListEventsCommand,
  ListEventsCommandInput,
  Event,
} from '@aws-sdk/client-bedrock-agentcore';

export type ConversationRole = 'USER' | 'ASSISTANT';

export type ConversationMessage = {
  role: ConversationRole;
  text: string;
  timestamp?: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isConversationRole(value: unknown): value is ConversationRole {
  return value === 'USER' || value === 'ASSISTANT';
}

function getEventPayload(event: Event): unknown[] | undefined {
  const payload = (event as unknown as { payload?: unknown }).payload;
  return Array.isArray(payload) ? payload : undefined;
}

function getEventTimestamp(event: Event): Date | undefined {
  const raw = (event as unknown as { eventTimestamp?: unknown }).eventTimestamp;

  if (raw instanceof Date) return raw;
  if (typeof raw === 'string' || typeof raw === 'number') return new Date(raw);
  return undefined;
}

export class Memory {
  private memoryId: string;
  private client: BedrockAgentCoreClient;

  constructor() {
    this.memoryId = process.env['AWS_AGENTCORE_MEMORY_ID'] ?? '';
    this.client = new BedrockAgentCoreClient({
      region: process.env['AWS_REGION'] ?? 'ap-northeast-1',
    });
  }

  /**
   * セッションの会話履歴を取得
   */
  async listEvents(params: {
    actorId: string;
    sessionId: string;
    maxResults?: number;
  }): Promise<Event[]> {
    // MEMORY_IDが設定されていない場合は空配列を返す
    if (!this.memoryId) {
      console.warn('Memory ID is not set');
      return [];
    }

    try {
      const input: ListEventsCommandInput = {
        memoryId: this.memoryId,
        actorId: params.actorId,
        sessionId: params.sessionId,
        maxResults: params.maxResults ?? 100, // デフォルトは100件
      };

      const command = new ListEventsCommand(input);
      const response = await this.client.send(command);

      const events = response.events ?? [];
      console.log(`[Memory] Retrieved ${events.length} events from session ${params.sessionId}`);

      return events;
    } catch (error) {
      console.error('[Memory] Error listing events:', error);
      throw error;
    }
  }

  async createEvent(params: {
    actorId: string;
    sessionId: string;
    text: string;
    role: ConversationRole;
  }): Promise<void> {
    // MEMORY_IDが設定されていない場合は何もしない
    if (!this.memoryId) {
      console.warn('Memory ID is not set');
      return;
    }

    try {
      const input: CreateEventCommandInput = {
        memoryId: this.memoryId,
        actorId: params.actorId,
        sessionId: params.sessionId,
        eventTimestamp: new Date(),
        payload: [
          {
            conversational: {
              content: { text: params.text },
              role: params.role,
            },
          },
        ],
        clientToken: crypto.randomUUID(),
      };

      const command = new CreateEventCommand(input);
      const response = await this.client.send(command);
      console.log(`[Memory] Created event: ${response.event?.eventId}`);
    } catch (error) {
      console.error('[Memory] Error creating event:', error);
      throw error;
    }
  }

  /**
   * Bedrock AgentCoreのEvent配列から、会話メッセージ（role + text）だけを抽出する。
   * - Eventのメタ情報や構造はSDK/環境で揺れる可能性があるため、安全に取り出す
   * - 会話として使えないEventはスキップする
   */
  toConversationMessages(events: Event[]): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    for (const event of events) {
      const payload = getEventPayload(event);
      if (!payload) continue;

      for (const item of payload) {
        if (!isRecord(item)) continue;
        const conversational = item['conversational'];
        if (!isRecord(conversational)) continue;

        const content = conversational['content'];
        const text = isRecord(content) ? content['text'] : undefined;
        const role = conversational['role'];

        if (typeof text !== 'string' || !isConversationRole(role)) continue;

        const timestamp = getEventTimestamp(event);

        messages.push({
          role,
          text,
          ...(timestamp ? { timestamp } : {}),
        });
      }
    }

    // 可能なら時系列で整列（同一timestampは順序維持）
    const withIndex = messages.map((message, idx) => ({ message, idx }));
    withIndex.sort((a, b) => {
      const at = a.message.timestamp?.getTime();
      const bt = b.message.timestamp?.getTime();

      if (typeof at === 'number' && typeof bt === 'number' && at !== bt) return at - bt;
      if (typeof at === 'number' && typeof bt !== 'number') return -1;
      if (typeof at !== 'number' && typeof bt === 'number') return 1;
      return a.idx - b.idx;
    });
    return withIndex.map(({ message }) => message);
  }
}
