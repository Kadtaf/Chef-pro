# Déploiement et mise en production

Procédure à suivre **dans l'ordre** pour passer de la version 1 à la version 2. Les étapes marquées 🔒 corrigent des failles de sécurité de la version 1 et sont prioritaires.

## 1. 🔒 Actions immédiates sur le projet Supabase (dashboard)

1. **Authentication → Sign In / Providers** : désactiver _Allow new users to sign up_ (inscriptions), **mais laisser le fournisseur _Email_ activé** — sinon plus personne, administrateur compris, ne peut se connecter (« Email logins are disabled »). Désactiver les autres fournisseurs inutilisés.
   En version 1, n'importe qui pouvait créer un compte via l'API et obtenir un accès administrateur complet.
2. **Authentication → Users** : vérifier la liste. Supprimer tout compte inconnu.
3. **Project Settings → API** : régénérer la clé `service_role` (elle figurait dans des fichiers locaux du projet exporté).
   La clé `anon` est publique par nature et peut être conservée.
4. **Storage → Policies** (bucket `ai-images`) : supprimer les éventuelles politiques créées manuellement qui autorisent l'écriture à tous ; la migration installe les politiques « admin seulement ».

## 2. 🔒 Historique git

L'archive `public/chef-pro-bordeaux-complete.zip` (code source complet) a été commitée. Elle est supprimée de la branche, mais reste dans l'historique. Si le dépôt GitHub est ou a été public :

```bash
# Réécrit l'historique : à coordonner avec toute personne ayant cloné le dépôt.
pip install git-filter-repo
git filter-repo --path chef-pro-bordeaux-complete.zip --path public/chef-pro-bordeaux-complete.zip --path public/download.html --invert-paths
git push --force --all
```

## 3. Base de données

```bash
supabase link --project-ref <ref>
supabase db push
```

Les migrations `20260926*` :

| Migration            | Contenu                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `security_hardening` | `is_admin()`, réécriture de toutes les politiques RLS, profils créés par trigger, rate limiting, bucket Storage, index |
| `nutrition_v2`       | Sucres, AG saturés, poids de portion, % fruits/légumes ; `NOT NULL` sur les colonnes avec défaut                       |
| `transactional_rpcs` | `save_recipe`, `save_technical_sheet`, `save_menu`, `save_card`, slugs uniques                                         |
| `dashboard_audit`    | `dashboard_stats()` et journal d'activité automatique (triggers)                                                       |
| `haccp_thresholds`   | Seuils de température réglementaires par relevé                                                                        |

Points d'attention :

- La migration de sécurité passe le rôle par défaut à `viewer`. **Votre compte existant garde son rôle** ; vérifiez-le :
  `select email, role from public.profiles;` puis, si besoin, `update public.profiles set role = 'admin' where email = '…';`
- Elle échoue volontairement si la table `settings` contient plusieurs lignes (fusionnez-les d'abord).
- Toutes les migrations sont testées automatiquement (`npm run test`) sur un Postgres en mémoire.

### Blog culinaire (migrations `20260927*`)

| Migration         | Contenu                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blog_engagement` | Taxonomie (types, techniques, styles, tags), saisons, champs éditoriaux des recettes, notes/vues/favoris, `search_recipes`, `related_recipes`, articles, parcours, stats |
| `seed_content`    | Identité du Chef, parcours issu du CV, 6 techniques et 6 conseils (brouillons relus à publier)                                                                           |

Ensuite, régénérez les types : `npm run db:types`. Cette commande remplace `src/shared/types/database.generated.ts`, provisoirement complété par `scripts/patch-generated-types.mjs` (le script peut être supprimé ensuite).

Pour les **anciennes recettes**, les Nutri-Scores stockés en v1 étaient faux (bug de paramètres). Ouvrez chaque recette et réenregistrez-la pour recalculer nutrition, coût et Nutri-Score (renseignez le poids de portion si les ingrédients sont en « pièce »).

## 4. Edge functions

```bash
cp supabase/functions/.env.example supabase/functions/.env   # puis remplir
supabase secrets set --env-file supabase/functions/.env
npm run functions:deploy
```

| Secret                                          | Obligatoire | Rôle                                                                  |
| ----------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| `GEMINI_API_KEY`                                | oui         | Studio IA : recettes, fiches, menus, cartes, articles (Google Gemini) |
| `GEMINI_MODEL`                                  | non         | Modèle Gemini (défaut `gemini-flash-latest`)                          |
| `GEMINI_FALLBACK_MODEL`                         | non         | Modèle de secours si surcharge (défaut `gemini-flash-lite-latest`)    |
| `STABILITY_API_KEY`                             | oui         | Photos culinaires réalistes (Stability AI, Stable Image Core)         |
| `ALLOWED_ORIGINS`                               | oui         | Domaines autorisés (CORS), séparés par des virgules                   |
| `AI_DAILY_LIMIT`                                | non (50)    | Quota de générations IA par administrateur et par 24 h                |
| `PUBLIC_SUBMIT_LIMIT_PER_HOUR`                  | non (5)     | Limite des formulaires publics par IP                                 |
| `TURNSTILE_SECRET_KEY`                          | recommandé  | Captcha Cloudflare Turnstile (+ `VITE_TURNSTILE_SITE_KEY` côté front) |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | non         | Notification email des messages et avis                               |
| `BREVO_API_KEY`, `BREVO_LIST_ID`                | newsletter  | Inscription à la liste Brevo « Les inspirations du Chef »             |
| `BREVO_DOI_TEMPLATE_ID`                         | newsletter  | Modèle Brevo de double confirmation (RGPD)                            |
| `BREVO_REDIRECT_URL`                            | newsletter  | Page après confirmation : `https://<domaine>/newsletter/confirmee`    |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par la plateforme.

**Brevo (double opt-in)** : créez une liste, puis un modèle transactionnel de type « Double opt-in » contenant le lien `{{ params.DOIurl }}` ; renseignez son identifiant dans `BREVO_DOI_TEMPLATE_ID`. Le contact n'est ajouté à la liste qu'après avoir cliqué sur ce lien.

Les fonctions `engage` et `newsletter` sont publiques (`verify_jwt = false`) : elles valident chaque requête, limitent le débit et n'écrivent qu'à travers des RPC dédiées.

## 5. Front-end

Variables d'environnement de l'hébergeur : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, et en option `VITE_SENTRY_DSN`, `VITE_TURNSTILE_SITE_KEY`.

- **Vercel** : `vercel.json` fournit la réécriture SPA, le cache des assets et les en-têtes de sécurité (CSP, HSTS…). La CSP autorise les vidéos intégrées YouTube (`youtube-nocookie.com`) et Vimeo des pages Techniques.
- **Netlify / Cloudflare Pages** : `public/_redirects` et `public/_headers` font de même.

Commande de build : `npm run build` (génère aussi `sitemap.xml` avec les recettes publiées) — dossier publié : `dist`.

## 6. Avant la mise en ligne

- Compléter le SIRET et l'hébergeur dans `src/features/public-site/legal-page.tsx` (constante `LEGAL`).
- Renseigner les paramètres du site (admin → Paramètres) : identité du Chef (portrait, bio), coordonnées, réseaux sociaux, SEO.
- Relire puis publier les techniques et conseils importés (admin → Techniques & conseils) et le parcours (admin → Parcours).
- Ajouter les mentions newsletter (Brevo, finalité, désinscription) dans la politique de confidentialité.
- Déclarer le site dans Google Search Console et soumettre `https://<domaine>/sitemap.xml`.
