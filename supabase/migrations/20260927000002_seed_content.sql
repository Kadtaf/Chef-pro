-- =============================================================================
-- Editorial seed content (editable from the back-office).
--  * Chef identity and career, strictly derived from the chef's CV.
--  * Culinary technique articles and chef's advice.
-- Inserts are idempotent (skipped when content already exists).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Chef identity
-- -----------------------------------------------------------------------------
update public.settings set
  chef_name = 'Kader Taftaf',
  chef_title = 'Chef de cuisine',
  years_experience = 20,
  chef_bio = 'Chef de cuisine avec plus de vingt ans d''expérience en restauration traditionnelle et semi-gastronomique, dont seize ans à la tête de la cuisine du restaurant Le Plana à Bordeaux. De la création des cartes au pilotage des équipes, en passant par la maîtrise des coûts, le contrôle qualité et l''application rigoureuse des normes HACCP, je mets au service des établissements et des particuliers une exigence constante, y compris au cœur des services les plus intenses.',
  languages = '{"Français — courant","Anglais — B1","Arabe — courant"}',
  education = '{"2020 — Bac Pro Cuisine (VAE), Bordeaux","2022 – 2025 — Formation en programmation informatique, Bordeaux","2019 — Licence 2 Mathématiques, Université d''Angers","2004 — DEA Matériaux et procédés, Université de Limoges","2002 — Maîtrise de Physique appliquée, Université de Bordeaux"}'
where chef_name = '';

-- -----------------------------------------------------------------------------
-- Career (only kitchen positions). Junior "cuisinier" positions are drafts:
-- the chef decides whether to publish them.
-- -----------------------------------------------------------------------------
insert into public.career_experiences
  (role, establishment, city, start_year, end_year, summary, missions, skills, techniques, cuisine_types, image_prompt, is_published, position)
