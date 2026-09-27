import { HttpError } from './http.ts';

const API = 'https://api.mistral.ai/v1';
export const CHAT_MODEL = Deno.env.get('MISTRAL_MODEL') ?? 'mistral-large-latest';

async function mistralFetch(apiKey: string, path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, ...init.headers },
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    console.error(`Mistral ${path} failed`, response.status, await response.text());
    throw new HttpError(502, "Le service d'IA est momentanément indisponible");
  }
  return response;
}

export async function chatJson(
  apiKey: string,
  params: { system: string; user: string; temperature: number },
): Promise<{ content: string; usage: unknown }> {
  const response = await mistralFetch(apiKey, '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
      response_format: { type: 'json_object' },
      temperature: params.temperature,
      max_tokens: 8000,
    }),
  });
  const data = await response.json();
  return { content: data.choices?.[0]?.message?.content ?? '', usage: data.usage };
}

/** Runs the image agent and returns the generated PNG bytes. */
export async function generateImage(apiKey: string, agentId: string, prompt: string): Promise<Uint8Array> {
  const conversation = await (
    await mistralFetch(apiKey, '/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, inputs: prompt }),
    })
  ).json();

  const fileId = findFileId(conversation);
  if (!fileId) {
    console.error('No image file in Mistral conversation', JSON.stringify(conversation));
    throw new HttpError(502, "L'IA n'a pas renvoyé d'image");
  }

  const file = await mistralFetch(apiKey, `/files/${fileId}/content`, { method: 'GET' });
  return new Uint8Array(await file.arrayBuffer());
}

function findFileId(payload: unknown): string | null {
  const outputs = (payload as { outputs?: { content?: unknown }[] })?.outputs;
  if (!Array.isArray(outputs)) return null;
  for (const output of outputs) {
    if (!Array.isArray(output?.content)) continue;
    for (const chunk of output.content as { file_id?: string }[]) {
      if (chunk?.file_id) return chunk.file_id;
    }
  }
  return null;
}
