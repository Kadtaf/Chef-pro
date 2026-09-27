-- =============================================================================
-- Nutrition model v2
-- The official Nutri-Score (2023 algorithm) needs sugars, saturated fat,
-- portion weight and the fruit/vegetable/legume share. Ingredient values are
-- stored for the quantity used; per-serving values are derived by the app.
-- Also tightens nullability: every column with a default becomes NOT NULL.
-- =============================================================================

alter table public.recipes
  add column if not exists sucres numeric(10,2) not null default 0,
  add column if not exists acides_gras_satures numeric(10,2) not null default 0,
  add column if not exists portion_weight_g numeric(10,2),
  add column if not exists fruits_legumes_pct numeric(5,2) not null default 0
    check (fruits_legumes_pct between 0 and 100),
  add column if not exists plating text;

alter table public.recipe_ingredients
  add column if not exists sucres numeric(10,2) not null default 0,
  add column if not exists acides_gras_satures numeric(10,2) not null default 0;

alter table public.technical_sheets
  add column if not exists sucres numeric(10,2) not null default 0,
  add column if not exists acides_gras_satures numeric(10,2) not null default 0,
  add column if not exists portion_weight_g numeric(10,2),
  add column if not exists fruits_legumes_pct numeric(5,2) not null default 0
    check (fruits_legumes_pct between 0 and 100);

alter table public.technical_sheet_ingredients
  add column if not exists fibres numeric(10,2) not null default 0,
  add column if not exists sel numeric(10,2) not null default 0,
  add column if not exists sucres numeric(10,2) not null default 0,
  add column if not exists acides_gras_satures numeric(10,2) not null default 0;

alter table public.cards
  add column if not exists season text not null default 'all'
    check (season in ('printemps', 'ete', 'automne', 'hiver', 'all'));

alter table public.menus
  add constraint menus_avg_nutri_score_check
    check (avg_nutri_score is null or avg_nutri_score in ('A', 'B', 'C', 'D', 'E'));

-- Every column that has a default and is nullable becomes NOT NULL
-- (existing NULLs are replaced by the default first).
do $$
declare
  c record;
begin
  for c in
    select table_name, column_name, column_default
    from information_schema.columns
    where table_schema = 'public'
      and is_nullable = 'YES'
      and column_default is not null
      and data_type in ('text', 'numeric', 'integer', 'boolean', 'timestamp with time zone', 'ARRAY', 'jsonb', 'date')
      and table_name <> 'rate_limits'
  loop
    execute format('update public.%I set %I = %s where %I is null',
                   c.table_name, c.column_name, c.column_default, c.column_name);
    execute format('alter table public.%I alter column %I set not null', c.table_name, c.column_name);
  end loop;
end;
$$;

-- Child rows must always belong to a parent.
alter table public.recipe_ingredients alter column recipe_id set not null;
alter table public.recipe_steps alter column recipe_id set not null;
alter table public.technical_sheet_ingredients alter column technical_sheet_id set not null;
alter table public.technical_sheet_steps alter column technical_sheet_id set not null;
alter table public.menu_items alter column menu_id set not null;
alter table public.card_sections alter column card_id set not null;
alter table public.card_section_items alter column card_section_id set not null;

-- Status columns always have a value.
update public.haccp_records set status = 'pending' where status is null;
alter table public.haccp_records alter column status set default 'pending', alter column status set not null;
update public.missions set status = 'en_attente' where status is null;
alter table public.missions alter column status set default 'en_attente', alter column status set not null;
