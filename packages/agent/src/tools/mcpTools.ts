import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';

export const loadMcpTools = async (): Promise<StructuredToolInterface[]> => {
  // AWS Knowledge MCP Server を mcp-remote 経由で接続
  const client = new MultiServerMCPClient({
    mcpServers: {
      'aws-knowledge-mcp-server': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', 'mcp-remote', 'https://knowledge-mcp.global.api.aws'],
      },
    },
  });

  const tools = await client.getTools();

  return tools;
};
