-- Add profile avatar support to proof pages.
alter table public.proof_pages
  add column if not exists avatar_url text;

alter table public.proof_pages
  add column if not exists avatar_updated_at timestamptz not null default now();
