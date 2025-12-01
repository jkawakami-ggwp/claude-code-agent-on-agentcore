import { tool } from 'langchain';
import { z } from 'zod';

const dateTimeSchema = z.object({});

export const getCurrentDateTimeTool = tool<typeof dateTimeSchema>(
  () => {
    const now = new Date();
    const datetime = now.toLocaleString('ja-JP');

    return {
      content: JSON.stringify({
        datetime,
        timezone: 'local',
      }),
    };
  },
  {
    name: 'get_current_datetime',
    description: '現在の日時をローカルタイムゾーンの日本語形式で取得します。',
    schema: dateTimeSchema,
  }
);
