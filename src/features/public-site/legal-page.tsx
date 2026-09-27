import { DEFAULT_SETTINGS, useSiteSettings } from '@/features/settings/api';
import { Seo } from '@/shared/ui/seo';
import { Container, PageHero } from './components/sections';

/**
 * Legal information the owner must keep accurate.
 * TODO(owner): fill in the SIRET and the front-end host before going live.
 */
const LEGAL = {
  status: 'Entrepreneur individuel',
  siret: 'En cours d’immatriculation',
  lastUpdate: '26 septembre 2026',
  // Name and postal address of the company hosting the static site (Vercel, Netlify, OVH…).
  frontHost: '[À compléter : hébergeur du site]',
  // Supabase Inc. — https://supabase.com (indicate the region chosen for the project).
  dataHost: 'Supabase Inc. — https://supabase.com',
};

export function Component() {
  const { data: settings } = useSiteSettings();
  const site = { ...DEFAULT_SETTINGS, ...settings };

  return (
    <div className="animate-fade-in">
      <Seo
        title="Mentions légales et confidentialité"
        description="Mentions légales, politique de confidentialité et cookies."
      />
      <PageHero title="Mentions légales" subtitle="Informations légales et politique de confidentialité" />

      <section className="bg-white py-20">
        <Container className="max-w-4xl">
          <div className="prose max-w-none prose-neutral prose-headings:font-display">
            <h2>1. Éditeur du site</h2>
            <p>
              <strong>Nom commercial :</strong> {site.site_name}
              <br />
              <strong>Statut :</strong> {LEGAL.status}
              <br />
              <strong>Adresse :</strong> {site.address}
              <br />
              <strong>Email :</strong> <a href={`mailto:${site.email}`}>{site.email}</a>
              {site.phone && (
                <>
                  <br />
                  <strong>Téléphone :</strong> {site.phone}
                </>
              )}
              <br />
              <strong>SIRET :</strong> {LEGAL.siret}
              <br />
              <strong>Directeur de la publication :</strong> l’exploitant de {site.site_name}
            </p>

            <h2>2. Hébergement</h2>
            <p>
              Site web : {LEGAL.frontHost}
              <br />
              Base de données et fichiers : {LEGAL.dataHost}
            </p>

            <h2>3. Propriété intellectuelle</h2>
            <p>
              L’ensemble du contenu de ce site (textes, recettes, photographies, logos) est protégé par le droit
              d’auteur. Toute reproduction ou adaptation, totale ou partielle, sans autorisation écrite préalable est
              interdite. Certaines illustrations sont générées par intelligence artificielle.
            </p>

            <h2 id="confidentialite">4. Politique de confidentialité (RGPD)</h2>
            <p>
              <strong>Responsable du traitement :</strong> {site.site_name}, joignable à{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Traitement</th>
                  <th>Données</th>
                  <th>Base légale</th>
                  <th>Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Réponse aux demandes de contact et devis</td>
                  <td>Nom, email, téléphone, message</td>
                  <td>Mesures précontractuelles</td>
                  <td>3 ans après le dernier contact</td>
                </tr>
                <tr>
                  <td>Publication des avis clients</td>
                  <td>Nom, note, avis (email non publié)</td>
                  <td>Consentement</td>
                  <td>Jusqu’au retrait du consentement</td>
                </tr>
                <tr>
                  <td>Newsletter « Les inspirations du Chef »</td>
                  <td>Adresse email</td>
                  <td>Consentement (double confirmation)</td>
                  <td>Jusqu’à la désinscription (lien dans chaque email)</td>
                </tr>
                <tr>
                  <td>Notes des recettes (une par visiteur)</td>
                  <td>Identifiant aléatoire du navigateur, note</td>
                  <td>Intérêt légitime</td>
                  <td>Durée de publication de la recette</td>
                </tr>
                <tr>
                  <td>Sécurité et prévention du spam</td>
                  <td>Empreinte (hachée) de l’adresse IP</td>
                  <td>Intérêt légitime</td>
                  <td>48 heures</td>
                </tr>
              </tbody>
            </table>
            <p>
              <strong>Destinataires :</strong> vos données ne sont ni vendues ni cédées. Elles sont traitées par nos
              sous-traitants techniques : Supabase (hébergement), Cloudflare (protection anti-spam), Brevo (newsletter)
              et, le cas échéant, notre prestataire d’envoi d’emails.
            </p>
            <p>
              <strong>Vos droits :</strong> accès, rectification, effacement, limitation, opposition et portabilité.
              Pour les exercer, écrivez à <a href={`mailto:${site.email}`}>{site.email}</a>. Vous pouvez également
              introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr">www.cnil.fr</a>).
            </p>

            <h2>5. Cookies</h2>
            <p>
              Ce site n’utilise aucun cookie publicitaire ni de mesure d’audience. Seuls des éléments strictement
              nécessaires sont déposés (session de l’espace d’administration, protection anti-spam) : ils sont exemptés
              de consentement. Vos recettes favorites et un identifiant aléatoire (servant à n’enregistrer qu’une note
              par visiteur) sont conservés uniquement dans votre navigateur ; vous pouvez les effacer à tout moment.
            </p>

            <h2>6. Limitation de responsabilité</h2>
            <p>
              Les informations de ce site, y compris les valeurs nutritionnelles et le Nutri-Score, sont fournies à
              titre indicatif et estimées à partir des ingrédients. Elles ne remplacent pas un avis diététique ou
              médical.
            </p>

            <h2>7. Droit applicable</h2>
            <p>
              Les présentes mentions sont régies par le droit français. En cas de litige, les tribunaux français sont
              compétents.
            </p>
          </div>

          <p className="mt-16 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
            Dernière mise à jour : {LEGAL.lastUpdate}
          </p>
        </Container>
      </section>
    </div>
  );
}
