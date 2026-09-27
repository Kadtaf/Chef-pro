import { aiImageRequestSchema, type AiImageRequest } from '../_shared/ai-schemas.ts';
import { handler, json, requireEnv } from '../_shared/http.ts';
import { generateImage } from '../_shared/mistral.ts';
import { enforceAiQuota, logGeneration, requireAdmin } from '../_shared/supabase.ts';

const BUCKET = 'ai-images';

function buildPrompt({ title, description, plating, category }: AiImageRequest): string {
  return [
    'Photographie culinaire professionnelle, ultra réaliste, style éditorial haut de gamme, lumière naturelle douce.',
    `Sujet : ${title}.`,
    category && `Catégorie : ${category}.`,
    description && `Description : ${description}.`,
    plating && `Dressage : ${plating}.`,
    'Le plat est le sujet principal, cadrage serré, fond sobre, aucun texte ni logo.',
  ]
    .filter(Boolean)
    .join(' ');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

Deno.serve(
  handler(async (req, body) => {
    const { user, admin } = await requireAdmin(req);
    const request = aiImageRequestSchema.parse(body);
    await enforceAiQuota(admin, user.id);

    const prompt = buildPrompt(request);
    const bytes = await generateImage(requireEnv('MISTRAL_API_KEY'), requireEnv('MISTRAL_IMAGE_AGENT_ID'), prompt);

    const path = `${request.folder}/${slugify(request.title)}-${crypto.randomUUID()}.png`;
    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);

    await logGeneration(admin, {
      userId: user.id,
      type: 'image',
      prompt,
      result: { path, publicUrl },
      model: 'mistral-image-agent',
      status: 'success',
    });

    return json(req, { url: publicUrl, path });
  }),
);
