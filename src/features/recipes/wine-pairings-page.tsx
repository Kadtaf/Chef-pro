import { Link } from 'react-router';
import { Container, PageHero } from '@/features/public-site/components/sections';
import { imageUrl } from '@/shared/lib/storage';
import { WineGlassIcon } from '@/shared/ui/culinary-icons';
import { EmptyState, ErrorState, PageLoader } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { Seo } from '@/shared/ui/seo';
import { useWinePairings } from './api';

const FALLBACK = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';

/** Index of every published recipe that has a wine pairing. */
export function Component() {
  const { data: pairings = [], isPending, isError, error, refetch } = useWinePairings();

  return (
    <div className="animate-fade-in">
      <Seo
        title="Accords mets-vins"
        description="Les accords mets-vins du Chef pour chaque recette du blog : appellations de Bordeaux et d'ailleurs, et le pourquoi de chaque mariage."
      />
      <PageHero
        eyebrow="Le vin à table"
        title="Accords mets-vins"
        subtitle="Pour chaque recette, le vin qui la sublime — et pourquoi. Bordeaux, Sud-Ouest et belles appellations de France."
        image="https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg?auto=compress&cs=tinysrgb&w=1920"
      />

      <section className="py-20">
        <Container className="max-w-5xl">
          {isPending ? (
            <PageLoader />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : pairings.length === 0 ? (
            <EmptyState
              title="Accords en préparation"
              description="Les accords mets-vins accompagneront bientôt les recettes."
            />
          ) : (
            <ul className="divide-y divide-neutral-200">
              {pairings.map((recipe, index) => (
                <Reveal as="li" key={recipe.id} delay={(index % 4) * 60}>
                  <Link to={`/recettes/${recipe.slug}`} className="group grid gap-6 py-8 sm:grid-cols-[8rem_1fr]">
                    <img
                      src={imageUrl(recipe.image_url, 320) ?? FALLBACK}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-32 rounded-2xl object-cover"
                    />
                    <div>
                      <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-secondary-700 uppercase">
                        {recipe.category}
                      </p>
                      <h2 className="mb-3 text-3xl text-neutral-900 group-hover:text-primary-700">{recipe.title}</h2>
                      <p className="flex gap-3 text-neutral-700">
                        <WineGlassIcon size={22} className="mt-0.5 shrink-0 text-primary-700" />
                        <span className="leading-relaxed">{recipe.wine_pairing}</span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
          <p className="mt-12 text-center text-sm text-neutral-500">
            L&apos;abus d&apos;alcool est dangereux pour la santé, à consommer avec modération.
          </p>
        </Container>
      </section>
    </div>
  );
}
