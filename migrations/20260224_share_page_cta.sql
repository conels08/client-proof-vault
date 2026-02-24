-- Share Page CTA (conversion mode)
-- Adds CTA configuration fields to proof_pages
-- Adds proof_page_events table for CTA click analytics

alter table public.proof_pages
  add column if not exists cta_enabled boolean not null default false,
  add column if not exists cta_label text,
  add column if not exists cta_url text;

create table if not exists public.proof_page_events (
  id uuid primary key default gen_random_uuid(),
  proof_page_id uuid not null references public.proof_pages(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default now(),
  constraint proof_page_events_event_type_check
    check (event_type in ('cta_click'))
);

create index if not exists proof_page_events_proof_page_id_idx
  on public.proof_page_events (proof_page_id);

create index if not exists proof_page_events_page_type_created_idx
  on public.proof_page_events (proof_page_id, event_type, created_at desc);

alter table public.proof_page_events enable row level security;

-- Public/anon can log CTA clicks only for published pages
drop policy if exists proof_page_events_insert_cta_click_public_published on public.proof_page_events;
create policy proof_page_events_insert_cta_click_public_published
  on public.proof_page_events
  for insert
  to anon, authenticated
  with check (
    event_type = 'cta_click'
    and exists (
      select 1
      from public.proof_pages p
      where p.id = proof_page_events.proof_page_id
        and p.status = 'published'
    )
  );

-- Owners can read their own analytics events
drop policy if exists proof_page_events_select_owner on public.proof_page_events;
create policy proof_page_events_select_owner
  on public.proof_page_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_page_events.proof_page_id
        and p.user_id = auth.uid()
    )
  );
