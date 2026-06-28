import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY!,
  baseURL: process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1',
});

const MODEL = 'gemma-4-31b';

export async function callGemma<T>(params: {
  systemPrompt: string;
  userContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  schema: Record<string, unknown>;
  schemaName: string;
}): Promise<T> {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: params.schemaName,
        strict: true,
        schema: params.schema,
      },
    },
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userContent as any },
    ],
  });

  const text = response.choices[0].message.content!;
  return JSON.parse(text) as T;
}
