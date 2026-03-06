-- Waitlist signups for Pro launch notifications.
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamptz not null default now(),
  constraint waitlist_signups_email_unique unique (email),
  constraint waitlist_signups_email_check
    check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

drop policy if exists waitlist_signups_insert_public on public.waitlist_signups;
create policy waitlist_signups_insert_public
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  );

-- No select/update/delete policies are defined, so submitted emails are not readable publicly.