select * from (values
  ('Chef de cuisine freelance', 'Missions via la plateforme Brigad', 'Bordeaux et Gironde', 2026, null::integer,
   'Chef de cuisine indépendant, j''interviens en renfort ou en remplacement auprès de restaurants qui recherchent un chef immédiatement opérationnel : prise en main rapide de la brigade, de la carte et des procédures de l''établissement, avec le même niveau d''exigence qu''un chef en poste.',
   '{"Prise de poste immédiate et reprise de la production existante","Encadrement de brigades inconnues sur des services complets","Respect des fiches techniques et des standards de la maison","Application des procédures HACCP propres à chaque établissement"}'::text[],
   '{"Adaptabilité","Leadership immédiat","Organisation","Régularité en production"}'::text[],
   '{"Organisation de la mise en place","Gestion des flux en service","Dressage à l''assiette"}'::text[],
   '{"Traditionnelle","Semi-gastronomique"}'::text[],
   'Brigade de cuisine professionnelle en plein service, chef en veste blanche au passe, lumière chaude, photographie éditoriale réaliste',
   true, 1),

  ('Chef de cuisine', 'Restaurant La Conche', 'Lacanau', 2025, 2026,
   'Retour comme chef de cuisine dans une maison où j''avais fait mes premières armes de cuisinier : direction de la cuisine, élaboration de la carte et pilotage de la production dans le contexte d''une station balnéaire à forte saisonnalité.',
   '{"Direction de la cuisine et encadrement de l''équipe","Élaboration de la carte et des menus","Gestion des achats, des stocks et des fournisseurs","Adaptation de la production aux variations d''affluence de la saison"}',
   '{"Gestion de cuisine","Création de carte","Maîtrise des coûts matières","Gestion de la forte affluence"}',
   '{"Fonds, jus et sauces","Cuissons des viandes et des poissons","Dressage à l''assiette"}',
   '{"Traditionnelle","Semi-gastronomique"}',
   'Cuisine de restaurant de bord de mer sur la côte atlantique, plan de travail en inox avec produits frais, lumière naturelle, photographie réaliste',
   true, 2),

  ('Chef de cuisine', 'Restaurant Chez Pompon', 'Bordeaux', 2024, 2025,
   'Chef de cuisine en charge de la production et de l''organisation de la cuisine : conception des plats, gestion de l''équipe et des approvisionnements, contrôle qualité permanent.',
   '{"Organisation de la production et des mises en place","Conception de recettes de saison","Commandes, réception et suivi des stocks","Contrôle qualité et respect des normes d''hygiène"}',
   '{"Organisation","Créativité saisonnière","Contrôle qualité","Encadrement d''équipe"}',
   '{"Cuissons","Sauces","Dressage à l''assiette"}',
   '{"Traditionnelle","Semi-gastronomique"}',
   'Cuisine de restaurant bordelais, assiette dressée avec soin sur le passe, ambiance chaleureuse, photographie culinaire réaliste',
   true, 3),

  ('Chef de cuisine', 'Restaurant Le Plana', 'Bordeaux', 2007, 2023,
   'Seize années à la tête de la cuisine du Plana, où j''ai successivement été cuisinier puis second avant d''en prendre la direction. J''y ai assuré la gestion complète de la cuisine — production, achats, stocks, hygiène et sécurité alimentaire — tout en faisant évoluer la carte au fil des saisons et en formant de nombreux apprentis et collaborateurs.',
   '{"Gestion complète de la cuisine : production, achats, stocks, hygiène et sécurité alimentaire","Élaboration des cartes, menus, fiches techniques et ratios de rentabilité","Optimisation des coûts matières et réduction du gaspillage","Plannings, horaires et répartition des tâches","Sélection des fournisseurs, négociation et suivi des commandes","Encadrement d''équipes jusqu''à 10 personnes","Recrutement, intégration et formation des apprentis","Mise en place de procédures internes et de standards qualité"}',
   '{"Leadership","Gestion budgétaire et analyse des marges","Formation et transmission","Anticipation des besoins opérationnels","Constance de la qualité en forte affluence"}',
   '{"Fonds, jus et sauces","Cuissons des viandes et des poissons","Pâtisserie de restaurant","Dressage à l''assiette","Fiches techniques et ratios"}',
   '{"Traditionnelle","Semi-gastronomique"}',
   'Cuisine de brasserie traditionnelle bordelaise, fourneaux en fonte, casseroles en cuivre, chef dressant une assiette, lumière chaude, photographie éditoriale réaliste',
   true, 4),

  ('Second de cuisine', 'Restaurant Le Plana', 'Bordeaux', 2005, 2007,
   'Bras droit du chef, j''ai coordonné la brigade pendant les services, supervisé les mises en place et assuré la continuité de la cuisine en l''absence du chef — une étape décisive avant d''en prendre la direction.',
   '{"Coordination de la brigade en service","Supervision des mises en place","Remplacement du chef de cuisine","Contrôle de la qualité des assiettes au passe"}',
   '{"Coordination d''équipe","Rapidité d''exécution","Précision","Sens du détail"}',
   '{"Cuissons","Sauces","Dressage à l''assiette"}',
   '{"Traditionnelle","Semi-gastronomique"}',
   'Second de cuisine au passe contrôlant les assiettes pendant le coup de feu, brigade en arrière-plan, photographie réaliste',
   true, 5),

  ('Cuisinier', 'Restaurant Le Plana', 'Bordeaux', 2004, 2005,
   'Premier poste au Plana, sur les postes chauds de la brigade.',
   '{"Tenue de poste en service","Mise en place et préparations de base"}',
   '{"Rigueur","Rapidité"}', '{}', '{"Traditionnelle"}', null, false, 6),

  ('Cuisinier', 'Restaurant La Conche', 'Lacanau', 2002, 2004,
   'Deux saisons en cuisine sur la côte atlantique.',
   '{"Tenue de poste en service","Mise en place et préparations de base"}',
   '{"Rigueur","Rapidité"}', '{}', '{"Traditionnelle"}', null, false, 7),

  ('Cuisinier', 'Restaurant Le Passage', 'Bordeaux', 2001, 2002,
   'Première expérience en cuisine professionnelle.',
   '{"Mise en place et préparations de base"}',
   '{"Rigueur"}', '{}', '{"Traditionnelle"}', null, false, 8)
) as v(role, establishment, city, start_year, end_year, summary, missions, skills, techniques, cuisine_types, image_prompt, is_published, position)
where not exists (select 1 from public.career_experiences);

