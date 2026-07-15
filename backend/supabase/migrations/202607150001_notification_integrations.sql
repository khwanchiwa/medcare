alter table if exists public.medications
  add column if not exists quantity text not null default '1 เม็ด';

create table if not exists public.user_integrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider = 'google_calendar'),
  external_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create table if not exists public.integration_link_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider = 'google_calendar'),
  code text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_event_links (
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id text not null,
  google_event_id text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, appointment_id)
);

create index if not exists integration_link_codes_lookup_idx
  on public.integration_link_codes(provider, code, expires_at);

alter table public.user_integrations enable row level security;
alter table public.integration_link_codes enable row level security;
alter table public.calendar_event_links enable row level security;

create policy "users view own integrations" on public.user_integrations
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users view own link codes" on public.integration_link_codes
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users view own calendar links" on public.calendar_event_links
for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.user_integrations, public.integration_link_codes, public.calendar_event_links to authenticated;
grant select, insert, update, delete on public.user_integrations, public.integration_link_codes, public.calendar_event_links to service_role;
