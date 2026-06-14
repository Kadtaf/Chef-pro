import { useSettings } from '../../contexts/SettingsContext';

export default function Legal() {
  const { settings } = useSettings();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-neutral-900 to-neutral-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
            Mentions Légales
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none space-y-12">
            {/* Éditeur */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                1. Éditeur du site
              </h2>
              <div className="bg-neutral-50 rounded-xl p-6">
                <p className="text-neutral-700">
                  <strong>Raison sociale :</strong> {settings?.site_name || 'Chef Pro Bordeaux'}<br />
                  <strong>Statut :</strong> Entrepreneur individuel<br />
                  <strong>Adresse :</strong> {settings?.address || 'Bordeaux, France'}<br />
                  <strong>Email :</strong> {settings?.email || 'contact@chef-pro-bordeaux.fr'}<br />
                  <strong>Téléphone :</strong> {settings?.phone || '+33 6 00 00 00 00'}<br />
                  <strong>SIRET :</strong> En cours d'immatriculation
                </p>
              </div>
            </div>

            {/* Hébergement */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                2. Hébergement
              </h2>
              <p className="text-neutral-700">
                Ce site est hébergé par :<br />
                Supabase Inc.<br />
                2261 Market Street #5180, San Francisco, California 94114, United States
              </p>
            </div>

            {/* Propriété intellectuelle */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                3. Propriété intellectuelle
              </h2>
              <p className="text-neutral-700">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est protégé
                par le droit d'auteur et le droit des marques. Toute reproduction, représentation,
                modification, publication ou adaptation de tout ou partie des éléments du site,
                quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation
                écrite préalable.
              </p>
            </div>

            {/* Données personnelles */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                4. Protection des données personnelles
              </h2>
              <p className="text-neutral-700">
                Les informations collectées via le formulaire de contact sont utilisées uniquement
                pour répondre à vos demandes et ne sont pas transmises à des tiers. Conformément
                au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression
                de vos données. Pour exercer ces droits, contactez-nous à l'adresse :
                {settings?.email || 'contact@chef-pro-bordeaux.fr'}.
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                5. Cookies
              </h2>
              <p className="text-neutral-700">
                Ce site utilise des cookies techniques nécessaires au bon fonctionnement du site.
                Ces cookies ne collectent pas de données personnelles et ne sont pas utilisés
                à des fins publicitaires.
              </p>
            </div>

            {/* Limitation de responsabilité */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                6. Limitation de responsabilité
              </h2>
              <p className="text-neutral-700">
                Les informations contenues sur ce site sont aussi précises que possible et le site
                est périodiquement mis à jour, mais peut toutefois contenir des inexactitudes,
                des omissions ou des lacunes. Si vous constatez une lacune, erreur ou que par
                suite d'un changement, les informations contenues sur le site sont devenues
                inexactes, merci de nous en informer.
              </p>
            </div>

            {/* Droit applicable */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                7. Droit applicable
              </h2>
              <p className="text-neutral-700">
                Les présentes conditions sont régies par le droit français. En cas de litige,
                les tribunaux français seront seuls compétents.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-display font-semibold text-neutral-900 mb-4">
                8. Contact
              </h2>
              <p className="text-neutral-700">
                Pour toute question concernant ces mentions légales, vous pouvez nous contacter à :
                <br />
                Email : {settings?.email || 'contact@chef-pro-bordeaux.fr'}
                <br />
                Téléphone : {settings?.phone || '+33 6 00 00 00 00'}
              </p>
            </div>
          </div>

          <div className="text-center mt-16 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
