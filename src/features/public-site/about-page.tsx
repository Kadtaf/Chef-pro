import { Award, CheckCircle2, Clock, Heart, Lightbulb, Target, Users } from 'lucide-react';
import { Seo } from '@/shared/ui/seo';
import { Container, CtaBanner, PageHero, SectionHeading } from './components/sections';

const VALUES = [
  { icon: Award, title: 'Excellence', description: 'Exigence et qualité dans chaque prestation' },
  { icon: Heart, title: 'Passion', description: "L'amour du métier depuis plus de 15 ans" },
  { icon: Users, title: 'Partage', description: 'Transmission du savoir-faire culinaire' },
  { icon: Lightbulb, title: 'Innovation', description: 'Créativité et originalité constantes' },
];

const MILESTONES = [
  { year: '2008', title: 'Début de carrière', description: 'Premier poste en brigade gastronomique étoilée' },
  { year: '2012', title: 'Chef de partie', description: 'Responsable du poste entrées et chaud' },
  { year: '2015', title: 'Second de cuisine', description: "Direction d'une brigade de 15 personnes" },
  { year: '2018', title: 'Consultant freelance', description: 'Lancement de mon activité indépendante' },
  { year: '2022', title: 'Expert culinaire', description: 'Plus de 50 restaurants accompagnés' },
];

const CERTIFICATIONS = [
  'BTS Cuisine',
  'BPCS Cuisine',
  'HACCP certifié',
  'Formateur professionnel',
  'Hygiène alimentaire',
];

const STATS = [
  { value: '15+', label: "Années d'expérience" },
  { value: '50+', label: 'Restaurants' },
  { value: '200+', label: 'Clients' },
];

export function Component() {
  return (
    <div className="animate-fade-in">
      <Seo
        title="À propos"
        description="Parcours, valeurs et certifications d'un chef de cuisine freelance à Bordeaux : 15 ans d'expérience en gastronomie."
      />
      <PageHero title="À propos" subtitle="Mon parcours, mes valeurs et ma passion pour l'excellence culinaire" />

      <section className="bg-white py-24">
        <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="section-title">Mon histoire</h2>
            <div className="space-y-5 leading-relaxed text-neutral-600">
              <p>
                Depuis plus de 15 ans, je parcours le monde de la gastronomie avec passion et exigence. Mon parcours
                m&apos;a mené des cuisines les plus prestigieuses aux établissements en quête de transformation.
              </p>
              <p>
                Formé dans des établissements étoilés, j&apos;ai travaillé aux côtés de grands chefs qui m&apos;ont
                transmis les valeurs du métier : rigueur, créativité et respect du produit.
              </p>
              <p>
                Aujourd&apos;hui chef freelance, je mets cette expertise au service des professionnels et des
                particuliers : création de menus, consulting, formation et accompagnement sur mesure.
              </p>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dd className="font-display text-4xl font-bold text-primary-600">{stat.value}</dd>
                  <dt className="mt-1 text-sm text-neutral-500">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="aspect-4/3 overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="https://images.pexels.com/photos/239581/pexels-photo-239581.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Chef dressant une assiette en cuisine"
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Target className="size-10 text-primary-600" aria-hidden />
                <div>
                  <p className="font-semibold text-neutral-900">Ma mission</p>
                  <p className="text-sm text-neutral-500">Excellence culinaire</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-neutral-50 py-24">
        <Container>
          <SectionHeading title="Mes valeurs" subtitle="Les principes qui guident chaque prestation" />
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-xl border border-neutral-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-linear-to-br from-primary-100 to-secondary-100">
                  <Icon className="size-8 text-primary-600" aria-hidden />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-neutral-900">{title}</h3>
                <p className="text-sm text-neutral-600">{description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-24">
        <Container className="max-w-4xl">
          <SectionHeading title="Mon parcours" subtitle="Les étapes clés de ma carrière" />
          <ol className="space-y-2">
            {MILESTONES.map((milestone, index) => (
              <li key={milestone.year} className="flex gap-6">
                <div className="flex flex-col items-center" aria-hidden>
                  <span className="size-4 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                  {index < MILESTONES.length - 1 && <span className="mt-2 w-0.5 flex-1 bg-neutral-200" />}
                </div>
                <div className="flex-1 pb-8">
                  <p className="mb-2 flex items-center gap-3">
                    <span className="font-display text-lg font-bold text-primary-600">{milestone.year}</span>
                    <span className="text-lg font-semibold text-neutral-900">{milestone.title}</span>
                  </p>
                  <p className="text-neutral-600">{milestone.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-linear-to-br from-neutral-900 to-neutral-800 py-24">
        <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">Formations & certifications</h2>
            <p className="mb-8 leading-relaxed text-neutral-300">
              Un parcours de formation continue pour rester à la pointe des techniques culinaires et des normes qualité.
            </p>
            <ul className="space-y-4">
              {CERTIFICATIONS.map((certification) => (
                <li key={certification} className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="size-5 text-success-400" aria-hidden />
                  {certification}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-4">
              <Clock className="size-8 text-primary-400" aria-hidden />
              <h3 className="text-xl font-semibold text-white">Disponibilité</h3>
            </div>
            <p className="mb-6 text-neutral-300">
              Disponible pour des missions ponctuelles ou récurrentes sur Bordeaux et sa région, avec possibilité de
              déplacement dans toute la France.
            </p>
            <p className="flex items-center gap-2 font-medium text-success-400">
              <CheckCircle2 className="size-5" aria-hidden />
              Flexible et réactif
            </p>
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Travaillons ensemble"
        text="Parlez-moi de votre projet : je vous réponds sous 48 h avec une proposition adaptée."
        secondary={{ label: 'Voir mes services', to: '/services' }}
      />
    </div>
  );
}
