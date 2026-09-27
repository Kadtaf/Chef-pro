import { env } from './env';
import { slugify } from './format';
import { supabase } from './supabase';

export const MEDIA_BUCKET = 'ai-images';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Uploads an image picked by an admin and returns its public URL. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Format accepté : PNG, JPEG ou WebP.');
  if (file.size > MAX_BYTES) throw new Error('Image trop lourde (10 Mo maximum).');

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const path = `${folder}/${base}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Resized variant served by Supabase image transformations. They require the
 * Pro plan, so they are opt-in (VITE_SUPABASE_IMAGE_TRANSFORMS=true); otherwise
 * — and for external images — the original URL is returned.
 */
export function imageUrl(url: string | null | undefined, width?: number): string | undefined {
  if (!url) return undefined;
  if (!width || !env.VITE_SUPABASE_IMAGE_TRANSFORMS || !url.includes('/storage/v1/object/public/')) return url;
  return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=${width}&resize=cover&quality=75`;
}
