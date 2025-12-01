import { getCurrentDateTimeTool } from '../getCurrentDateTimeTool';

describe('getCurrentDateTimeTool', () => {
  it('正しい名前を持つこと', () => {
    expect(getCurrentDateTimeTool.name).toBe('get_current_datetime');
  });

  it('正しい説明を持つこと', () => {
    expect(getCurrentDateTimeTool.description).toBe(
      '現在の日時をローカルタイムゾーンの日本語形式で取得します。'
    );
  });

  it('タイムゾーン付きの現在の日時を返すこと', async () => {
    const result = await getCurrentDateTimeTool.invoke({});

    expect(result).toHaveProperty('content');
    expect(typeof result.content).toBe('string');

    const parsed = JSON.parse(result.content);
    expect(parsed).toHaveProperty('datetime');
    expect(parsed).toHaveProperty('timezone');
    expect(parsed.timezone).toBe('local');
  });

  it('日本語形式の日時を返すこと', async () => {
    const result = await getCurrentDateTimeTool.invoke({});
    const parsed = JSON.parse(result.content);

    // 日本語形式の日時は "YYYY/MM/DD HH:MM:SS" のような形式
    expect(parsed.datetime).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });

  it('有効なJSON形式のコンテンツを返すこと', async () => {
    const result = await getCurrentDateTimeTool.invoke({});

    // JSONとしてパース可能であることを確認
    expect(() => JSON.parse(result.content)).not.toThrow();
  });

  it('toLocaleStringを使用して日時をフォーマットすること', async () => {
    // 固定の日時に設定
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2100-12-31T23:59:59'));

    const result = await getCurrentDateTimeTool.invoke({});
    const parsed = JSON.parse(result.content);

    // 日時がフォーマットされていることを確認
    expect(parsed.datetime).toBe('2100/12/31 23:59:59');
    expect(parsed.timezone).toBe('local');

    // タイマーをクリーンアップ
    jest.useRealTimers();
  });

  it('パラメータなしで動作すること', async () => {
    // パラメータなしで呼び出せることを確認
    const result = await getCurrentDateTimeTool.invoke({});
    expect(result).toHaveProperty('content');
  });

  it('複数回呼び出しても一貫した構造を返すこと', async () => {
    const result1 = await getCurrentDateTimeTool.invoke({});
    const result2 = await getCurrentDateTimeTool.invoke({});

    const parsed1 = JSON.parse(result1.content);
    const parsed2 = JSON.parse(result2.content);

    // 両方とも同じ構造を持つことを確認
    expect(Object.keys(parsed1).sort()).toEqual(Object.keys(parsed2).sort());
    expect(parsed1.timezone).toBe(parsed2.timezone);
  });
});
