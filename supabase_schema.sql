-- Client Proof Vault
-- Supabase/PostgreSQL schema + RLS
-- Ordered for safe top-to-bottom execution

-- =====================================================
-- 1) Extensions
-- =====================================================
create extension if not exists pgcrypto;

-- =====================================================
-- 2) Enum types
-- =====================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'proof_page_status') then
    create type public.proof_page_status as enum ('draft', 'published');
  end if;

  if not exists (select 1 from pg_type where typname = 'proof_page_theme') then
    create type public.proof_page_theme as enum ('light', 'dark');
  end if;

  if not exists (select 1 from pg_type where typname = 'proof_section_type') then
    create type public.proof_section_type as enum ('testimonial', 'work_example', 'metric');
  end if;
end $$;

-- =====================================================
-- 3) Tables
-- =====================================================
create table if not exists public.proof_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  headline text not null,
  bio text,
  slug text not null unique,
  status public.proof_page_status not null,
  theme public.proof_page_theme not null,
  accent_color text not null default '#3B82F6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proof_pages_user_id_unique unique (user_id),
  constraint proof_pages_accent_color_hex_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.proof_sections (
  id uuid primary key default gen_random_uuid(),
  proof_page_id uuid not null references public.proof_pages(id) on delete cascade,
  type public.proof_section_type not null,
  position integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  proof_section_id uuid not null references public.proof_sections(id),
  name text not null,
  role_company text,
  quote text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.work_examples (
  id uuid primary key default gen_random_uuid(),
  proof_section_id uuid not null references public.proof_sections(id),
  image_url text,
  link_url text,
  description text not null,
  metric_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  proof_section_id uuid not null references public.proof_sections(id),
  label text not null,
  value text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  proof_page_id uuid not null references public.proof_pages(id),
  viewed_at timestamptz not null default now()
);

-- =====================================================
-- 4) Indexes
-- =====================================================
-- Public page lookup indexes
create index if not exists proof_pages_status_idx on public.proof_pages(status);

-- Join/ownership lookup indexes
create index if not exists proof_sections_proof_page_id_idx on public.proof_sections(proof_page_id);
create index if not exists proof_sections_position_idx on public.proof_sections(proof_page_id, position);
create index if not exists testimonials_proof_section_id_idx on public.testimonials(proof_section_id);
create index if not exists work_examples_proof_section_id_idx on public.work_examples(proof_section_id);
create index if not exists metrics_proof_section_id_idx on public.metrics(proof_section_id);
create index if not exists page_views_proof_page_id_idx on public.page_views(proof_page_id);

-- =====================================================
-- 5) RLS Enablement
-- =====================================================
alter table public.proof_pages enable row level security;
alter table public.proof_sections enable row level security;
alter table public.testimonials enable row level security;
alter table public.work_examples enable row level security;
alter table public.metrics enable row level security;
alter table public.page_views enable row level security;

-- =====================================================
-- 6) RLS Policies: proof_pages
-- =====================================================
drop policy if exists proof_pages_select_public_published on public.proof_pages;
create policy proof_pages_select_public_published
  on public.proof_pages
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists proof_pages_select_owner on public.proof_pages;
create policy proof_pages_select_owner
  on public.proof_pages
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists proof_pages_insert_owner on public.proof_pages;
create policy proof_pages_insert_owner
  on public.proof_pages
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists proof_pages_update_owner on public.proof_pages;
create policy proof_pages_update_owner
  on public.proof_pages
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists proof_pages_delete_owner on public.proof_pages;
create policy proof_pages_delete_owner
  on public.proof_pages
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =====================================================
-- 7) RLS Policies: proof_sections
-- =====================================================
drop policy if exists proof_sections_select_public_published on public.proof_sections;
create policy proof_sections_select_public_published
  on public.proof_sections
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.status = 'published'
    )
  );

drop policy if exists proof_sections_select_owner on public.proof_sections;
create policy proof_sections_select_owner
  on public.proof_sections
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists proof_sections_insert_owner on public.proof_sections;
create policy proof_sections_insert_owner
  on public.proof_sections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists proof_sections_update_owner on public.proof_sections;
create policy proof_sections_update_owner
  on public.proof_sections
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists proof_sections_delete_owner on public.proof_sections;
create policy proof_sections_delete_owner
  on public.proof_sections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = proof_sections.proof_page_id
        and p.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8) RLS Policies: testimonials
