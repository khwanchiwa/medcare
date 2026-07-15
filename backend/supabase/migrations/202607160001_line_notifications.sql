-- LINE Login uses the existing integration tables. The LINE Login and
-- Messaging API channels must belong to the same LINE provider.
alter table if exists public.user_integrations
  drop constraint if exists user_integrations_provider_check;
alter table if exists public.user_integrations
  add constraint user_integrations_provider_check
  check (provider in ('google_calendar', 'line'));

alter table if exists public.integration_link_codes
  drop constraint if exists integration_link_codes_provider_check;
alter table if exists public.integration_link_codes
  add constraint integration_link_codes_provider_check
  check (provider in ('google_calendar', 'line'));
alter table if exists public.integration_link_codes
  add column if not exists nonce text;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  medication_lead_minutes integer not null default 0
    check (medication_lead_minutes between 0 and 1440),
  appointment_lead_minutes integer[] not null default array[1440, 120]
    check (cardinality(appointment_lead_minutes) between 1 and 10),
  line_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('medication', 'appointment')),
  reference_id uuid not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null check (status in ('processing', 'sent', 'failed', 'skipped')),
  error_message text,
  dedup_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_delivery_due_idx
  on public.notification_delivery_logs(user_id, scheduled_at desc);
create index if not exists notification_delivery_reference_idx
  on public.notification_delivery_logs(notification_type, reference_id);

alter table public.notification_preferences enable row level security;
alter table public.notification_delivery_logs enable row level security;

create policy "users view own notification preferences" on public.notification_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users update own notification preferences" on public.notification_preferences
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "users view own delivery history" on public.notification_delivery_logs
for select to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.notification_preferences,
  public.notification_delivery_logs to service_role;
grant select on public.notification_preferences,
  public.notification_delivery_logs to authenticated;

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();
drop trigger if exists notification_delivery_logs_set_updated_at on public.notification_delivery_logs;
create trigger notification_delivery_logs_set_updated_at before update on public.notification_delivery_logs
for each row execute function public.set_updated_at();
