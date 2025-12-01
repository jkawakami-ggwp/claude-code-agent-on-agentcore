import { tool } from 'langchain';
import { z } from 'zod';

const weatherSchema = z.object({
  city: z.string(),
});

type WeatherInput = z.infer<typeof weatherSchema>;

export const getWeatherTool = tool<typeof weatherSchema>(
  (input: WeatherInput) => {
    const city = input.city;
    return { content: `It's always sunny in ${city}!` };
  },
  {
    name: 'get_weather',
    description: 'Get the weather for a given city',
    schema: weatherSchema,
  }
);
