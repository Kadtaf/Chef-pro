import { aiImageRequestSchema, type AiImageRequest } from '../_shared/ai-schemas.ts';
import { handler, json } from '../_shared/http.ts';
import { generateImage, IMAGE_MODEL, stabilityKey, type AspectRatio } from '../_shared/stability.ts';
import { enforceAiQuota, logGeneration, requireAdmin } from '../_shared/supabase.ts';

const BUCKET = 'ai-images';

/** Stable Image models understand English best; French dish names are kept as-is. */
const AMBIANCES: Record<NonNullable<AiImageRequest['ambiance']>, string> = {
  editorial:
    'high-end editorial food photography for a gastronomy magazine, soft natural window light, refined porcelain plate, linen napkin, shallow depth of field',
  bistrot: 'warm French bistro atmosphere, marble table, vintage cutlery, golden afternoon light, cosy and generous',
  rustique: 'rustic setting, weathered oak table, stoneware, raw linen, natural daylight, seasonal produce around',
  minimaliste: 'minimalist composition, light neutral background, clean negative space, soft diffused light',
  'clair-obscur': 'chiaroscuro food photography, dark slate background, dramatic side light, deep shadows, moody',
};

/** What to show depends on where the image is used. */
const SUBJECTS: Record<AiImageRequest['folder'], (r: AiImageRequest) => string> = {
  recipes: (r) => `a plated dish of "${r.title}", the dish is the hero, tight framing, 45 degree angle`,
  'technical-sheets': (r) => `a professionally plated restaurant dish of "${r.title}", tight framing`,
  menus: (r) => `an elegant restaurant table set for the menu "${r.title}", several refined dishes`,
  cards: (r) => `a restaurant table showcasing dishes from the menu card "${r.title}"`,
  articles: (r) =>
    `close-up of a chef's hands performing the culinary technique "${r.title}" in a professional kitchen`,
  career: (r) =>
    `ambiance of a professional French restaurant kitchen evoking "${r.title}", stainless steel, copper pans, no identifiable faces, no signage`,
  seasons: (r) => `still life of fresh seasonal produce for "${r.title}" on a market stall`,
};

const DEFAULT_RATIO: Record<AiImageRequest['folder'], AspectRatio> = {
  recipes: '3:2',
  'technical-sheets': '3:2',
  menus: '16:9',
  cards: '16:9',
  articles: '16:9',
  career: '4:5',
  seasons: '16:9',
};

const NEGATIVE_PROMPT =
  'text, letters, watermark, logo, signature, brand, cartoon, illustration, 3d render, painting, deformed food, plastic look, oversaturated, blurry, low quality, extra fingers, distorted hands';
/** Added for single-dish photos only (menus legitimately show several plates). */
const DISH_NEGATIVE = ', unrelated ingredients, different dish, multiple plates';

/** Folders whose photo must depict one specific dish. */
const DISH_FOLDERS = new Set<AiImageRequest['folder']>(['recipes', 'technical-sheets']);

function buildPrompt(r: AiImageRequest): string {
  const dish = DISH_FOLDERS.has(r.folder);
  return [
    `Photorealistic professional food photograph: ${SUBJECTS[r.folder](r)}.`,
    // The English brief comes first: it is what the image model follows best.
    r.brief && `What the plate looks like: ${r.brief}`,
    r.ingredients?.length && `Main visible ingredients (French names): ${r.ingredients.join(', ')}.`,
    dish &&
      'The photo must depict exactly this dish with these ingredients, faithful to the recipe: no unrelated food, no extra garnish, no other dishes.',
    r.description && `Dish description (French): ${r.description}.`,
    r.plating && `Plating (French): ${r.plating}.`,
    r.category && `Course: ${r.category}.`,
    r.cuisine && `Cuisine style: ${r.cuisine}.`,
    `Mood: ${AMBIANCES[r.ambiance ?? 'editorial']}.`,
    'Appetizing, true-to-life textures and colours, sharp focus on the food, shot on a full-frame camera with a 100mm macro lens.',
  ]
    .filter(Boolean)
    .join(' ');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

Deno.serve(
  handler(async (req, body) => {
    const { user, admin } = await requireAdmin(req);
    const request = aiImageRequestSchema.parse(body);
    const apiKey = stabilityKey();
    await enforceAiQuota(admin, user.id);

    const prompt = buildPrompt(request);
    const bytes = await generateImage(apiKey, {
      prompt,
      negativePrompt: NEGATIVE_PROMPT + (DISH_FOLDERS.has(request.folder) ? DISH_NEGATIVE : ''),
      aspectRatio: request.aspect_ratio ?? DEFAULT_RATIO[request.folder],
    });

    const path = `${request.folder}/${slugify(request.title)}-${crypto.randomUUID()}.webp`;
    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/webp',
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
      model: IMAGE_MODEL,
      status: 'success',
    });

    return json(req, { url: publicUrl, path });
  }),
);
