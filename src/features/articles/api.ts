import { useQuery } from '@tanstack/react-query';
import { createCrud } from '@/shared/lib/crud';
import { supabase } from '@/shared/lib/supabase';
import type { Tables } from '@/shared/types/database';

export type Article = Tables<'articles'>;
export type ArticleKind = 'technique' | 'conseil';

export const ARTICLE_KINDS: Record<ArticleKind, { label: string; plural: string; path: string; intro: string }> = {
  technique: {
    label: 'Technique',
    plural: 'Techniques culinaires',
    path: '/techniques',
    intro: 'Les gestes et les bases de la cuisine professionnelle, expliqués pas à pas.',
  },
  conseil: {
    label: 'Conseil',
    plural: 'Conseils du Chef',
    path: '/conseils',
    intro: 'Astuces, secrets et méthodes de cuisine, tirés de vingt ans de service.',
  },
};

export const articlesCrud = createCrud('articles', {
  label: 'Article',
  orderBy: [{ column: 'kind' }, { column: 'position' }, { column: 'created_at', ascending: false }],
});

export function usePublishedArticles(kind: ArticleKind) {
  return useQuery({
    queryKey: ['articles', 'published', kind],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, kind, title, slug, excerpt, image_url, video_url, difficulty, reading_minutes, tags, published_at')
        .eq('kind', kind)
        .eq('is_published', true)
        .order('position')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePublishedArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** YouTube / Vimeo URL → privacy-friendly embed URL (null when unsupported). */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const youtube = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  return null;
}
