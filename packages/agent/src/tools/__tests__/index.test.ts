import { loadTools } from '../index';
import { getWeatherTool } from '../getWeatherTool';
import { getCurrentDateTimeTool } from '../getCurrentDateTimeTool';

describe('tools', () => {
  describe('loadTools', () => {
    it('非同期にツールをロードすること', async () => {
      const tools = await loadTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThanOrEqual(2);
    });

    it('基本ツールを含むこと', async () => {
      const tools = await loadTools();
      expect(tools).toContain(getWeatherTool);
      expect(tools).toContain(getCurrentDateTimeTool);
    });

    it('すべてのツールが必要なプロパティを持つこと', async () => {
      const tools = await loadTools();
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('schema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
      });
    });

    it('すべてのツール名がユニークであること', async () => {
      const tools = await loadTools();
      const toolNames = tools.map((tool) => tool.name);
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });

    it('すべてのツールがinvokeメソッドで呼び出し可能であること', async () => {
      const tools = await loadTools();
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('invoke');
        expect(typeof tool.invoke).toBe('function');
      });
    });
  });
});
