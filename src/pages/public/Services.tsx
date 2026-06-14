import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Utensils, Award, Users, Heart, CheckCircle } from 'lucide-react';
import { supabase, Tables } from '../../lib/supabase';
import { formatCurrency, parseFeatures } from '../../lib/utils';

export default function Services() {
  const [services, setServices] = useState<Tables<'services'>[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_published', true)
        .order('position');
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chef': return ChefHat;
      case 'second': return Utensils;
      case 'consulting': return Award;
      case 'formation': return Users;
      case 'evenementiel': return Heart;
      default: return ChefHat;
    }
  };

  const defaultServices = [
    {
      title: 'Chef de Cuisine',
      category: 'chef',
      description: 'Gestion complète de votre cuisine : création de menus, management d\'équipe, contrôle qualité et optimisation des coûts.',
      price: 350,
      price_unit: 'jour',
      features: ['Supervision équipe', 'Création de plats', 'Gestion des stocks', 'Contrôle qualité'],
    },
    {
      title: 'Second de Cuisine',
      category: 'second',
      description: 'Support au chef et management de la brigade pour un service fluide et efficace.',
      price: 280,
      price_unit: 'jour',
      features: ['Support au chef', 'Management brigade', 'Gestion des services', 'Formation équipe'],
    },
    {
      title: 'Consulting Culinaire',
      category: 'consulting',
      description: 'Audit complet de votre établissement avec plan d\'action personnalisé.',
      price: 1200,
      price_unit: 'forfait',
      features: ['Audit complet', 'Plan d\'action', 'Suivi mensuel', 'Support prioritaire'],
    },
    {
      title: 'Formation',
      category: 'formation',
      description: 'Formation de votre équipe aux techniques gastronomiques et bonnes pratiques.',
      price: 900,
      price_unit: 'jour',
      features: ['Techniques gastronomiques', 'Normes HACCP', 'Gestion des coûts', 'Innovation'],
    },
    {
      title: 'Événementiel',
      category: 'evenementiel',
      description: 'Chef pour vos événements privés : repas d\'affaires, mariages, anniversaires.',
      price: 500,
      price_unit: 'jour',
      features: ['Menus personnalisés', 'Service à table', 'Découpe devant client', 'Vaisselle incluse'],
    },
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Mes Services
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Des prestations sur mesure pour répondre à tous vos besoins culinaires
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayServices.map((service, index) => {
              const Icon = getCategoryIcon(service.category);
              const features = parseFeatures(service.features);
              const isFeatured = service.is_featured || index === 2;

              return (
                <div
                  key={service.id || index}
                  className={`card relative overflow-hidden ${isFeatured ? 'ring-2 ring-primary-500' : ''}`}
                >
                  {isFeatured && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-semibold px-3 py-1">
                      Populaire
                    </div>
                  )}
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-display font-semibold text-neutral-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                      {service.description}
                    </p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-display font-bold text-primary-600">
                        {service.price ? formatCurrency(service.price) : 'Sur devis'}
                      </span>
                      {service.price && (
                        <span className="text-neutral-500">/{service.price_unit}</span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-neutral-600">
                          <CheckCircle className="w-4 h-4 text-success-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/contact"
                      className="btn-primary w-full text-center"
                    >
                      Demander un devis
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Comment ça marche ?</h2>
            <p className="section-subtitle mx-auto">
              Un processus simple et efficace pour vous accompagner
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Contact', desc: 'Vous me contactez via le formulaire ou par téléphone' },
              { step: '02', title: 'Échange', desc: 'Nous discutons de vos besoins et objectifs' },
              { step: '03', title: 'Proposition', desc: 'Je vous envoie un devis personnalisé' },
              { step: '04', title: 'Réalisation', desc: 'Je concrétise la prestation avec excellence' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center mx-auto mb-6 text-white text-2xl font-display font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Un projet spécifique en tête ?
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Je m'adapte à vos besoins. Contactez-moi pour en discuter.
          </p>
          <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary-700 font-semibold hover:bg-neutral-100 transition-colors">
            Demander un devis gratuit
          </Link>
        </div>
      </section>
    </div>
  );
}
