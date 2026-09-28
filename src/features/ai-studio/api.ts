import { useMutation } from '@tanstack/react-query';
import type { AiGenerateRequest, AiImageRequest, AiResult } from '@ai-contract';
import { toast } from 'sonner';
import { invokeFunction } from '@/shared/lib/functions';

/** Backup photo services (see supabase/functions/_shared/image-provider.ts). */
const FALLBACK_LABELS: Record<string, string> = {
  cloudflare: 'Cloudflare (FLUX)',
  huggingface: 'Hugging Face (FLUX)',
};

/** Backup writing services (see supabase/functions/_shared/text-provider.ts). */
const TEXT_FALLBACK_LABELS: Record<string, string> = {
  groq: 'Groq (Llama 3.3)',
  cloudflare: 'Cloudflare (Llama 3.3)',
};

/**
 * Calls the `ai-generate` edge function; the response is validated server-side.
 * The server switches to backup services when Gemini is overloaded.
 */
export async function generateContent<R extends AiGenerateRequest>(
  request: R,
): Promise<{ result: AiResult<R['type']>; generationId: string | null }> {
  const response = await invokeFunction<{
    result: AiResult<R['type']>;
    generationId: string | null;
    provider?: string;
  }>('ai-generate', request);
  const fallback = response.provider && TEXT_FALLBACK_LABELS[response.provider];
  if (fallback) toast.info(`Gemini étant surchargé, le texte a été rédigé par ${fallback}`);
  return response;
}

/**
 * Generates a photo, stores it in Supabase Storage and returns its public URL.
 * The server falls back to free services when the main one is unavailable.
 */
export async function generateImage(request: AiImageRequest): Promise<string> {
  const { url, provider } = await invokeFunction<{ url: string; provider?: string }>('ai-generate-image', request);
  if (!url) throw new Error("Aucune image n'a été générée");
  const fallback = provider && FALLBACK_LABELS[provider];
  if (fallback) toast.info(`Photo générée par le service de secours ${fallback}`);
  return url;
}

export function useGenerateImage() {
  return useMutation({ meta: { successMessage: 'Image générée' }, mutationFn: generateImage });
}
