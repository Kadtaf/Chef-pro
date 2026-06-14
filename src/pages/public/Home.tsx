import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Star,
  Clock,
  Award,
  Users,
  ChefHat,
  Utensils,
  Heart,
  Quote,
} from 'lucide-react';
import { supabase, Tables } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

export default function Home() {
  const [featuredRecipes, setFeaturedRecipes] = useState<Tables<'recipes'>[]>([]);
  const [reviews, setReviews] = useState<Tables<'comments'>[]>([]);
  const [services, setServices] = useState<Tables<'services'>[]>([]);
  const [portfolio, setPortfolio] = useState<Tables<'portfolio_items'>[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [recipesRes, reviewsRes, servicesRes, portfolioRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('is_featured', true).eq('is_published', true).limit(3),
        supabase.from('comments').select('*').eq('is_approved', true).eq('is_public', true).not('rating', 'is', null).limit(3),
        supabase.from('services').select('*').eq('is_published', true).limit(4),
        supabase.from('portfolio_items').select('*').eq('is_featured', true).eq('is_published', true).limit(4),
      ]);

      if (recipesRes.data) setFeaturedRecipes(recipesRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (portfolioRes.data) setPortfolio(portfolioRes.data);
    };

    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-sm"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm mb-8">
              <ChefHat className="w-4 h-4" />
              <span>Chef de cuisine freelance à Bordeaux</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
              Créez des expériences
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                gastronomiques inoubliables
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-300 leading-relaxed mb-10 max-w-2xl">
              Expertise culinaire professionnelle pour restaurants, événements privés et consulting.
              Plus de 15 ans d'expérience au service de votre réussite.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="btn-primary text-lg px-8 py-4 gap-2"
              >
                Demander un devis gratuit
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/portfolio"
                className="btn-outline border-white/30 text-white hover:bg-white/10 hover:text-white text-lg px-8 py-4"
              >
                Voir mon portfolio
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">15+</div>
                <div className="text-sm text-neutral-400">Années d'expérience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">200+</div>
                <div className="text-sm text-neutral-400">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-white">50+</div>
                <div className="text-sm text-neutral-400">Restaurants accompagnés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">Mes Services</h2>
            <p className="section-subtitle mx-auto">
              Des solutions culinaires sur mesure pour répondre à tous vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service) => (
              <div key={service.id} className="card-hover p-6 group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {service.category === 'chef' && <ChefHat className="w-7 h-7 text-primary-600" />}
                  {service.category === 'second' && <Utensils className="w-7 h-7 text-primary-600" />}
                  {service.category === 'consulting' && <Award className="w-7 h-7 text-primary-600" />}
                  {service.category === 'formation' && <Users className="w-7 h-7 text-primary-600" />}
                  {service.category === 'evenementiel' && <Heart className="w-7 h-7 text-primary-600" />}
                </div>
                <h3 className="text-xl font-display font-semibold text-neutral-900 mb-3">{service.title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-4">{service.description}</p>
                <div className="flex items-baseline gap-1 text-primary-600">
                  {service.price && (
                    <>
                      <span className="text-2xl font-display font-bold">{formatCurrency(service.price)}</span>
                      <span className="text-sm text-neutral-500">/{service.price_unit}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services" className="btn-outline">
              Découvrir tous mes services
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <ChefHat className="w-4 h-4" />
                <span>À propos</span>
              </div>
              <h2 className="section-title">Une passion au service de l'excellence culinaire</h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Chef de cuisine passionné avec plus de 15 ans d'expérience dans les établissements gastronomiques
                prestigieux, je mets mon expertise au service des professionnels de la restauration et des
                particuliers en quête d'excellence.
              </p>
              <p className="text-neutral-600 leading-relaxed mb-8">
                De la création de menus innovants à l'optimisation des coûts matières, en passant par la
                formation de vos équipes, je vous accompagne dans chaque aspect de votre projet culinaire.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                    <Award className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Expertise certifiée</div>
                    <div className="text-sm text-neutral-500">Formation continue</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Accompagnement</div>
                    <div className="text-sm text-neutral-500">Personnalisé</div>
                  </div>
                </div>
              </div>
              <Link to="/a-propos" className="btn-primary gap-2">
                En savoir plus
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/239581/pexels-photo-239581.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Chef en cuisine"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-display font-bold text-primary-600">15+</div>
                  <div className="text-sm text-neutral-600">années d'expérience en cuisine gastronomique</div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-400 text-accent-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipes Section */}
      {featuredRecipes.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div>
                <h2 className="section-title">Recettes en vedette</h2>
                <p className="section-subtitle">Découvrez mes créations culinaires</p>
              </div>
              <Link to="/recettes" className="btn-outline mt-4 md:mt-0">
                Voir toutes les recettes
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRecipes.map((recipe) => (
                <Link key={recipe.id} to={`/recettes/${recipe.slug}`} className="card-hover group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge-primary">{recipe.category}</span>
                      {recipe.nutri_score && (
                        <span className={`badge ${recipe.nutri_score === 'A' ? 'bg-success-500 text-white' : recipe.nutri_score === 'B' ? 'bg-success-300 text-neutral-800' : recipe.nutri_score === 'C' ? 'bg-warning-400 text-neutral-800' : 'bg-error-400 text-white'}`}>
                          Nutri-Score {recipe.nutri_score}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">{recipe.title}</h3>
                    <p className="text-sm text-neutral-600 line-clamp-2">{recipe.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.prep_time + recipe.cook_time} min</span>
                      </div>
                      <div>{recipe.servings} pers.</div>
                      <div>{recipe.calories_per_serving} kcal/pers.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {reviews.length > 0 && (
        <section className="py-24 bg-neutral-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="section-title text-white">Ce que disent mes clients</h2>
              <p className="section-subtitle text-neutral-400 mx-auto">
                La satisfaction de mes clients est ma priorité
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-neutral-800/50 rounded-2xl p-8 backdrop-blur-sm">
                  <Quote className="w-10 h-10 text-primary-400/30 mb-6" />
                  <p className="text-neutral-300 leading-relaxed mb-6">{review.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                        {review.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{review.author_name}</div>
                        <div className="text-sm text-neutral-500">{review.source || 'Client'}</div>
                      </div>
                    </div>
                    {review.rating && (
                      <div className="flex gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/avis" className="btn-outline border-neutral-600 text-white hover:bg-white/10 hover:text-white">
                Voir tous les avis
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Preview */}
      {portfolio.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="section-title">Portfolio</h2>
              <p className="section-subtitle mx-auto">
                Découvrez mes réalisations et projets culinaires
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {portfolio.map((item, index) => (
                <Link
                  key={item.id}
                  to="/portfolio"
                  className={`relative overflow-hidden rounded-xl group ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                >
                  <div className={`aspect-square ${index === 0 ? 'aspect-auto h-full' : ''}`}>
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white font-display font-semibold">{item.title}</h3>
                      <p className="text-sm text-neutral-300">{item.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/portfolio" className="btn-primary gap-2">
                Voir tout le portfolio
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Prêt à transformer votre projet culinaire ?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Contactez-moi pour discuter de vos besoins et obtenir un devis personnalisé gratuit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary-700 font-semibold hover:bg-neutral-100 transition-colors gap-2"
            >
              Demander un devis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/tarifs"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/30"
            >
              Voir mes tarifs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
