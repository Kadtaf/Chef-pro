-- =============================================================================
-- Security hardening
--  * Role-based access: only profiles.role = 'admin' may write business data.
--  * Profiles are created server-side (trigger) and users cannot change roles.
--  * Public read access limited to published content (children included).
--  * Public form submissions go through the `public-submit` edge function
--    (service role) — anonymous INSERTs are no longer allowed.
--  * updated_at maintained by trigger, settings is a singleton.
--  * Storage bucket for generated images: public read, admin write.
--  * Rate limiting + AI usage tracking primitives.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'recipes', 'technical_sheets', 'menus', 'cards',
    'haccp_records', 'missions', 'comments', 'portfolio_items', 'services'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles: server-side creation, no self-promotion
-- -----------------------------------------------------------------------------
alter table public.profiles alter column role set default 'viewer';
alter table public.profiles alter column role set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users that never got a profile (least privilege).
insert into public.profiles (id, email, role)
select u.id, u.email, 'viewer'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
  and u.email is not null;

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- Settings: singleton row
-- -----------------------------------------------------------------------------
alter table public.settings add column if not exists singleton boolean not null default true;

do $$
begin
  if (select count(*) from public.settings) > 1 then
    raise exception 'settings contains more than one row: merge them manually before applying this migration';
  end if;
  if (select count(*) from public.settings) = 0 then
    insert into public.settings default values;
  end if;
end;
$$;

alter table public.settings drop constraint if exists settings_singleton_check;
alter table public.settings add constraint settings_singleton_check check (singleton);
create unique index if not exists settings_singleton_idx on public.settings (singleton);

-- -----------------------------------------------------------------------------
-- Drop every legacy policy
-- -----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- New policies
-- -----------------------------------------------------------------------------

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- settings
create policy settings_select_public on public.settings
  for select using (true);
create policy settings_admin_write on public.settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Publishable root entities: public read when published, admin full access.
do $$
declare
  t text;
