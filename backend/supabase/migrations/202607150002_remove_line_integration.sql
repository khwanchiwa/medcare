-- Remove all LINE integration data and scheduler tables while keeping Google Calendar OAuth.
drop table if exists public.medication_notification_logs cascade;
drop table if exists public.notification_jobs cascade;

delete from public.integration_link_codes where provider = 'line';
delete from public.user_integrations where provider = 'line';

alter table if exists public.user_integrations
  drop constraint if exists user_integrations_provider_check;
alter table if exists public.user_integrations
  add constraint user_integrations_provider_check check (provider = 'google_calendar');

alter table if exists public.integration_link_codes
  drop constraint if exists integration_link_codes_provider_check;
alter table if exists public.integration_link_codes
  add constraint integration_link_codes_provider_check check (provider = 'google_calendar');
