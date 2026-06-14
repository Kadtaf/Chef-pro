import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, HelpCircle, ArrowRight } from 'lucide-react';
import { supabase, Tables } from '../../lib/supabase';
import { formatCurrency, parseFeatures } from '../../lib/utils';

export default function Pricing() {
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

  const defaultPricing = [
    {
      title: 'Chef de Cuisine',
      price: 350,
      unit: 'jour',
      description: 'Idéal pour remplacements ou missions ponctuelles',
      features: ['Supervision équipe', 'Création de plats', 'Gestion des stocks', 'Contrôle qualité'],
      featured: false,
    },
    {
      title: 'Second de Cuisine',
      price: 280,
      unit: 'jour',
      description: 'Support opérationnel en brigade',
      features: ['Support au chef', 'Management brigade', 'Organisation service', 'Formation équipe'],
      featured: false,
    },
    {
      title: 'Consulting',
      price: 1200,
      unit: 'forfait',
      description: 'Audit complet + plan d\'action',
      features: ['Audit complet', 'Rapport détaillé', 'Plan d\'action', 'Suivi mensuel', 'Support prioritaire'],
      featured: true,
    },
    {
      title: 'Formation',
      price: 900,
      unit: 'jour',
      description: 'Formation personnalisée équipe',
      features: ['Techniques avancées', 'HACPP', 'Gestion coûts', 'Innovation culinaire'],
      featured: false,
    },
  ];

  const pricingData = services.length > 0 ? services.map((s, i) => ({
    title: s.title,
    price: s.price || 0,
    unit: s.price_unit,
    description: s.description || '',
    features: parseFeatures(s.features),
    featured: s.is_featured || i === 2,
  })) : defaultPricing;

  const faqItems = [
    {
      q: 'Quels sont les délais de disponibilité ?',
      a: 'Je suis généralement disponible sous 1 à 2 semaines. Pour les urgences, n\'hésitez pas à me contacter directement.',
    },
    {
      q: 'Les tarifs incluent-ils le transport ?',
      a: 'Les tarifs sont pour une mission sur Bordeaux métropole. Des frais de déplacement peuvent s\'appliquer au-delà.',
    },
    {
      q: 'Proposez-vous des contrats récurrents ?',
      a: 'Oui, je propose des forfaits mensuels avec des tarifs préférentiels pour les engagements réguliers.',
    },
    {
      q: 'Comment se passe la facturation ?',
      a: 'Facturation en fin de mission avec délai de paiement de 30 jours. Accompte de 30% pour les missions longues.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Tarifs
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Des tarifs transparents adaptés à vos besoins
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingData.map((plan, index) => (
              <div
                key={index}
                className={`card relative overflow-hidden ${plan.featured ? 'ring-2 ring-primary-500 lg:scale-105' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white text-xs font-semibold text-center py-2">
                    Recommandé
                  </div>
                )}
                <div className={`p-8 ${plan.featured ? 'pt-12' : ''}`}>
                  <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
                    {plan.title}
                  </h3>
                  <p className="text-sm text-neutral-500 mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-display font-bold text-primary-600">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-neutral-500">/{plan.unit}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-success-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className={`btn w-full text-center ${
                      plan.featured ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    Demander un devis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="section-title mb-8">Ce qui est inclus</h2>
              <div className="space-y-6">
                {[
                  { title: 'Accompagnement personnalisé', desc: "Je m'adapte à votre établissement et votre style" },
                  { title: 'Support téléphonique', desc: 'Disponible 7j/7 pour vos questions' },
                  { title: 'Suivi post-mission', desc: 'Bilan et recommandations après chaque prestation' },
                  { title: 'Flexibilité', desc: 'Ajustement selon vos besoins en temps réel' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                      <p className="text-sm text-neutral-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="section-title mb-8">FAQ</h2>
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="card p-6">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-2">{item.q}</h3>
                        <p className="text-sm text-neutral-600">{item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Besoin d'un devis personnalisé ?
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Chaque projet est unique. Contactez-moi pour discuter de vos besoins.
          </p>
          <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary-700 font-semibold hover:bg-neutral-100 transition-colors gap-2">
            Me contacter
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