begin
  foreach t in array array[
    'recipes', 'technical_sheets', 'menus', 'cards', 'portfolio_items', 'services'
  ]
  loop
    execute format(
      'create policy %1$s_select on public.%1$I for select
       using (is_published or (select public.is_admin()))', t);
    execute format(
      'create policy %1$s_admin_write on public.%1$I for all to authenticated
       using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Child entities: visible only if their parent is.
create policy recipe_ingredients_select on public.recipe_ingredients for select
  using (exists (select 1 from public.recipes r
                 where r.id = recipe_id and (r.is_published or (select public.is_admin()))));
create policy recipe_steps_select on public.recipe_steps for select
  using (exists (select 1 from public.recipes r
                 where r.id = recipe_id and (r.is_published or (select public.is_admin()))));
create policy technical_sheet_ingredients_select on public.technical_sheet_ingredients for select
  using (exists (select 1 from public.technical_sheets s
                 where s.id = technical_sheet_id and (s.is_published or (select public.is_admin()))));
create policy technical_sheet_steps_select on public.technical_sheet_steps for select
  using (exists (select 1 from public.technical_sheets s
                 where s.id = technical_sheet_id and (s.is_published or (select public.is_admin()))));
create policy menu_items_select on public.menu_items for select
  using (exists (select 1 from public.menus m
                 where m.id = menu_id and (m.is_published or (select public.is_admin()))));
create policy card_sections_select on public.card_sections for select
  using (exists (select 1 from public.cards c
                 where c.id = card_id and (c.is_published or (select public.is_admin()))));
create policy card_section_items_select on public.card_section_items for select
  using (exists (select 1 from public.card_sections cs
                 join public.cards c on c.id = cs.card_id
                 where cs.id = card_section_id and (c.is_published or (select public.is_admin()))));

do $$
declare
  t text;
begin
  foreach t in array array[
    'recipe_ingredients', 'recipe_steps', 'technical_sheet_ingredients',
    'technical_sheet_steps', 'menu_items', 'card_sections', 'card_section_items'
  ]
  loop
    execute format(
      'create policy %1$s_admin_write on public.%1$I for all to authenticated
       using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- comments: public read of approved reviews; writes by admin (public
-- submissions are inserted by the edge function with the service role).
create policy comments_select on public.comments for select
  using ((is_approved and is_public) or (select public.is_admin()));
create policy comments_admin_write on public.comments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Private back-office tables: admin only.
do $$
declare
  t text;
begin
  foreach t in array array[
    'haccp_records', 'missions', 'revenues', 'ai_generations',
    'activity_logs', 'notifications', 'contact_submissions'
  ]
  loop
    execute format(
      'create policy %1$s_admin_all on public.%1$I for all to authenticated
       using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Anonymous visitors never write directly.
revoke insert, update, delete on all tables in schema public from anon;

-- -----------------------------------------------------------------------------
-- Data integrity for publicly submitted content
-- -----------------------------------------------------------------------------
alter table public.contact_submissions
  add constraint contact_name_length check (char_length(name) between 1 and 120),
  add constraint contact_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  add constraint contact_phone_length check (phone is null or char_length(phone) <= 40),
  add constraint contact_subject_length check (subject is null or char_length(subject) <= 200),
  add constraint contact_message_length check (char_length(message) between 1 and 5000);

alter table public.comments
  add constraint comments_author_length check (char_length(author_name) between 1 and 120),
  add constraint comments_content_length check (char_length(content) between 1 and 3000);

-- -----------------------------------------------------------------------------
-- Rate limiting (fixed window), callable only by the service role.
-- -----------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning hits into v_hits;

  delete from public.rate_limits where window_start < now() - interval '2 days';

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- -----------------------------------------------------------------------------
-- AI usage tracking (quota enforced by the edge functions)
-- -----------------------------------------------------------------------------
alter table public.ai_generations
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid(),
  add column if not exists model text,
  add column if not exists usage jsonb,
  add column if not exists status text not null default 'success'
    check (status in ('success', 'error'));

create index if not exists idx_ai_generations_user_created
  on public.ai_generations (created_by, created_at desc);

-- -----------------------------------------------------------------------------
-- Storage: generated & uploaded images
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-images', 'ai-images', true, 10485760,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ai_images_admin_insert on storage.objects;
drop policy if exists ai_images_admin_update on storage.objects;
drop policy if exists ai_images_admin_delete on storage.objects;

create policy ai_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ai-images' and (select public.is_admin()));
create policy ai_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'ai-images' and (select public.is_admin()));
create policy ai_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'ai-images' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Missing foreign-key and lookup indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_recipe_ingredients_recipe on public.recipe_ingredients (recipe_id);
create index if not exists idx_recipe_steps_recipe on public.recipe_steps (recipe_id, step_number);
create index if not exists idx_ts_ingredients_sheet on public.technical_sheet_ingredients (technical_sheet_id);
create index if not exists idx_ts_steps_sheet on public.technical_sheet_steps (technical_sheet_id, step_number);
create index if not exists idx_menu_items_menu on public.menu_items (menu_id, position);
create index if not exists idx_menu_items_recipe on public.menu_items (recipe_id);
create index if not exists idx_menu_items_sheet on public.menu_items (technical_sheet_id);
create index if not exists idx_card_sections_card on public.card_sections (card_id, position);
create index if not exists idx_card_items_section on public.card_section_items (card_section_id, position);
create index if not exists idx_card_items_recipe on public.card_section_items (recipe_id);
create index if not exists idx_card_items_sheet on public.card_section_items (technical_sheet_id);
create index if not exists idx_revenues_mission on public.revenues (mission_id);
create index if not exists idx_comments_recipe on public.comments (recipe_id);
create index if not exists idx_comments_mission on public.comments (mission_id);
create index if not exists idx_recipes_published_created
  on public.recipes (created_at desc) where is_published;
create index if not exists idx_contact_unread on public.contact_submissions (created_at desc) where not is_read;
