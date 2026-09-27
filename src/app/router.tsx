import { Navigate, Outlet, createBrowserRouter } from 'react-router';
import { RequireAdmin } from '@/features/auth/require-admin';
import { PageLoader } from '@/shared/ui/feedback';
import { RouteError } from './route-error';

/**
 * Every page is a lazily-loaded module exporting `Component`, so the public
 * site never downloads the back-office code (charts, PDF, forms…).
 */
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        path: '/',
        lazy: () => import('@/features/public-site/public-layout'),
        children: [
          {
            errorElement: <RouteError />,
            children: [
              { index: true, lazy: () => import('@/features/public-site/home-page') },
              { path: 'a-propos', lazy: () => import('@/features/public-site/about-page') },
              { path: 'services', lazy: () => import('@/features/services/public-services-page') },
              { path: 'tarifs', lazy: () => import('@/features/services/public-pricing-page') },
              // The portfolio was replaced by the culinary blog: keep old links working.
              { path: 'portfolio', element: <Navigate to="/recettes" replace /> },
              { path: 'recettes', lazy: () => import('@/features/recipes/public-recipes-page') },
              { path: 'recettes/:slug', lazy: () => import('@/features/recipes/public-recipe-page') },
              { path: 'favoris', lazy: () => import('@/features/recipes/favorites-page') },
              { path: 'menus-de-saison', lazy: () => import('@/features/seasonal/seasonal-menus-page') },
              { path: 'accords-mets-vins', lazy: () => import('@/features/recipes/wine-pairings-page') },
              { path: 'techniques', lazy: () => import('@/features/articles/techniques-page') },
              { path: 'techniques/:slug', lazy: () => import('@/features/articles/technique-page') },
              { path: 'conseils', lazy: () => import('@/features/articles/conseils-page') },
              { path: 'conseils/:slug', lazy: () => import('@/features/articles/conseil-page') },
              { path: 'newsletter/confirmee', lazy: () => import('@/features/newsletter/confirmed-page') },
              { path: 'avis', lazy: () => import('@/features/comments/public-reviews-page') },
              { path: 'contact', lazy: () => import('@/features/messages/public-contact-page') },
              { path: 'mentions-legales', lazy: () => import('@/features/public-site/legal-page') },
              { path: '*', lazy: () => import('@/features/public-site/not-found') },
            ],
          },
        ],
      },
      { path: '/login', lazy: () => import('@/features/auth/login-page') },
      { path: '/reinitialiser-mot-de-passe', lazy: () => import('@/features/auth/reset-password-page') },
      {
        path: '/admin',
        element: (
          <RequireAdmin>
            <Outlet />
          </RequireAdmin>
        ),
        children: [
          {
            lazy: () => import('@/features/admin-shell/admin-layout'),
            children: [
              {
                errorElement: <RouteError />,
                children: [
                  { index: true, lazy: () => import('@/features/dashboard/dashboard-page') },

                  { path: 'recipes', lazy: () => import('@/features/recipes/recipes-list-page') },
                  { path: 'recipes/new', lazy: () => import('@/features/recipes/recipe-edit-page') },
                  { path: 'recipes/:id', lazy: () => import('@/features/recipes/recipe-detail-page') },
                  { path: 'recipes/:id/edit', lazy: () => import('@/features/recipes/recipe-edit-page') },

                  { path: 'technical-sheets', lazy: () => import('@/features/technical-sheets/sheets-list-page') },
                  { path: 'technical-sheets/new', lazy: () => import('@/features/technical-sheets/sheet-edit-page') },
                  { path: 'technical-sheets/:id', lazy: () => import('@/features/technical-sheets/sheet-detail-page') },
                  {
                    path: 'technical-sheets/:id/edit',
                    lazy: () => import('@/features/technical-sheets/sheet-edit-page'),
                  },

                  { path: 'menus', lazy: () => import('@/features/menus/menus-list-page') },
                  { path: 'menus/new', lazy: () => import('@/features/menus/menu-edit-page') },
                  { path: 'menus/:id', lazy: () => import('@/features/menus/menu-detail-page') },
                  { path: 'menus/:id/edit', lazy: () => import('@/features/menus/menu-edit-page') },

                  { path: 'cards', lazy: () => import('@/features/cards/cards-list-page') },
                  { path: 'cards/new', lazy: () => import('@/features/cards/card-edit-page') },
                  { path: 'cards/:id', lazy: () => import('@/features/cards/card-detail-page') },
                  { path: 'cards/:id/edit', lazy: () => import('@/features/cards/card-edit-page') },

                  { path: 'haccp', lazy: () => import('@/features/haccp/haccp-list-page') },
                  { path: 'haccp/new', lazy: () => import('@/features/haccp/haccp-edit-page') },
                  { path: 'haccp/:id', lazy: () => import('@/features/haccp/haccp-detail-page') },
                  { path: 'haccp/:id/edit', lazy: () => import('@/features/haccp/haccp-edit-page') },

                  { path: 'missions', lazy: () => import('@/features/missions/missions-list-page') },
                  { path: 'missions/new', lazy: () => import('@/features/missions/mission-edit-page') },
                  { path: 'missions/:id', lazy: () => import('@/features/missions/mission-detail-page') },
                  { path: 'missions/:id/edit', lazy: () => import('@/features/missions/mission-edit-page') },

                  { path: 'revenues', lazy: () => import('@/features/revenues/revenues-page') },
                  { path: 'messages', lazy: () => import('@/features/messages/messages-page') },
                  { path: 'comments', lazy: () => import('@/features/comments/comments-admin-page') },
                  { path: 'taxonomy', lazy: () => import('@/features/taxonomy/taxonomy-admin-page') },
                  { path: 'media', lazy: () => import('@/features/media/media-library-page') },
                  { path: 'blog-stats', lazy: () => import('@/features/blog-stats/blog-stats-page') },
                  { path: 'articles', lazy: () => import('@/features/articles/articles-admin-page') },
                  { path: 'articles/new', lazy: () => import('@/features/articles/article-edit-page') },
                  { path: 'articles/:id/edit', lazy: () => import('@/features/articles/article-edit-page') },
                  { path: 'career', lazy: () => import('@/features/career/career-admin-page') },
                  { path: 'services', lazy: () => import('@/features/services/services-admin-page') },
                  { path: 'settings', lazy: () => import('@/features/settings/settings-page') },
                  { path: 'ai-studio', lazy: () => import('@/features/ai-studio/ai-studio-page') },
                  { path: '*', lazy: () => import('@/features/public-site/not-found') },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
