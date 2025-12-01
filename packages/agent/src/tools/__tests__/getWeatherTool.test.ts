import { getWeatherTool } from '../getWeatherTool';

describe('getWeatherTool', () => {
  it('正しい名前を持つこと', () => {
    expect(getWeatherTool.name).toBe('get_weather');
  });

  it('正しい説明を持つこと', () => {
    expect(getWeatherTool.description).toBe('Get the weather for a given city');
  });

  it('指定された都市の天気情報を返すこと', async () => {
    const result = await getWeatherTool.invoke({ city: 'Tokyo' });
    expect(result).toEqual({ content: "It's always sunny in Tokyo!" });
  });

  it('異なる都市の天気情報を返すこと', async () => {
    const result1 = await getWeatherTool.invoke({ city: 'London' });
    expect(result1).toEqual({ content: "It's always sunny in London!" });

    const result2 = await getWeatherTool.invoke({ city: 'New York' });
    expect(result2).toEqual({ content: "It's always sunny in New York!" });
  });

  it('特殊文字を含む都市名を処理できること', async () => {
    const result = await getWeatherTool.invoke({ city: 'São Paulo' });
    expect(result).toEqual({ content: "It's always sunny in São Paulo!" });
  });

  it('入力スキーマを検証すること', async () => {
    // Zodスキーマは文字列を要求するため、無効な入力はエラーになるはず
    await expect(getWeatherTool.invoke({ city: 123 } as any)).rejects.toThrow();
  });

  it('cityパラメータが必須であること', async () => {
    // cityパラメータが必須であることを確認
    await expect(getWeatherTool.invoke({} as any)).rejects.toThrow();
  });
});
