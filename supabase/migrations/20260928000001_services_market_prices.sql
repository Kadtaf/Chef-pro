-- Services ("Prestations"): remove the duplicates created on 2026-09-26 and
-- align prices, wording and features on the 2026 market (Bordeaux / France):
--   * freelance chef de cuisine ≈ 30–38 € HT/h → 350 € HT per 10-hour day;
--   * freelance second de cuisine ≈ 25–30 € HT/h → 280 € HT per day;
--   * restaurant consulting 600–1 200 €/day for an experienced consultant
--     → audit + action plan (2 days on site + report) as a 1 500 € package;
--   * intra-company kitchen training ≈ 900–1 250 € per day and group;
--   * private chef in Bordeaux 63–120 € per guest → from 75 € per guest.
-- Rows are addressed by id: this is a no-op on databases without them.

delete from public.services
where id in (
  '7140e1bd-6c22-48dd-878c-b4208484c922',
  '94a4add4-c483-4a29-85eb-115d04528d53',
  '15bdddb4-eebc-4142-b042-652ed25823cb',
  'a07e3f48-8f7e-479f-8ebb-b1aa6d53ce77',
  '98fc0daa-155b-4c57-b4ce-3df4834cccc9'
);

update public.services set
  title = 'Chef de cuisine',
  description = 'Chef de cuisine en renfort ou en remplacement : je prends la direction de votre cuisine, de la mise en place au dernier envoi.',
  price = 350, price_unit = 'jour',
  features = '["Direction de la brigade et du passe", "Création et mise au point des plats", "Commandes, stocks et coût matière", "Application du plan de maîtrise sanitaire (HACCP)"]'::jsonb,
  is_featured = true, position = 1
where id = '6e2e2e60-e57a-485f-9c3d-db4225c9c4b2';

update public.services set
  title = 'Second de cuisine',
  description = 'Un second expérimenté pour épauler votre chef, tenir les services et encadrer la brigade.',
  price = 280, price_unit = 'jour',
  features = '["Organisation de la mise en place", "Tenue des services en autonomie", "Encadrement et formation des commis", "Contrôle qualité et traçabilité"]'::jsonb,
  is_featured = false, position = 2
where id = '6443d12a-f01b-4379-b753-6f9446afa768';

update public.services set
  title = 'Audit & conseil culinaire',
  description = 'Diagnostic complet de votre cuisine et plan d''action chiffré : carte, organisation, coûts et hygiène.',
  price = 1500, price_unit = 'forfait',
  features = '["2 jours d''observation sur site", "Analyse de la carte et des coûts matière", "Organisation de la brigade et des postes", "Rapport écrit et plan d''action priorisé", "Suivi mensuel en option"]'::jsonb,
  is_featured = false, position = 3
where id = '6c7ef850-71f0-4d4c-93aa-2c46c7a967df';

update public.services set
  title = 'Formation de brigade',
  description = 'Formation pratique dans votre cuisine, adaptée à votre carte et au niveau de votre équipe (jusqu''à 8 personnes).',
  price = 900, price_unit = 'jour',
  features = '["Techniques et gestes professionnels", "Cuissons, sauces et dressage", "Maîtrise des coûts et anti-gaspillage", "Bonnes pratiques d''hygiène en cuisine"]'::jsonb,
  is_featured = false, position = 4
where id = 'b324b599-f7b9-4c54-90d9-1f2cd65db53a';

update public.services set
  title = 'Chef à domicile & événements',
  description = 'Dîners privés, anniversaires, réceptions : un menu sur mesure cuisiné chez vous. À partir de 8 convives, courses incluses, hors boissons.',
  price = 75, price_unit = 'personne',
  features = '["Menu personnalisé en 3 temps", "Produits frais et de saison", "Cuisine et dressage sur place", "Service à table et remise en état de la cuisine"]'::jsonb,
  is_featured = false, position = 5
where id = '24fcf816-dc81-442c-885b-13a1cb52c551';

-- Prevent duplicates from coming back (same title, whatever the case/spaces).
-- The admin form shows "Cette valeur existe déjà (doublon)." on conflict.
create unique index if not exists services_title_unique on public.services (lower(btrim(title)));
