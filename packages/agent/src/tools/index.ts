import { getWeatherTool } from './getWeatherTool';
import { getCurrentDateTimeTool } from './getCurrentDateTimeTool';
import { loadMcpTools } from './mcpTools';
import type { StructuredToolInterface } from '@langchain/core/tools';

// MCP ツールは動的に読み込むため、非同期関数として提供
export const loadTools = async (): Promise<StructuredToolInterface[]> => {
  const mcpToolsList = await loadMcpTools();
  return [...mcpToolsList, getWeatherTool, getCurrentDateTimeTool];
};
