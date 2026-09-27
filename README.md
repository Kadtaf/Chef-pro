# Chef Pro Bordeaux

Site vitrine et back-office d'un chef de cuisine freelance : recettes avec nutrition et Nutri-Score, fiches techniques chiffrées, menus, cartes, plan de maîtrise sanitaire (HACCP), missions, revenus, avis clients et génération de contenu par IA.

| Couche        | Technologies                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Front         | React 19, React Router 8 (data mode, routes lazy), TypeScript 6, Vite 8, Tailwind CSS 4, Radix UI  |
| Données       | TanStack Query 5, supabase-js 2, React Hook Form + Zod 4                                           |
| Back-end      | Supabase : Postgres (RLS), Auth, Storage, Edge Functions (Deno)                                    |
| IA            | Mistral (texte : `mistral-large`, images : agent Mistral) via edge functions authentifiées         |
| Qualité       | Vitest (unitaires + SQL sur PGlite), Playwright (E2E), ESLint (type-aware + a11y), Prettier, Husky |
| Observabilité | Sentry (optionnel, chargé à la demande)                                                            |

## Démarrage

Prérequis : Node.js ≥ 22.12 (24 LTS recommandé), un projet Supabase, la CLI Supabase.

```bash
npm install
cp .env.example .env            # URL + clé anon du projet Supabase
npm run dev                     # http://localhost:5173
```

Base de données et fonctions (voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) pour la procédure complète) :

```bash
supabase link --project-ref <ref>
supabase db push                                         # applique supabase/migrations
supabase secrets set --env-file supabase/functions/.env  # clés Mistral, origines CORS…
npm run functions:deploy
npm run db:types                                         # régénère src/shared/types/database.ts
```

Créer le premier administrateur : créez l'utilisateur dans le dashboard Supabase (Authentication → Users), puis
`update public.profiles set role = 'admin' where email = 'vous@exemple.fr';`
L'inscription publique est désactivée : tout nouveau compte est `viewer` et n'a accès à rien.

## Commandes

| Commande                  | Rôle                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| `npm run dev`             | Serveur de développement                                             |
| `npm run build`           | Génère le sitemap (recettes publiées incluses) puis le build de prod |
| `npm run check`           | Typecheck + lint + format + tests (ce que lance la CI)               |
| `npm run test`            | Tests unitaires (jsdom) et tests SQL/RLS (Postgres en mémoire)       |
| `npm run test:e2e`        | Tests Playwright (Supabase simulé, aucune donnée réelle)             |
| `npm run functions:check` | Typecheck Deno des edge functions                                    |
| `npm run db:types`        | Régénère les types TypeScript depuis la base liée                    |

## Architecture

```
src/
├── app/                 router (routes lazy), providers, error boundary
├── features/            un dossier par domaine métier
│   ├── recipes/         api.ts (React Query) · schema.ts (Zod + mapping RPC) · pages · pdf.ts
│   ├── technical-sheets/ menus/ cards/ haccp/ missions/ revenues/
│   ├── comments/ messages/ portfolio/ services/ settings/ dashboard/
│   ├── culinary/        ingrédients, étapes, nutrition, coûts (partagé recettes / fiches)
│   ├── ai-studio/       génération, aperçu, sauvegarde des contenus IA
│   ├── export/          moteur PDF générique (jsPDF chargé à la demande)
│   ├── auth/ admin-shell/ public-site/ notifications/
└── shared/
    ├── ui/              composants (Button, Field, Dialog, Table, Seo…)
    ├── lib/             supabase, env, nutrition (Nutri-Score 2023), crud, format, storage…
    ├── domain/          vocabulaires métier (saisons, statuts…)
    └── types/           types de la base (générés)
supabase/
├── migrations/          schéma, RLS, RPC transactionnelles, audit, dashboard
├── functions/           ai-generate · ai-generate-image · public-submit (+ _shared)
└── tests/               tests RLS/RPC exécutés sur PGlite
```

Principes :

- **La sécurité est côté serveur.** Toute écriture exige `profiles.role = 'admin'` (fonction `is_admin()` dans les politiques RLS). Le visiteur anonyme ne lit que le contenu publié et ne peut rien écrire : les formulaires publics passent par la fonction `public-submit` (validation, honeypot, captcha Turnstile optionnel, limitation de débit).
- **Une seule source de vérité pour les calculs.** Les valeurs nutritionnelles, le Nutri-Score, les coûts et les allergènes sont dérivés des ingrédients (`features/culinary`), que la saisie soit manuelle ou générée par IA.
- **Écritures atomiques.** Une recette et ses ingrédients (fiche, menu, carte…) sont enregistrés par une RPC Postgres en une seule transaction.
- **Contrat IA partagé.** `supabase/functions/_shared/ai-schemas.ts` est importé par les edge functions et par le front (`@ai-contract`) : les réponses de l'IA sont validées côté serveur avec le même schéma que celui utilisé par l'interface.

## Nutri-Score

Calcul selon l'algorithme 2023 (aliments généraux), sur 100 g : énergie, sucres, acides gras saturés, sel, protéines, fibres et part de fruits/légumes/légumineuses. Le poids d'une portion est saisi ou estimé à partir des ingrédients exprimés en g/ml. Le score affiché est une **estimation** (valeurs issues des ingrédients crus), signalée comme telle sur le site.

## Licence

Code propriétaire — tous droits réservés.
