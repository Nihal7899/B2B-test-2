alter table public.trusted_brands
  add column if not exists card_config jsonb not null default '{}'::jsonb;