-- -----------------------------------------------------------------------------
-- Articles: culinary techniques
-- -----------------------------------------------------------------------------
insert into public.articles (kind, title, slug, excerpt, body, difficulty, reading_minutes, tags, is_published, position)
select * from (values
  ('technique', 'Réussir un beurre blanc', 'reussir-un-beurre-blanc',
   'La grande sauce émulsionnée de la cuisine française : une réduction acide montée au beurre froid, sans jamais bouillir.',
   $body$Le beurre blanc est une émulsion : de fines gouttelettes de matière grasse maintenues en suspension dans une réduction. Tout l'enjeu est de conserver cette émulsion stable, donc de maîtriser la température.

## Ingrédients pour 4 personnes
- 2 échalotes finement ciselées
- 10 cl de vin blanc sec
- 5 cl de vinaigre de vin blanc
- 200 g de beurre doux très froid, coupé en dés
- Sel, poivre blanc

## La méthode
1. Réduisez l'échalote avec le vin et le vinaigre jusqu'à ce qu'il ne reste qu'une à deux cuillerées de liquide : c'est la base aromatique.
2. Baissez le feu au minimum. Incorporez le beurre froid dés par dés, en fouettant sans cesse : chaque dé doit être presque fondu avant d'ajouter le suivant.
3. La sauce doit napper la cuillère et rester onctueuse. Assaisonnez, puis passez-la au chinois si vous la souhaitez lisse.

## Les points clés
- Ne dépassez jamais 60 à 65 °C : au-delà, l'émulsion tranche et le beurre se sépare.
- Une cuillerée de crème dans la réduction stabilise la sauce pour un service long.
- Gardez-la au bain-marie tiède, jamais sur le feu.

## Si la sauce tranche
Retirez-la du feu, ajoutez une cuillerée d'eau froide et fouettez énergiquement : l'émulsion se reforme le plus souvent.$body$,
   'moyen', 4, '{"sauce","émulsion","poisson"}'::text[], true, 1),

  ('technique', 'Snacker un poisson ou des Saint-Jacques', 'snacker-poisson-saint-jacques',
   'Une coloration franche à l''extérieur, un cœur nacré : la cuisson vive, courte et précise des produits de la mer.',
   $body$Snacker, c'est saisir un produit à feu très vif, peu de temps, pour obtenir une croûte dorée (réaction de Maillard) tout en gardant un cœur juste cuit.

## Préparer le produit
- Sortez le poisson ou les noix du réfrigérateur 10 minutes avant la cuisson.
- Séchez-les soigneusement sur du papier absorbant : l'humidité empêche la coloration.
- Salez au dernier moment.

## La cuisson
1. Faites chauffer une poêle épaisse (inox ou fonte) à feu vif, avec un filet d'huile neutre.
2. Déposez les noix ou le poisson côté peau, sans les serrer, et n'y touchez plus.
3. Pour des Saint-Jacques de taille moyenne, comptez environ 1 minute 30 par face. Pour un filet de poisson, cuisez à 80 % côté peau, puis retournez-le quelques secondes.
4. En fin de cuisson, ajoutez une noix de beurre et arrosez le produit de beurre moussant.

## Les erreurs à éviter
- Une poêle pas assez chaude : le produit rend son eau et bouillit au lieu de dorer.
- Une poêle surchargée : la température chute brutalement.
- Retourner trop tôt : la croûte n'a pas eu le temps de se former et accroche.$body$,
   'moyen', 3, '{"poisson","saint-jacques","cuisson"}', true, 2),

  ('technique', 'Le fond brun de veau', 'fond-brun-de-veau',
   'Base de nombreux jus et sauces, le fond brun se construit en trois temps : rôtir, mouiller, réduire.',
   $body$Le fond brun apporte profondeur, couleur et liant aux jus et aux sauces. Il demande du temps, mais peu de technique : la qualité vient de la coloration et de la patience.

## Ingrédients (environ 2 litres)
- 3 kg d'os et de parures de veau concassés
- 2 carottes, 2 oignons, 1 branche de céleri
- 2 cuillerées à soupe de concentré de tomate
- 1 bouquet garni, quelques grains de poivre

## La méthode
1. Rôtissez les os au four à 220 °C jusqu'à une belle coloration brune, pendant 40 à 50 minutes.
2. Ajoutez la garniture aromatique taillée en mirepoix et laissez colorer 15 minutes.
3. Incorporez le concentré de tomate et faites-le « pincer » quelques minutes pour en retirer l'acidité.
4. Déglacez la plaque, transférez le tout dans une marmite et mouillez à l'eau froide à hauteur.
5. Portez à frémissement, écumez régulièrement et laissez cuire 6 à 8 heures sans bouillir.
6. Passez au chinois, dégraissez, puis réduisez selon l'usage : jus, glace de viande ou base de sauce.

## Conseils du chef
- Mouiller à l'eau froide permet une extraction progressive et un fond plus limpide.
- Refroidissez rapidement le fond (cellule ou bain de glace) avant stockage : c'est un point de maîtrise sanitaire.$body$,
   'moyen', 5, '{"fond","sauce","viande"}', true, 3),

  ('technique', 'La cuisson à basse température', 'cuisson-basse-temperature',
   'Cuire à une température proche de la cuisson à cœur recherchée pour une texture et une régularité incomparables.',
   $body$La cuisson à basse température consiste à cuire un produit à une température d'enceinte proche de la température à cœur souhaitée. Le résultat : une cuisson homogène d'un bord à l'autre et des pertes de poids réduites.

## Les repères de température à cœur
- Bœuf saignant : 50 à 52 °C
- Bœuf à point : 55 à 57 °C
- Agneau rosé : 56 à 58 °C
- Poissons nacrés : 45 à 52 °C selon l'espèce
- Volaille : cuisez jusqu'à la température à cœur réglementaire, ou appliquez un couple temps-température validé

## Les règles d'hygiène
La sécurité sanitaire dépend du couple temps-température : plus la température est basse, plus le temps de maintien doit être long. En restauration, ces cuissons doivent être encadrées par votre plan de maîtrise sanitaire.
- Utilisez une sonde étalonnée.
- Refroidissez rapidement les produits cuits non servis immédiatement.
- Ne cuisez jamais une volaille « rosée » sans protocole validé.

## La finition
Une cuisson basse température ne colore pas : terminez par un passage très rapide à la poêle, au grill ou au chalumeau juste avant de servir.$body$,
   'difficile', 4, '{"cuisson","viande","hygiène"}', true, 4),

  ('technique', 'Les tailles de légumes', 'tailles-de-legumes',
   'Brunoise, julienne, mirepoix, paysanne : des tailles régulières pour une cuisson homogène et une belle présentation.',
   $body$Une taille régulière n'est pas qu'une question d'esthétique : des morceaux de même dimension cuisent de manière homogène.

## Les tailles de référence
- Brunoise : petits dés de 2 à 3 mm, pour les garnitures fines et les sauces.
- Julienne : fins bâtonnets d'environ 1 à 2 mm d'épaisseur sur 4 à 5 cm de long.
- Mirepoix : gros dés de 1 à 2 cm, pour les fonds et les braisages.
- Paysanne : fines tranches de 1 à 2 cm de côté, pour les potages.
- Jardinière : bâtonnets de 4 à 5 cm sur 4 à 5 mm de section.
- Macédoine : dés de 4 à 5 mm.

## La bonne technique
1. Stabilisez toujours le légume en taillant d'abord une face plane.
2. Tenez le produit avec les doigts repliés, la lame guidée par les phalanges.
3. Taillez d'abord des tranches, puis des bâtonnets, puis des dés.

## Conseil du chef
Gardez les parures : elles serviront à un fond, un bouillon ou un potage. Une bonne taille, c'est aussi zéro gaspillage.$body$,
   'facile', 3, '{"légumes","taillage","base"}', true, 5),

  ('technique', 'Pâte sablée : sablage ou crémage ?', 'pate-sablee-sablage-cremage',
   'Deux méthodes pour deux textures : friable et croustillante, ou fine et régulière.',
   $body$La pâte sablée se prépare selon deux méthodes, qui donnent des textures différentes.

## Le sablage
On frotte la farine et le beurre froid du bout des doigts jusqu'à obtenir une texture sableuse, avant d'ajouter le sucre et l'œuf. Les grains de farine sont enrobés de matière grasse, ce qui limite le développement du gluten : la pâte est très friable et croustillante.

## Le crémage
On travaille le beurre pommade avec le sucre, puis on ajoute l'œuf et enfin la farine, sans trop pétrir. La pâte est plus homogène et se prête mieux au fonçage de fonds de tarte réguliers.

## Les règles communes
- Ne travaillez pas trop la pâte une fois la farine ajoutée.
- Laissez-la reposer au moins 1 heure au froid, filmée au contact.
- Abaissez-la entre deux feuilles de papier cuisson pour éviter l'ajout de farine.
- Cuisez à blanc entre 160 et 170 °C, jusqu'à une coloration dorée homogène.

## Conseil du chef
Une pointe de sel dans une pâte sucrée révèle le goût du beurre.$body$,
   'moyen', 3, '{"pâtisserie","pâte","dessert"}', true, 6)
) as v(kind, title, slug, excerpt, body, difficulty, reading_minutes, tags, is_published, position)
where not exists (select 1 from public.articles where kind = 'technique');

