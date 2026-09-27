import { ArrowLeft, ArrowRight, Clock, PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { NotFoundContent } from '@/features/public-site/not-found';
import { Container, CtaBanner, PageHero } from '@/features/public-site/components/sections';
import { DIFFICULTY_LABELS, labelOf } from '@/shared/domain/constants';
import { imageUrl } from '@/shared/lib/storage';
import { WhiskIcon } from '@/shared/ui/culinary-icons';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { RichText } from '@/shared/ui/rich-text';
import { Seo } from '@/shared/ui/seo';
import { ARTICLE_KINDS, usePublishedArticle, usePublishedArticles, videoEmbedUrl, type ArticleKind } from './api';

const HERO_IMAGES: Record<ArticleKind, string> = {
  technique: 'https://images.pexels.com/photos/3298637/pexels-photo-3298637.jpeg?auto=compress&cs=tinysrgb&w=1920',
  conseil: 'https://images.pexels.com/photos/4252137/pexels-photo-4252137.jpeg?auto=compress&cs=tinysrgb&w=1920',
};

export function ArticlesListPage({ kind }: { kind: ArticleKind }) {
  const meta = ARTICLE_KINDS[kind];
  const { data: articles = [], isPending, isError, error, refetch } = usePublishedArticles(kind);

  return (
    <div className="animate-fade-in">
      <Seo title={meta.plural} description={meta.intro} />
      <PageHero eyebrow="Le savoir-faire du Chef" title={meta.plural} subtitle={meta.intro} image={HERO_IMAGES[kind]} />
      <section className="py-20">
        <Container>
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : articles.length === 0 ? (
            <EmptyState title="Contenus en préparation" description="Revenez bientôt." />
          ) : (
            <ol className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <Reveal as="li" key={article.id} delay={(index % 3) * 80} className="group relative">
                  <div className="relative mb-5 aspect-3/2 overflow-hidden rounded-2xl bg-neutral-900">
                    {article.image_url ? (
                      <img
                        src={imageUrl(article.image_url, 720)}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-primary-900 to-neutral-950">
                        <span className="font-display text-8xl text-secondary-400/80">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    {article.video_url && (
                      <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-cream-50/90 px-3 py-1 text-xs font-medium text-neutral-800">
                        <PlayCircle className="size-4 text-primary-700" aria-hidden />
                        Vidéo
                      </span>
                    )}
                  </div>
                  <p className="mb-2 flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-secondary-700 uppercase">
                    {article.difficulty && <span>{labelOf(DIFFICULTY_LABELS, article.difficulty)}</span>}
                    <span className="inline-flex items-center gap-1 tracking-normal normal-case">
                      <Clock className="size-3.5" aria-hidden />
                      {article.reading_minutes} min de lecture
                    </span>
                  </p>
                  <h2 className="mb-3 text-3xl text-neutral-900">
                    <Link
                      to={`${meta.path}/${article.slug}`}
                      className="group-hover:text-primary-700 after:absolute after:inset-0"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mb-4 text-neutral-600">{article.excerpt}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
                    Lire {kind === 'technique' ? 'la technique' : 'le conseil'}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Reveal>
              ))}
            </ol>
          )}
        </Container>
      </section>
      <CtaBanner
        title="Envie de pratiquer ?"
        text="Retrouvez ces gestes dans les recettes du blog culinaire, expliquées pas à pas."
        primary={{ label: 'Voir les recettes', to: '/recettes' }}
      />
    </div>
  );
}

export function ArticleDetailPage({ kind }: { kind: ArticleKind }) {
  const { slug } = useParams();
  const meta = ARTICLE_KINDS[kind];
  const { data: article, isPending, isError, error, refetch } = usePublishedArticle(slug);
  const { data: siblings = [] } = usePublishedArticles(kind);

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!article || article.kind !== kind) {
    return (
      <NotFoundContent
        title="Contenu introuvable"
        backTo={meta.path}
        backLabel={`Voir les ${meta.plural.toLowerCase()}`}
      />
    );
  }

  const embed = videoEmbedUrl(article.video_url);
  const others = siblings.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <article className="animate-fade-in">
      <Seo
        title={article.title}
        description={article.excerpt}
        image={article.image_url}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': kind === 'technique' ? 'HowTo' : 'Article',
          name: article.title,
          headline: article.title,
          description: article.excerpt,
          image: article.image_url ?? undefined,
          datePublished: article.published_at ?? article.created_at,
          author: { '@type': 'Person', name: 'Chef Pro Bordeaux' },
          video: embed ? { '@type': 'VideoObject', name: article.title, embedUrl: embed } : undefined,
        }}
      />
      <header className="bg-neutral-950 pt-16 pb-24 text-cream-50">
        <Container className="max-w-3xl text-center">
          <Link
            to={meta.path}
            className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-cream-50"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {meta.plural}
          </Link>
          <p className="eyebrow justify-center text-secondary-400">
            <WhiskIcon size={16} />
            {meta.label}
            {article.difficulty && ` · ${labelOf(DIFFICULTY_LABELS, article.difficulty)}`} · {article.reading_minutes}{' '}
            min
          </p>
          <h1 className="mb-6 text-5xl font-medium md:text-6xl">{article.title}</h1>
          <p className="text-lg text-neutral-300">{article.excerpt}</p>
        </Container>
      </header>

      <Container className="-mt-12 max-w-4xl">
        {embed ? (
          <div className="aspect-video overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
            <iframe
              src={embed}
              title={`Vidéo : ${article.title}`}
              className="size-full"
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          article.image_url && (
            <img
              src={imageUrl(article.image_url, 1400)}
              alt=""
              className="aspect-video w-full rounded-3xl object-cover shadow-2xl"
            />
          )
        )}
      </Container>

      <Container className="max-w-3xl py-16">
        <RichText source={article.body} />
        {article.tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2 border-t border-neutral-200 pt-8">
            {article.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </Container>

      {others.length > 0 && (
        <section className="border-t border-neutral-200 bg-cream-100 py-16">
          <Container>
            <h2 className="mb-10 text-3xl text-neutral-900">À lire aussi</h2>
            <ul className="grid gap-8 md:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link to={`${meta.path}/${other.slug}`} className="group block">
                    <h3 className="mb-2 text-2xl text-neutral-900 group-hover:text-primary-700">{other.title}</h3>
                    <p className="line-clamp-2 text-sm text-neutral-600">{other.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </article>
  );
}
