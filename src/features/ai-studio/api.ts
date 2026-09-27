import { useMutation } from '@tanstack/react-query';
import type { AiGenerateRequest, AiImageRequest, AiResult } from '@ai-contract';
import { invokeFunction } from '@/shared/lib/functions';

/** Calls the `ai-generate` edge function; the response is validated server-side. */
export function generateContent<R extends AiGenerateRequest>(
  request: R,
): Promise<{ result: AiResult<R['type']>; generationId: string | null }> {
  return invokeFunction('ai-generate', request);
}

/** Generates a photo, stores it in Supabase Storage and returns its public URL. */
export async function generateImage(request: AiImageRequest): Promise<string> {
  const { url } = await invokeFunction<{ url: string }>('ai-generate-image', request);
  if (!url) throw new Error("Aucune image n'a été générée");
  return url;
}

export function useGenerateImage() {
  return useMutation({ meta: { successMessage: 'Image générée' }, mutationFn: generateImage });
}
