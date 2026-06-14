import { Award, Clock, Heart, Users, Target, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function About() {
  const values = [
    { icon: Award, title: 'Excellence', description: 'Exigence et qualité dans chaque prestation' },
    { icon: Heart, title: 'Passion', description: 'L\'amour du métier depuis plus de 15 ans' },
    { icon: Users, title: 'Partage', description: 'Transmission du savoir-faire culinaire' },
    { icon: Lightbulb, title: 'Innovation', description: 'Créativité et originalité constantes' },
  ];

  const milestones = [
    { year: '2008', title: 'Début de carrière', description: 'Premier poste en brigade gastronomique étoilée' },
    { year: '2012', title: 'Chef de partie', description: 'Responsable du plan de travail entrées/chaud' },
    { year: '2015', title: 'Second de cuisine', description: 'Direction d\'une brigade de 15 personnes' },
    { year: '2018', title: 'Consultant freelance', description: 'Lancement de mon activité indépendante' },
    { year: '2022', title: 'Expert culinaire', description: 'Plus de 50 restaurants accompagnés' },
  ];

  const certifications = [
    'BTS Cuisine',
    'BPCS Cuisine',
    'HACCP Certifié',
    'Formateur Professionnel',
    'Hygiène Alimentaire',
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            À Propos
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Découvrez mon parcours, mes valeurs et ma passion pour l'excellence culinaire
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="section-title">Mon Histoire</h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Depuis plus de 15 ans, je parcours le monde de la gastronomie avec passion et exigence.
                Mon parcours m'a mené des cuisines les plus prestigieuses aux établissements en quête
                de transformation et d'excellence.
              </p>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Formé dans des établissements étoilés, j'ai eu le privilège de travailler aux côtés
                de grands chefs qui m'ont transmis les valeurs du métier : rigueur, créativité
                et respect du produit.
              </p>
              <p className="text-neutral-600 leading-relaxed mb-8">
                Aujourd'hui, en tant que chef freelance, je mets cette expertise au service
                des professionnels et particuliers : création de menus, consulting culinaire,
                formation et accompagnement sur-mesure.
              </p>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary-600">15+</div>
                  <div className="text-sm text-neutral-500 mt-1">Années d'expérience</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary-600">50+</div>
                  <div className="text-sm text-neutral-500 mt-1">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary-600">200+</div>
                  <div className="text-sm text-neutral-500 mt-1">Clients</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/239581/pexels-photo-239581.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Chef en cuisine"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6">
                <div className="flex items-center gap-3">
                  <Target className="w-10 h-10 text-primary-600" />
                  <div>
                    <div className="font-semibold text-neutral-900">Ma mission</div>
                    <div className="text-sm text-neutral-500">Excellence culinaire</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Mes Valeurs</h2>
            <p className="section-subtitle mx-auto">
              Les principes qui guident chaque prestation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="card-hover p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-3">{value.title}</h3>
                <p className="text-neutral-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Mon Parcours</h2>
            <p className="section-subtitle mx-auto">
              Les étapes clés de ma carrière
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary-600 ring-4 ring-primary-100" />
                  {index < milestones.length - 1 && (
                    <div className="flex-1 w-0.5 bg-neutral-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-display font-bold text-primary-600">{milestone.year}</span>
                    <span className="text-lg font-semibold text-neutral-900">{milestone.title}</span>
                  </div>
                  <p className="text-neutral-600">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                Formations & Certifications
              </h2>
              <p className="text-neutral-300 leading-relaxed mb-8">
                Un parcours de formation continue pour rester à la pointe des techniques
                culinaires et des normes qualité.
              </p>
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-success-400" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <Clock className="w-8 h-8 text-primary-400" />
                <h3 className="text-xl font-display font-semibold text-white">Disponibilité</h3>
              </div>
              <p className="text-neutral-300 mb-6">
                Disponible pour des missions ponctuelles ou récurrentes sur Bordeaux et sa région,
                avec possibilité de déplacement dans toute la France.
              </p>
              <div className="flex items-center gap-2 text-success-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Flexible et réactif</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
