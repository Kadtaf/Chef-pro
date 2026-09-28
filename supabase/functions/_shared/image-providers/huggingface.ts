import { providerFetch, type AspectRatio, type ImageProvider } from './common.ts';

const MODEL = 'black-forest-labs/FLUX.1-schnell';

/** Dimensions per ratio (multiples of 64, ~1 megapixel as FLUX expects). */
const SIZES: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1344, height: 768 },
  '3:2': { width: 1216, height: 832 },
  '4:5': { width: 896, height: 1088 },
  '1:1': { width: 1024, height: 1024 },
};

/**
 * Hugging Face Inference Providers — FLUX.1 [schnell]. Small free monthly
 * credits: last-resort fallback. Returns the raw image bytes (usually JPEG).
 */
export const huggingFaceProvider: ImageProvider = {
  id: 'huggingface',
  label: 'Hugging Face',
  isConfigured: () => !!Deno.env.get('HUGGINGFACE_API_TOKEN'),
  async generate(brief) {
    const response = await providerFetch(
      'Hugging Face',
      `https://router.huggingface.co/hf-inference/models/${MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('HUGGINGFACE_API_TOKEN')}`,
          'Content-Type': 'application/json',
          Accept: 'image/*',
        },
        body: JSON.stringify({
          inputs: `${brief.prompt} Avoid: ${brief.negativePrompt}.`,
          parameters: { ...SIZES[brief.aspectRatio], num_inference_steps: 4 },
        }),
      },
      45_000,
    );
    return { bytes: new Uint8Array(await response.arrayBuffer()), model: `huggingface:${MODEL}` };
  },
};
