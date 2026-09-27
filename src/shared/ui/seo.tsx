import { useLocation } from 'react-router';
import { env } from '@/shared/lib/env';

type SeoProps = {
  title: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** Structured data (schema.org), serialised as JSON-LD. */
  jsonLd?: Record<string, unknown>;
};

const SITE_NAME = 'Chef Pro Bordeaux';

/** Per-page metadata using React 19 native <title>/<meta> hoisting. */
export function Seo({ title, description, image, type = 'website', noindex, jsonLd }: SeoProps) {
  const { pathname } = useLocation();
  const url = new URL(pathname, env.VITE_SITE_URL).toString();
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = image ? new URL(image, env.VITE_SITE_URL).toString() : undefined;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      {jsonLd && (
        <script
          type="application/ld+json"
          // JSON.stringify output is safe once "<" is escaped (prevents </script> injection).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </>
  );
}
