import { expect, test } from './fixtures';

test('home page renders hero and the featured recipe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('exigence');
  await expect(page.getByText('Velouté de potimarron')).toBeVisible();
  await expect(page).toHaveTitle(/Chef Pro Bordeaux/);
});

test('recipe list filters by search and opens the detail page', async ({ page }) => {
  await page.goto('/recettes');
  const search = page.getByRole('searchbox', { name: 'Rechercher une recette' });
  await search.fill('inexistant');
  await expect(page.getByText('Aucune recette ne correspond')).toBeVisible();
  await search.fill('velouté');
  await page.getByRole('link', { name: /Velouté de potimarron/ }).click();
  await expect(page).toHaveURL(/\/recettes\/veloute-de-potimarron$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Velouté de potimarron' })).toBeVisible();
  await expect(page.getByText('Cuire le potimarron.')).toBeVisible();

  // Structured data for Google rich results
  const jsonLd = await page.locator('script[type="application/ld+json"]').last().textContent();
  expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({ '@type': 'Recipe', name: 'Velouté de potimarron' });
});

test('blog type filters narrow the list and favourites persist without an account', async ({ page, isMobile }) => {
  await page.goto('/recettes');
  // Filters live in the sidebar on desktop and in a dialog on mobile.
  const filters = isMobile ? page.getByRole('dialog') : page.locator('aside');
  const openFilters = async () => {
    if (isMobile) await page.getByRole('button', { name: /^Filtres/ }).click();
  };
  const closeFilters = async () => {
    if (isMobile) await filters.getByRole('button', { name: /^Voir/ }).click();
  };

  await openFilters();
  await filters.getByRole('button', { name: 'Dessert', exact: true }).click();
  await closeFilters();
  await expect(page).toHaveURL(/type=dessert/);
  await expect(page.getByText('Aucune recette ne correspond')).toBeVisible();

  await openFilters();
  await filters.getByRole('button', { name: 'Velouté', exact: true }).click();
  await closeFilters();
  await expect(page.getByRole('link', { name: /Velouté de potimarron/ })).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter « Velouté de potimarron » aux favoris' }).click();
  await page.goto('/favoris');
  await expect(page.getByRole('link', { name: /Velouté de potimarron/ })).toBeVisible();
});

test('recipe page shows chef tips and the wine pairing with the legal notice', async ({ page }) => {
  await page.goto('/recettes/veloute-de-potimarron');
  await expect(page.getByText('Torréfiez les noisettes à sec')).toBeVisible();
  await expect(page.getByText(/Un Graves blanc/)).toBeVisible();
  await expect(page.getByText(/consommer avec modération/)).toBeVisible();
});

test('techniques are listed and readable', async ({ page }) => {
  await page.goto('/techniques');
  await page
    .getByRole('link', { name: /Réussir un beurre blanc/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/techniques\/reussir-un-beurre-blanc$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Réussir un beurre blanc' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Le principe' })).toBeVisible();
});

test('about page presents the culinary career', async ({ page }) => {
  await page.goto('/a-propos');
  await expect(page.getByText('Parcours culinaire & réalisations professionnelles')).toBeVisible();
  await expect(page.getByText('Le Plana').first()).toBeVisible();
});

test('newsletter signup requires consent (double opt-in)', async ({ page }) => {
  await page.goto('/contact');
  const footer = page.locator('footer');
  await footer.getByRole('textbox', { name: 'Votre adresse email' }).fill('jeanne@example.com');
  await footer.getByRole('button', { name: "S'inscrire" }).click();
  await expect(footer.getByRole('alert')).toBeVisible();
  await footer.getByRole('checkbox').check();
  await footer.getByRole('button', { name: "S'inscrire" }).click();
  await expect(footer.getByText('Presque terminé !')).toBeVisible();
});

test('the old portfolio URL redirects to the blog', async ({ page }) => {
  await page.goto('/portfolio');
  await expect(page).toHaveURL(/\/recettes$/);
});

test('unknown recipe shows a 404 page', async ({ page }) => {
  await page.goto('/recettes/nexiste-pas');
  await expect(page.getByRole('heading', { name: 'Recette introuvable' })).toBeVisible();
});

test('contact form validates then submits', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Votre nom est requis')).toBeVisible();

  await page.getByRole('textbox', { name: /^Nom complet/ }).fill('Jeanne Martin');
  await page.getByRole('textbox', { name: /^Email/ }).fill('jeanne@example.com');
  await page
    .getByRole('textbox', { name: /^Message/ })
    .fill('Bonjour, je souhaite un devis pour un mariage de 80 personnes.');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Message envoyé !')).toBeVisible();
});

test('admin area redirects anonymous visitors to the login page', async ({ page }) => {
  await page.goto('/admin/recipes');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Frecipes/);
  await page.getByRole('textbox', { name: 'Email' }).fill('chef@example.com');
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('mauvais');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toContainText('Email ou mot de passe incorrect');
});
