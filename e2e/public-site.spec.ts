import { expect, test } from './fixtures';

test('home page renders hero and the featured recipe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('expériences');
  await expect(page.getByText('Velouté de potimarron')).toBeVisible();
  await expect(page).toHaveTitle(/Chef Pro Bordeaux/);
});

test('recipe list filters by search and opens the detail page', async ({ page }) => {
  await page.goto('/recettes');
  const search = page.getByRole('searchbox', { name: 'Rechercher une recette' });
  await search.fill('inexistant');
  await expect(page.getByText('Aucune recette trouvée')).toBeVisible();
  await search.fill('velouté');
  await page.getByRole('link', { name: /Velouté de potimarron/ }).click();
  await expect(page).toHaveURL(/\/recettes\/veloute-de-potimarron$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Velouté de potimarron' })).toBeVisible();
  await expect(page.getByText('Cuire le potimarron.')).toBeVisible();

  // Structured data for Google rich results
  const jsonLd = await page.locator('script[type="application/ld+json"]').last().textContent();
  expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({ '@type': 'Recipe', name: 'Velouté de potimarron' });
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
