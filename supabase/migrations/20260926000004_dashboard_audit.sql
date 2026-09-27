-- =============================================================================
-- Dashboard aggregates computed in the database + automatic audit trail.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Audit trail
-- -----------------------------------------------------------------------------
alter table public.activity_logs
  add column if not exists actor_id uuid references auth.users (id) on delete set null;

create index if not exists idx_activity_logs_created on public.activity_logs (created_at desc);

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.activity_logs (action, entity_type, entity_id, details, actor_id)
  values (
    lower(tg_op),
    tg_table_name,
    (v_row ->> 'id')::uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'title', coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'author_name'),
      'amount', v_row -> 'amount',
      'status', v_row ->> 'status'
    )),
    auth.uid()
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'recipes', 'technical_sheets', 'menus', 'cards', 'haccp_records',
    'missions', 'revenues', 'comments', 'portfolio_items', 'services', 'contact_submissions'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_audit on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_audit after insert or update or delete on public.%1$I
       for each row execute function public.log_activity()', t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Dashboard statistics
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_month_start date := date_trunc('month', current_date)::date;
begin
  if not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'recipes', (select count(*) from public.recipes),
    'technicalSheets', (select count(*) from public.technical_sheets),
    'menus', (select count(*) from public.menus),
    'cards', (select count(*) from public.cards),
    'missions', (
      select jsonb_build_object(
        'total', count(*),
        'inProgress', count(*) filter (where status = 'en_cours'),
        'pending', count(*) filter (where status = 'en_attente'))
      from public.missions),
    'revenues', (
      select jsonb_build_object(
        'total', coalesce(sum(amount), 0),
        'thisMonth', coalesce(sum(amount) filter (where date_received >= v_month_start), 0))
      from public.revenues),
    'comments', (
      select jsonb_build_object('total', count(*), 'pending', count(*) filter (where not is_approved))
      from public.comments),
    'contactSubmissions', (
      select jsonb_build_object('total', count(*), 'unread', count(*) filter (where not is_read))
      from public.contact_submissions),
    'haccp', (
      select jsonb_build_object(
        'pending', count(*) filter (where status = 'pending'),
        'failed', count(*) filter (where status = 'failed'))
      from public.haccp_records),
    'monthly', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'month', to_char(m.month, 'YYYY-MM'),
        'revenues', coalesce(r.total, 0),
        'missions', coalesce(mi.total, 0)) order by m.month), '[]'::jsonb)
      from generate_series(v_month_start - interval '11 months', v_month_start, interval '1 month') as m(month)
      left join (
        select date_trunc('month', date_received) as month, sum(amount) as total
        from public.revenues group by 1) r on r.month = m.month
      left join (
        select date_trunc('month', coalesce(start_date, created_at::date)) as month, count(*) as total
        from public.missions group by 1) mi on mi.month = m.month)
  );
end;
$$;

revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