-- =====================================================
drop policy if exists testimonials_select_public_published on public.testimonials;
create policy testimonials_select_public_published
  on public.testimonials
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.status = 'published'
    )
  );

drop policy if exists testimonials_select_owner on public.testimonials;
create policy testimonials_select_owner
  on public.testimonials
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists testimonials_insert_owner on public.testimonials;
create policy testimonials_insert_owner
  on public.testimonials
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists testimonials_update_owner on public.testimonials;
create policy testimonials_update_owner
  on public.testimonials
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists testimonials_delete_owner on public.testimonials;
create policy testimonials_delete_owner
  on public.testimonials
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = testimonials.proof_section_id
        and p.user_id = auth.uid()
    )
  );

-- =====================================================
-- 9) RLS Policies: work_examples
-- =====================================================
drop policy if exists work_examples_select_public_published on public.work_examples;
create policy work_examples_select_public_published
  on public.work_examples
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.status = 'published'
    )
  );

drop policy if exists work_examples_select_owner on public.work_examples;
create policy work_examples_select_owner
  on public.work_examples
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists work_examples_insert_owner on public.work_examples;
create policy work_examples_insert_owner
  on public.work_examples
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists work_examples_update_owner on public.work_examples;
create policy work_examples_update_owner
  on public.work_examples
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists work_examples_delete_owner on public.work_examples;
create policy work_examples_delete_owner
  on public.work_examples
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = work_examples.proof_section_id
        and p.user_id = auth.uid()
    )
  );

-- =====================================================
-- 10) RLS Policies: metrics
-- =====================================================
drop policy if exists metrics_select_public_published on public.metrics;
create policy metrics_select_public_published
  on public.metrics
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.status = 'published'
    )
  );

drop policy if exists metrics_select_owner on public.metrics;
create policy metrics_select_owner
  on public.metrics
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists metrics_insert_owner on public.metrics;
create policy metrics_insert_owner
  on public.metrics
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists metrics_update_owner on public.metrics;
create policy metrics_update_owner
  on public.metrics
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists metrics_delete_owner on public.metrics;
create policy metrics_delete_owner
  on public.metrics
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proof_sections s
      join public.proof_pages p on p.id = s.proof_page_id
      where s.id = metrics.proof_section_id
        and p.user_id = auth.uid()
    )
  );

-- =====================================================
-- 11) RLS Policies: page_views
-- =====================================================
drop policy if exists page_views_select_owner on public.page_views;
create policy page_views_select_owner
  on public.page_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proof_pages p
      where p.id = page_views.proof_page_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists page_views_insert_public on public.page_views;
create policy page_views_insert_public
  on public.page_views
  for insert
  to anon, authenticated
  with check (true);

-- =====================================================
-- 12) Supabase Storage: proof-media
-- =====================================================
insert into storage.buckets (id, name, public)
values ('proof-media', 'proof-media', false)
on conflict (id) do nothing;

-- Path convention enforced by policy:
--   {user_id}/{proof_page_id}/{filename}

-- Owners can read their own files
drop policy if exists proof_media_select_owner on storage.objects;
create policy proof_media_select_owner
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'proof-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Public can read files only when linked proof page is published
drop policy if exists proof_media_select_public_published on storage.objects;
create policy proof_media_select_public_published
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'proof-media'
    and exists (
      select 1
      from public.proof_pages p
      where p.user_id::text = split_part(storage.objects.name, '/', 1)
        and p.id::text = split_part(storage.objects.name, '/', 2)
        and p.status = 'published'
    )
  );

-- Owners can upload only under their own user_id prefix
drop policy if exists proof_media_insert_owner on storage.objects;
create policy proof_media_insert_owner
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'proof-media'
    and split_part(name, '/', 1) = auth.uid()::text
    and exists (
      select 1
      from public.proof_pages p
      where p.user_id = auth.uid()
        and p.id::text = split_part(name, '/', 2)
    )
  );

-- Owners can update only their own files
drop policy if exists proof_media_update_owner on storage.objects;
create policy proof_media_update_owner
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'proof-media'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'proof-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Owners can delete only their own files
drop policy if exists proof_media_delete_owner on storage.objects;
create policy proof_media_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'proof-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );
