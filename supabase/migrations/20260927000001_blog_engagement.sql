-- =============================================================================
-- Culinary blog
--  * Taxonomy (recipe types, techniques, cuisine styles, free tags) managed
--    from the back-office, many-to-many with recipes.
--  * Editable seasons (texts / images for the seasonal pages).
--  * Richer recipes: equipment, chef tips, variations, wine pairing.
--  * Visitor engagement without accounts: views, likes, ratings (one per
--    anonymous visitor id), written only by the `engage` edge function.
--  * Editorial articles (techniques, chef's advice) and the chef's career.
--  * Accent-insensitive search RPC used by the blog.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Text normalisation (accent-insensitive search without extensions)
-- -----------------------------------------------------------------------------
create or replace function public.normalize_text(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(
    replace(replace(lower(coalesce(p_value, '')), 'œ', 'oe'), 'æ', 'ae'),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy');
$$;

-- -----------------------------------------------------------------------------
-- Taxonomy
-- -----------------------------------------------------------------------------
create table public.taxonomy_terms (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('type', 'technique', 'cuisine', 'tag')),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null,
  description text,
  icon text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kind, slug)
);

create table public.recipe_terms (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  term_id uuid not null references public.taxonomy_terms (id) on delete cascade,
  primary key (recipe_id, term_id)
);
create index idx_recipe_terms_term on public.recipe_terms (term_id);

create table public.seasons (
  slug text primary key check (slug in ('printemps', 'ete', 'automne', 'hiver')),
  name text not null,
  description text not null default '',
  image_url text,
  months integer[] not null,
  position integer not null
);

insert into public.seasons (slug, name, description, months, position) values
  ('printemps', 'Printemps', 'Asperges, petits pois, agneau de lait, fraises : le retour des saveurs vives et des primeurs.', '{3,4,5}', 1),
  ('ete', 'Été', 'Tomates gorgées de soleil, poissons de ligne, fruits rouges : une cuisine fraîche, colorée et légère.', '{6,7,8}', 2),
  ('automne', 'Automne', 'Champignons, courges, gibier, figues : des saveurs profondes et réconfortantes.', '{9,10,11}', 3),
  ('hiver', 'Hiver', 'Agrumes, choux, coquilles Saint-Jacques, plats mijotés : la générosité de la saison froide.', '{12,1,2}', 4);

insert into public.taxonomy_terms (kind, name, slug, icon, position) values
  ('type', 'Entrée', 'entree', 'entree', 1),
  ('type', 'Plat', 'plat', 'plat', 2),
  ('type', 'Salade', 'salade', 'salade', 3),
  ('type', 'Amuse-bouche', 'amuse-bouche', 'amuse-bouche', 4),
  ('type', 'Velouté', 'veloute', 'veloute', 5),
  ('type', 'Potage', 'potage', 'veloute', 6),
  ('type', 'Soupe', 'soupe', 'veloute', 7),
  ('type', 'Viande', 'viande', 'viande', 8),
  ('type', 'Poisson', 'poisson', 'poisson', 9),
  ('type', 'Végétarien', 'vegetarien', 'vegetarien', 10),
  ('type', 'Dessert', 'dessert', 'dessert', 11),
  ('type', 'Pâtisserie', 'patisserie', 'patisserie', 12),
  ('type', 'Brunch', 'brunch', 'brunch', 13),
  ('type', 'Street-food', 'street-food', 'street-food', 14),
  ('technique', 'Snacker', 'snacker', null, 1),
  ('technique', 'Rôtir', 'rotir', null, 2),
  ('technique', 'Braiser', 'braiser', null, 3),
  ('technique', 'Pocher', 'pocher', null, 4),
  ('technique', 'Cuisson basse température', 'basse-temperature', null, 5),
  ('technique', 'Sauce émulsionnée', 'emulsion', null, 6),
  ('technique', 'Fond et jus', 'fond-jus', null, 7),
  ('technique', 'Confire', 'confire', null, 8),
  ('technique', 'Mariner', 'mariner', null, 9),
  ('technique', 'Pâte de base', 'pate-de-base', null, 10),
  ('technique', 'Taillage', 'taillage', null, 11),
  ('technique', 'Glacer', 'glacer', null, 12),
  ('cuisine', 'Traditionnelle', 'traditionnelle', null, 1),
  ('cuisine', 'Semi-gastronomique', 'semi-gastronomique', null, 2),
  ('cuisine', 'Gastronomique', 'gastronomique', null, 3),
  ('cuisine', 'Bistronomique', 'bistronomique', null, 4),
  ('cuisine', 'Du Sud-Ouest', 'sud-ouest', null, 5),
  ('cuisine', 'Méditerranéenne', 'mediterraneenne', null, 6),
  ('cuisine', 'Du monde', 'du-monde', null, 7);

-- -----------------------------------------------------------------------------
-- Richer recipes + engagement counters
-- -----------------------------------------------------------------------------
alter table public.recipes
  add column if not exists equipment text[] not null default '{}',
  add column if not exists chef_tips text,
  add column if not exists variations text,
  add column if not exists wine_pairing text,
  add column if not exists published_at timestamptz,
  add column if not exists views_count integer not null default 0,
  add column if not exists likes_count integer not null default 0,
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0;

update public.recipes set published_at = coalesce(published_at, created_at) where is_published;

create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_recipes_published_at before insert or update of is_published on public.recipes
  for each row execute function public.set_published_at();

create index if not exists idx_recipes_published_at on public.recipes (published_at desc) where is_published;
create index if not exists idx_recipes_popular on public.recipes (views_count desc) where is_published;

create table public.recipe_ratings (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  visitor_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, visitor_id)
);

create table public.recipe_daily_stats (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  likes integer not null default 0,
  primary key (recipe_id, day)
);
create index idx_recipe_daily_stats_day on public.recipe_daily_stats (day);

-- Engagement is written by the `engage` edge function (service role) only,
-- after rate limiting by IP; counters are denormalised for fast listing.
create or replace function public.record_engagement(
  p_recipe_id uuid,
  p_event text,
  p_visitor_id uuid,
  p_rating integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.recipes where id = p_recipe_id and is_published) then
    raise exception 'Recipe not found' using errcode = 'P0002';
  end if;
  perform set_config('app.engagement', 'on', true);

  case p_event
    when 'view' then
      update public.recipes set views_count = views_count + 1 where id = p_recipe_id;
      insert into public.recipe_daily_stats as s (recipe_id, views) values (p_recipe_id, 1)
        on conflict (recipe_id, day) do update set views = s.views + 1;
    when 'like' then
      update public.recipes set likes_count = likes_count + 1 where id = p_recipe_id;
      insert into public.recipe_daily_stats as s (recipe_id, likes) values (p_recipe_id, 1)
        on conflict (recipe_id, day) do update set likes = s.likes + 1;
    when 'unlike' then
      update public.recipes set likes_count = greatest(0, likes_count - 1) where id = p_recipe_id;
    when 'rate' then
      if p_rating is null or p_rating not between 1 and 5 then
        raise exception 'Invalid rating' using errcode = '22023';
      end if;
      insert into public.recipe_ratings as r (recipe_id, visitor_id, rating) values (p_recipe_id, p_visitor_id, p_rating)
        on conflict (recipe_id, visitor_id) do update set rating = excluded.rating, updated_at = now();
      update public.recipes r set (rating_avg, rating_count) = (
        select coalesce(round(avg(rating)::numeric, 2), 0), count(*)
        from public.recipe_ratings where recipe_id = p_recipe_id)
      where r.id = p_recipe_id;
    else
      raise exception 'Unknown event %', p_event using errcode = '22023';
  end case;

  perform set_config('app.engagement', '', true);

  return (select jsonb_build_object(
    'views', views_count, 'likes', likes_count, 'rating_avg', rating_avg, 'rating_count', rating_count)
    from public.recipes where id = p_recipe_id);
end;
$$;

revoke all on function public.record_engagement(uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.record_engagement(uuid, text, uuid, integer) to service_role;

-- Engagement writes set a transaction-local flag. Outside of it, counters are
-- read-only (even for admins), and engagement updates neither bump
-- updated_at nor flood the audit log.
create or replace function public.is_engagement_write()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('app.engagement', true), '') = 'on';
$$;

create or replace function public.protect_engagement_counters()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_engagement_write() then
    if tg_op = 'INSERT' then
      new.views_count := 0;
      new.likes_count := 0;
      new.rating_avg := 0;
      new.rating_count := 0;
    else
      new.views_count := old.views_count;
      new.likes_count := old.likes_count;
      new.rating_avg := old.rating_avg;
      new.rating_count := old.rating_count;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_recipes_protect_counters before insert or update on public.recipes
  for each row execute function public.protect_engagement_counters();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_engagement_write() then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  if public.is_engagement_write() then
    return null;
  end if;
  insert into public.activity_logs (action, entity_type, entity_id, details, actor_id)
  values (
    lower(tg_op),
    tg_table_name,
    (v_row ->> 'id')::uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'title', coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'author_name', v_row ->> 'role'),
      'amount', v_row -> 'amount',
      'status', v_row ->> 'status'
    )),
    auth.uid()
  );
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Search (accent-insensitive, title / description / ingredients / tags)
-- -----------------------------------------------------------------------------
create or replace function public.search_recipes(
  p_query text default null,
  p_season text default null,
  p_type text default null,
  p_sort text default 'recent',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  category text,
  season text,
  difficulty text,
  prep_time integer,
  cook_time integer,
  servings integer,
  image_url text,
  calories_per_serving numeric,
  nutri_score text,
  is_featured boolean,
  views_count integer,
  likes_count integer,
  rating_avg numeric,
  rating_count integer,
  published_at timestamptz,
  type_slugs text[],
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with filtered as (
    select r.*,
      array(select t.slug from public.recipe_terms rt join public.taxonomy_terms t on t.id = rt.term_id
            where rt.recipe_id = r.id and t.kind = 'type' order by t.position) as type_slugs
    from public.recipes r
    where r.is_published
      and (p_season is null or r.season = p_season or r.season = 'all')
      and (p_type is null or exists (
        select 1 from public.recipe_terms rt join public.taxonomy_terms t on t.id = rt.term_id
        where rt.recipe_id = r.id and t.kind = 'type' and t.slug = p_type))
      and (coalesce(trim(p_query), '') = '' or public.normalize_text(
            r.title || ' ' || coalesce(r.description, '') || ' ' ||
            coalesce((select string_agg(i.name, ' ') from public.recipe_ingredients i where i.recipe_id = r.id), '') || ' ' ||
            coalesce((select string_agg(t.name, ' ') from public.recipe_terms rt
                      join public.taxonomy_terms t on t.id = rt.term_id where rt.recipe_id = r.id), '')
          ) like '%' || public.normalize_text(trim(p_query)) || '%')
  )
  select f.id, f.slug, f.title, f.description, f.category, f.season, f.difficulty, f.prep_time, f.cook_time,
         f.servings, f.image_url, f.calories_per_serving, f.nutri_score, f.is_featured, f.views_count,
         f.likes_count, f.rating_avg, f.rating_count, f.published_at, f.type_slugs,
         count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'popular' then f.views_count end desc nulls last,
    case when p_sort = 'rated' then f.rating_avg end desc nulls last,
    case when p_sort = 'quick' then f.prep_time + f.cook_time end asc nulls last,
    f.published_at desc nulls last,
    f.created_at desc
  limit least(greatest(p_limit, 1), 48) offset greatest(p_offset, 0);
$$;

grant execute on function public.search_recipes(text, text, text, text, integer, integer) to anon, authenticated;

create or replace function public.related_recipes(p_recipe_id uuid, p_limit integer default 3)
returns setof public.recipes
language sql
stable
set search_path = ''
as $$
  select r.* from public.recipes r
  where r.is_published and r.id <> p_recipe_id
  order by
    (select count(*) from public.recipe_terms a join public.recipe_terms b on a.term_id = b.term_id
      where a.recipe_id = r.id and b.recipe_id = p_recipe_id) desc,
    (r.season = (select season from public.recipes where id = p_recipe_id)) desc,
    r.rating_avg desc,
    r.published_at desc nulls last
  limit least(greatest(p_limit, 1), 12);
$$;

grant execute on function public.related_recipes(uuid, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Editorial articles: culinary techniques and chef's advice
-- -----------------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('technique', 'conseil')),
  title text not null check (char_length(title) between 2 and 200),
  slug text not null unique,
  excerpt text not null default '',
  body text not null default '',
  image_url text,
  video_url text,
  difficulty text check (difficulty in ('facile', 'moyen', 'difficile')),
  reading_minutes integer not null default 3,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  position integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_articles_kind on public.articles (kind, position) where is_published;

create trigger trg_articles_updated_at before update on public.articles
  for each row execute function public.set_updated_at();
create trigger trg_articles_published_at before insert or update of is_published on public.articles
  for each row execute function public.set_published_at();

-- -----------------------------------------------------------------------------
-- Chef's career (About page)
-- -----------------------------------------------------------------------------
create table public.career_experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  establishment text not null,
  city text,
  start_year integer not null check (start_year between 1970 and 2100),
  end_year integer check (end_year is null or end_year >= start_year),
  summary text not null default '',
  missions text[] not null default '{}',
  skills text[] not null default '{}',
  techniques text[] not null default '{}',
  cuisine_types text[] not null default '{}',
  image_url text,
  image_prompt text,
  is_published boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_career_updated_at before update on public.career_experiences
  for each row execute function public.set_updated_at();

-- Chef identity shown on the About page.
alter table public.settings
  add column if not exists chef_name text not null default '',
  add column if not exists chef_title text not null default 'Chef de cuisine',
  add column if not exists chef_bio text not null default '',
  add column if not exists chef_portrait_url text,
  add column if not exists years_experience integer not null default 0,
  add column if not exists languages text[] not null default '{}',
  add column if not exists education text[] not null default '{}';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.taxonomy_terms enable row level security;
alter table public.recipe_terms enable row level security;
alter table public.seasons enable row level security;
alter table public.recipe_ratings enable row level security;
alter table public.recipe_daily_stats enable row level security;
alter table public.articles enable row level security;
alter table public.career_experiences enable row level security;

create policy taxonomy_terms_select on public.taxonomy_terms for select using (true);
create policy taxonomy_terms_admin_write on public.taxonomy_terms for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy recipe_terms_select on public.recipe_terms for select
  using (exists (select 1 from public.recipes r
                 where r.id = recipe_id and (r.is_published or (select public.is_admin()))));
create policy recipe_terms_admin_write on public.recipe_terms for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy seasons_select on public.seasons for select using (true);
create policy seasons_admin_write on public.seasons for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy recipe_ratings_admin_select on public.recipe_ratings for select to authenticated
  using ((select public.is_admin()));
create policy recipe_daily_stats_admin_select on public.recipe_daily_stats for select to authenticated
  using ((select public.is_admin()));

create policy articles_select on public.articles for select
  using (is_published or (select public.is_admin()));
create policy articles_admin_write on public.articles for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy career_select on public.career_experiences for select
  using (is_published or (select public.is_admin()));
create policy career_admin_write on public.career_experiences for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke insert, update, delete on public.taxonomy_terms, public.recipe_terms, public.seasons,
  public.recipe_ratings, public.recipe_daily_stats, public.articles, public.career_experiences from anon;
revoke insert, update, delete on public.recipe_ratings, public.recipe_daily_stats from authenticated;

-- Media library: admins may list the images bucket.
drop policy if exists ai_images_admin_select on storage.objects;
create policy ai_images_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'ai-images' and (select public.is_admin()));

-- Audit trail for the new editorial tables.
create trigger trg_articles_audit after insert or update or delete on public.articles
  for each row execute function public.log_activity();
create trigger trg_career_audit after insert or update or delete on public.career_experiences
  for each row execute function public.log_activity();

-- -----------------------------------------------------------------------------
-- save_recipe v2: also replaces taxonomy links (p_term_ids)
-- -----------------------------------------------------------------------------
create or replace function public.save_recipe(
  p_recipe jsonb, p_ingredients jsonb, p_steps jsonb, p_term_ids uuid[] default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := public._upsert_root('public.recipes', p_recipe);
begin
  perform public._replace_children('public.recipe_ingredients', 'recipe_id', v_id, p_ingredients);
  perform public._replace_children('public.recipe_steps', 'recipe_id', v_id, p_steps, 'step_number');
  if p_term_ids is not null then
    delete from public.recipe_terms where recipe_id = v_id;
    insert into public.recipe_terms (recipe_id, term_id)
      select v_id, t from unnest(p_term_ids) as t on conflict do nothing;
  end if;
  return v_id;
end;
$$;

drop function if exists public.save_recipe(jsonb, jsonb, jsonb);
revoke all on function public.save_recipe(jsonb, jsonb, jsonb, uuid[]) from public, anon;
grant execute on function public.save_recipe(jsonb, jsonb, jsonb, uuid[]) to authenticated;

-- save_menu calls save_recipe with three arguments: still valid (default).

-- -----------------------------------------------------------------------------
-- Admin statistics
-- -----------------------------------------------------------------------------
create or replace function public.blog_stats(p_days integer default 90)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_since date := current_date - greatest(p_days, 1);
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'totals', (select jsonb_build_object(
        'published', count(*) filter (where is_published),
        'drafts', count(*) filter (where not is_published),
        'views', coalesce(sum(views_count), 0),
        'likes', coalesce(sum(likes_count), 0),
        'ratings', coalesce(sum(rating_count), 0))
      from public.recipes),
    'topViewed', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select id, title, slug, views_count as value from public.recipes
        where is_published order by views_count desc limit 5) x),
    'topLiked', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select id, title, slug, likes_count as value from public.recipes
        where is_published order by likes_count desc limit 5) x),
    'topRated', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select id, title, slug, rating_avg as value, rating_count from public.recipes
        where is_published and rating_count > 0 order by rating_avg desc, rating_count desc limit 5) x),
    'daily', (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (
        select d.day::date as day, coalesce(sum(s.views), 0) as views, coalesce(sum(s.likes), 0) as likes
        from generate_series(v_since, current_date, interval '1 day') as d(day)
        left join public.recipe_daily_stats s on s.day = d.day::date
        group by d.day) x),
    'bySeason', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select coalesce(r.season, 'all') as season, count(distinct r.id) as recipes,
               coalesce(sum(s.views), 0) as views, coalesce(sum(s.likes), 0) as likes
        from public.recipes r
        left join public.recipe_daily_stats s on s.recipe_id = r.id and s.day >= v_since
        where r.is_published
        group by 1) x)
  );
end;
$$;

revoke all on function public.blog_stats(integer) from public, anon;
grant execute on function public.blog_stats(integer) to authenticated;
