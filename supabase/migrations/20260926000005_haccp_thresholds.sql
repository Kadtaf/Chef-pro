-- =============================================================================
-- HACCP: regulatory temperature thresholds per record, so compliance of a
-- reading can be evaluated automatically (e.g. positive cold <= 4 °C,
-- frozen <= -18 °C, hot holding >= 63 °C).
-- =============================================================================

alter table public.haccp_records
  add column if not exists temperature_min numeric(5,2),
  add column if not exists temperature_max numeric(5,2),
  add constraint haccp_temperature_range_check
    check (temperature_min is null or temperature_max is null or temperature_min <= temperature_max);

-- checklist_items must always be a JSON array.
update public.haccp_records set checklist_items = '[]'::jsonb where jsonb_typeof(checklist_items) <> 'array';
alter table public.haccp_records
  add constraint haccp_checklist_is_array check (jsonb_typeof(checklist_items) = 'array');

create index if not exists idx_haccp_created on public.haccp_records (created_at desc);
