import Cerebras from '@cerebras/cerebras_cloud_sdk';
import fs from 'fs';
import path from 'path';

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
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
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userContent as any },
    ],
  }) as any;

  let text = response.choices[0].message.content || '{}';
  
  // Log request/response for debugging
  const logPath = path.join(process.cwd(), 'llm_debug.txt');
  const sanitizedUserContent = params.userContent.map(item => 
    item.type === 'image_url' 
      ? { type: 'image_url', image_url: { url: item.image_url.url.substring(0, 100) + '...' } }
      : item
  );
  const logEntry = `
========================================
[${new Date().toISOString()}] Model Call to ${MODEL}
System Prompt: ${params.systemPrompt}
User Content: ${JSON.stringify(sanitizedUserContent, null, 2)}
Response: ${text}
========================================\n`;
  fs.appendFileSync(logPath, logEntry, 'utf-8');

  // Strip markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  return JSON.parse(text) as T;
}
