-- =============================================================================
-- Transactional save RPCs
-- Each entity is saved (parent + children) in a single transaction, so a
-- network failure can never leave a recipe without its ingredients.
-- Functions are SECURITY INVOKER: RLS still applies on every statement.
-- =============================================================================

alter table public.haccp_records alter column type set default 'checklist';
update public.haccp_records set type = 'checklist' where type is null;
alter table public.haccp_records alter column type set not null;

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------

-- Columns of a public table that a JSON payload may write.
create or replace function public._writable_columns(p_table regclass, p_data jsonb)
returns text[]
language sql
stable
set search_path = ''
as $$
  select coalesce(array_agg(a.attname::text order by a.attnum), '{}')
  from pg_catalog.pg_attribute a
  where a.attrelid = p_table
    and a.attnum > 0
    and not a.attisdropped
    and a.attname not in ('id', 'created_at', 'updated_at')
    and p_data ? a.attname;
$$;

-- Inserts one row built from JSON: absent keys fall back to column defaults.
create or replace function public._insert_from_json(p_table regclass, p_data jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_cols text[] := public._writable_columns(p_table, p_data);
  v_id uuid;
begin
  execute format(
    'insert into %s (%s) select %s from jsonb_populate_record(null::%s, $1) r returning id',
    p_table,
    (select string_agg(quote_ident(c), ', ') from unnest(v_cols) c),
    (select string_agg('r.' || quote_ident(c), ', ') from unnest(v_cols) c),
    p_table
  ) using p_data into v_id;
  return v_id;
end;
$$;

-- Updates the columns present in the JSON payload.
create or replace function public._update_from_json(p_table regclass, p_id uuid, p_data jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_cols text[] := public._writable_columns(p_table, p_data);
  v_found boolean;
begin
  if cardinality(v_cols) = 0 then
    return;
  end if;
  execute format(
    'update %s t set (%s) = (select %s from jsonb_populate_record(t, $1) r) where t.id = $2 returning true',
    p_table,
    (select string_agg(quote_ident(c), ', ') from unnest(v_cols) c),
    (select string_agg('r.' || quote_ident(c), ', ') from unnest(v_cols) c)
  ) using p_data, p_id into v_found;
  if v_found is null then
    raise exception 'Entity % not found in %', p_id, p_table using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.slugify(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(replace(replace(lower(p_value), 'œ', 'oe'), 'æ', 'ae'),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ',
      'aaaaaaceeeeiiiinooooouuuuyy')),
    '[^a-z0-9]+', '-', 'g'));
$$;

-- Returns p_slug, suffixed (-2, -3…) when another row already uses it.
create or replace function public.unique_slug(p_table regclass, p_slug text, p_id uuid)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_base text := coalesce(nullif(public.slugify(p_slug), ''), 'item');
  v_candidate text := v_base;
  v_n integer := 1;
  v_taken boolean;
begin
  loop
    execute format('select exists (select 1 from %s where slug = $1 and id is distinct from $2)', p_table)
      using v_candidate, p_id into v_taken;
    exit when not v_taken;
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n;
  end loop;
  return v_candidate;
end;
$$;

