alter table if exists public.calendar_event_links
  add column if not exists google_calendar_id text not null default 'primary',
  add column if not exists payload_hash text,
  add column if not exists sync_status text not null default 'pending',
  add column if not exists sync_error text,
  add column if not exists last_synced_at timestamptz;

alter table if exists public.user_integrations
  add column if not exists external_email text,
  add column if not exists calendar_id text not null default 'primary',
  add column if not exists connection_status text not null default 'connected'
    check (connection_status in ('connected', 'reconnect_required')),
  add column if not exists last_sync_at timestamptz;

create unique index if not exists calendar_event_links_google_event_unique
  on public.calendar_event_links(user_id, google_event_id);

create index if not exists calendar_event_links_sync_status_idx
  on public.calendar_event_links(user_id, sync_status);

-- OAuth tokens are backend-only. Authenticated clients must use the FastAPI routes.
drop policy if exists "users view own integrations" on public.user_integrations;
revoke select on public.user_integrations from authenticated;
revoke select on public.integration_link_codes from authenticated;

drop trigger if exists user_integrations_set_updated_at on public.user_integrations;
create trigger user_integrations_set_updated_at before update on public.user_integrations
for each row execute function public.set_updated_at();

drop trigger if exists calendar_event_links_set_updated_at on public.calendar_event_links;
create trigger calendar_event_links_set_updated_at before update on public.calendar_event_links
for each row execute function public.set_updated_at();