-- -----------------------------------------------------------------------------
-- Articles: chef's advice
-- -----------------------------------------------------------------------------
insert into public.articles (kind, title, slug, excerpt, body, difficulty, reading_minutes, tags, is_published, position)
select * from (values
  ('conseil', 'Assaisonner juste', 'assaisonner-juste',
   'Sel, acidité, amertume, piquant : l''assaisonnement se construit tout au long de la recette, pas seulement à la fin.',
   $body$L'assaisonnement est ce qui distingue un plat correct d'un plat mémorable.

## Saler au bon moment
- Salez l'eau de cuisson des légumes et des pâtes : c'est le seul moment où le sel pénètre au cœur.
- Salez une viande juste avant de la saisir, ou bien plusieurs heures à l'avance, mais pas entre les deux : elle rendrait son jus en surface.
- Salez les poissons au dernier moment.

## Goûter, toujours
Goûtez à chaque étape, pas seulement au dressage. Une sauce réduite se concentre : salez-la en fin de réduction.

## Penser à l'acidité
Un plat qui semble « plat » manque souvent d'acidité plutôt que de sel. Un trait de citron, de vinaigre ou quelques pickles réveillent une assiette.

## L'équilibre des saveurs
Salé, sucré, acide, amer : chaque assiette gagne à jouer sur au moins trois de ces saveurs, et sur un contraste de textures.$body$,
   null::text, 3, '{"assaisonnement","bases"}'::text[], true, 1),

  ('conseil', 'Organiser sa mise en place', 'organiser-sa-mise-en-place',
   'Une cuisine sereine se prépare avant le service : c''est la mise en place qui fait la régularité.',
   $body$En cuisine professionnelle, le service se gagne avant qu'il ne commence.

## Lister avant d'agir
Relisez la carte et les réservations, puis établissez la liste de ce qui doit être prêt : taillages, sauces, garnitures, portions.

## Ordonner les tâches
1. Commencez par les préparations longues : fonds, marinades, pâtes à reposer.
2. Enchaînez avec les cuissons préalables, puis les taillages.
3. Terminez par les éléments fragiles : herbes, émulsions, finitions.

## Organiser son poste
- Chaque préparation dans un bac étiqueté (nom, date, heure).
- Les produits les plus utilisés à portée de main.
- Un torchon humide sous la planche, un bac à déchets propre.

## Respecter la marche en avant
Des produits bruts vers les produits finis, du sale vers le propre : c'est un principe d'hygiène autant que d'efficacité.$body$,
   null, 3, '{"organisation","service","hygiène"}', true, 2),

  ('conseil', 'Entretenir ses couteaux', 'entretenir-ses-couteaux',
   'Un couteau bien affûté est plus sûr qu''un couteau émoussé : quelques gestes suffisent pour le garder performant.',
   $body$Un couteau émoussé glisse et demande de forcer : c'est la première cause de coupure en cuisine.

## Fusil ou pierre ?
- Le fusil redresse le fil de la lame au quotidien, sans retirer de métal.
- La pierre à aiguiser reforme le tranchant : elle s'utilise quand le fusil ne suffit plus, en général toutes les quelques semaines.

## L'angle
Maintenez un angle constant d'environ 15 à 20° entre la lame et la pierre, selon le couteau (les lames japonaises sont souvent plus fines).

## Au quotidien
- Lavez vos couteaux à la main, jamais au lave-vaisselle.
- Séchez-les immédiatement.
- Rangez-les sur une barre aimantée ou dans des protège-lames.
- Coupez sur une planche en bois ou en polyéthylène, jamais sur le verre ou l'inox.$body$,
   null, 2, '{"matériel","sécurité"}', true, 3),

  ('conseil', 'Rattraper une sauce', 'rattraper-une-sauce',
   'Émulsion tranchée, sauce trop liquide, trop salée : les réflexes pour sauver une sauce en plein service.',
   $body$Même les meilleurs cuisiniers ratent une sauce. L'important est de savoir la rattraper.

## Une émulsion qui tranche
Mayonnaise, béarnaise, beurre blanc : retirez du feu et fouettez une cuillerée d'eau froide dans un bol propre, puis incorporez la sauce tranchée petit à petit.

## Une sauce trop liquide
- Réduisez-la à feu vif si elle supporte l'ébullition.
- Sinon, liez-la avec un peu de fécule délayée à froid, ou montez-la au beurre froid hors du feu.

## Une sauce trop salée
Allongez-la avec un fond non salé ou un peu de crème, puis rectifiez l'équilibre avec une pointe d'acidité. Une pomme de terre ne « pompe » pas le sel : c'est une idée reçue.

## Une sauce grumeleuse
Passez-la au chinois ou mixez-la, puis remettez-la à température doucement.$body$,
   null, 3, '{"sauce","astuces"}', true, 4),

  ('conseil', 'Les secrets d''un beau dressage', 'secrets-beau-dressage',
   'L''œil mange en premier : hauteur, couleurs, contrastes et netteté font la différence.',
   $body$Le dressage raconte le plat avant même la première bouchée.

## Les principes
- Choisissez une assiette qui met le plat en valeur : les tons neutres laissent parler les couleurs.
- Créez de la hauteur et un point focal.
- Jouez sur les contrastes de couleurs et de textures : croquant, fondant, brillant.
- Préférez les nombres impairs : trois éléments sont plus naturels que deux ou quatre.

## Les gestes
- Chauffez les assiettes pour les plats chauds, refroidissez-les pour les plats froids.
- Utilisez une pince et une cuillère à sauce pour des gestes précis.
- Essuyez toujours le bord de l'assiette avant l'envoi.

## La sauce
Nappez à côté ou en dessous plutôt que par-dessus : la croûte d'une viande ou la peau croustillante d'un poisson restent intactes.$body$,
   null, 2, '{"dressage","présentation"}', true, 5),

  ('conseil', 'Cuisiner de saison et sans gaspillage', 'cuisiner-saison-sans-gaspillage',
   'Des produits au sommet de leur goût, des coûts maîtrisés et des parures valorisées : la cuisine de saison est aussi une cuisine responsable.',
   $body$Un produit de saison a plus de goût, coûte moins cher et demande moins de transformation.

## Construire sa carte avec la saison
Partez du marché et des producteurs plutôt que de la recette : c'est le produit qui dicte le plat. Une carte courte, renouvelée souvent, limite les pertes.

## Valoriser les parures
- Épluchures et parures de légumes : fonds, bouillons, chips.
- Fanes de carottes ou de radis : pesto, potages.
- Arêtes et têtes de poisson : fumet.
- Pain rassis : chapelure, croûtons, pain perdu.

## Maîtriser les quantités
Des fiches techniques précises et des grammages respectés sont la première arme contre le gaspillage — et pour la rentabilité.$body$,
   null, 3, '{"saison","anti-gaspillage","rentabilité"}', true, 6)
) as v(kind, title, slug, excerpt, body, difficulty, reading_minutes, tags, is_published, position)
where not exists (select 1 from public.articles where kind = 'conseil');