-- Creates or updates a slugged root entity and returns its id.
create or replace function public._upsert_root(p_table regclass, p_data jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := nullif(p_data ->> 'id', '')::uuid;
  v_data jsonb;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  v_data := p_data || jsonb_build_object(
    'slug', public.unique_slug(p_table, coalesce(nullif(p_data ->> 'slug', ''), p_data ->> 'title'), v_id));

  if v_id is null then
    return public._insert_from_json(p_table, v_data);
  end if;
  perform public._update_from_json(p_table, v_id, v_data);
  return v_id;
end;
$$;

-- Replaces all children of a parent with the given JSON array.
create or replace function public._replace_children(
  p_table regclass, p_fk text, p_parent uuid, p_rows jsonb, p_position_col text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_row jsonb;
  v_index integer := 0;
begin
  execute format('delete from %s where %I = $1', p_table, p_fk) using p_parent;
  for v_row in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    v_index := v_index + 1;
    v_row := (v_row - 'id') || jsonb_build_object(p_fk, p_parent);
    if p_position_col is not null then
      v_row := v_row || jsonb_build_object(p_position_col, v_index);
    end if;
    perform public._insert_from_json(p_table, v_row);
  end loop;
end;
$$;

revoke all on function public._writable_columns(regclass, jsonb) from public, anon;
revoke all on function public._insert_from_json(regclass, jsonb) from public, anon;
revoke all on function public._update_from_json(regclass, uuid, jsonb) from public, anon;
revoke all on function public._upsert_root(regclass, jsonb) from public, anon;
revoke all on function public._replace_children(regclass, text, uuid, jsonb, text) from public, anon;

-- -----------------------------------------------------------------------------
-- Public RPCs
-- -----------------------------------------------------------------------------

create or replace function public.save_recipe(p_recipe jsonb, p_ingredients jsonb, p_steps jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := public._upsert_root('public.recipes', p_recipe);
begin
  perform public._replace_children('public.recipe_ingredients', 'recipe_id', v_id, p_ingredients);
  perform public._replace_children('public.recipe_steps', 'recipe_id', v_id, p_steps, 'step_number');
  return v_id;
end;
$$;

create or replace function public.save_technical_sheet(p_sheet jsonb, p_ingredients jsonb, p_steps jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := public._upsert_root('public.technical_sheets', p_sheet);
begin
  perform public._replace_children('public.technical_sheet_ingredients', 'technical_sheet_id', v_id, p_ingredients);
  perform public._replace_children('public.technical_sheet_steps', 'technical_sheet_id', v_id, p_steps, 'step_number');
  return v_id;
end;
$$;

-- p_items: [{ item_type, custom_title, custom_description, recipe_id?, technical_sheet_id?,
--             recipe?: { recipe, ingredients, steps } }]  (inline recipes are created first)
create or replace function public.save_menu(p_menu jsonb, p_items jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := public._upsert_root('public.menus', p_menu);
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
begin
  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    if v_item ? 'recipe' and jsonb_typeof(v_item -> 'recipe') = 'object' then
      v_item := v_item || jsonb_build_object('recipe_id', public.save_recipe(
        v_item -> 'recipe' -> 'recipe', v_item -> 'recipe' -> 'ingredients', v_item -> 'recipe' -> 'steps'));
    end if;
    v_items := v_items || jsonb_build_array(v_item - 'recipe');
  end loop;

  perform public._replace_children('public.menu_items', 'menu_id', v_id, v_items, 'position');
  return v_id;
end;
$$;

-- p_sections: [{ title, description, items: [{ custom_title, custom_description, price, is_suggestion, recipe_id?, technical_sheet_id? }] }]
create or replace function public.save_card(p_card jsonb, p_sections jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := public._upsert_root('public.cards', p_card);
  v_section jsonb;
  v_section_id uuid;
  v_position integer := 0;
begin
  delete from public.card_sections where card_id = v_id; -- items cascade
  for v_section in select value from jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  loop
    v_position := v_position + 1;
    v_section_id := public._insert_from_json('public.card_sections',
      (v_section - 'id' - 'items') || jsonb_build_object('card_id', v_id, 'position', v_position));
    perform public._replace_children('public.card_section_items', 'card_section_id', v_section_id,
      v_section -> 'items', 'position');
  end loop;
  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.save_technical_sheet(jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.save_menu(jsonb, jsonb) from public, anon;
revoke all on function public.save_card(jsonb, jsonb) from public, anon;
grant execute on function public.save_recipe(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.save_technical_sheet(jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.save_menu(jsonb, jsonb) to authenticated;
grant execute on function public.save_card(jsonb, jsonb) to authenticated;
