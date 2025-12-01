import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createAgent } from 'langchain';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * エージェントの設定オプション
 */
export interface AgentConfig {
  /** 使用するClaudeモデル名 */
  model: string;
  /** 使用するツールの配列 */
  tools: StructuredToolInterface[];
}

/**
 * エージェントの応答
 */
export interface AgentResponse {
  /** 応答テキスト */
  content: string;
  /** すべてのメッセージ履歴 */
  messages: BaseMessage[];
}

/**
 * LangChainエージェントをラップするクラス
 * メッセージの管理、エージェントの実行を簡素化
 */
export class Agent {
  private readonly model: string;
  private readonly systemMessage =
    'あなたは親切なAIアシスタントです。適切なツールを使用して回答してください。';
  private readonly tools: StructuredToolInterface[];

  constructor(config: AgentConfig) {
    this.model = config.model;
    this.tools = config.tools;
  }

  /**
   * ユーザーメッセージを送信してエージェントから応答を取得
   * @param message ユーザーメッセージ
   * @returns エージェントの応答
   */
  async invoke(message: string): Promise<AgentResponse> {
    const agent = createAgent({
      model: this.model,
      tools: this.tools,
    });

    const response = await agent.invoke({
      messages: [new SystemMessage(this.systemMessage), new HumanMessage(message)],
    });

    // 最後のAIメッセージを取得
    const lastAiMessage = [...response.messages]
      .reverse()
      .find((msg) => msg.constructor.name === 'AIMessage') as AIMessage | undefined;

    return {
      content: (lastAiMessage?.content as string) || '',
      messages: response.messages,
    };
  }
}
