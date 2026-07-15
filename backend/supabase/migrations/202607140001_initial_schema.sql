create extension if not exists pgcrypto;

create type public.user_role as enum ('PATIENT', 'CAREGIVER', 'ADMIN');
create type public.relationship_status as enum ('pending', 'approved', 'declined', 'revoked');
create type public.medication_log_status as enum ('pending', 'taken', 'missed');
create type public.appointment_status as enum ('upcoming', 'completed', 'cancelled');
create type public.notification_channel as enum ('in_app', 'line', 'google_calendar');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.user_role not null default 'PATIENT',
  phone text,
  date_of_birth date,
  medical_conditions text,
  timezone text not null default 'Asia/Bangkok',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 150),
  dosage text not null,
  frequency text not null,
  reminder_times text[] not null default '{}',
  instructions text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  taken_at timestamptz,
  status public.medication_log_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  hospital text not null,
  department text,
  doctor text,
  appointment_date date not null,
  appointment_time time not null,
  notes text,
  status public.appointment_status not null default 'upcoming',
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.caregiver_relationships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  relationship_label text,
  status public.relationship_status not null default 'pending',
  can_edit_medication boolean not null default false,
  can_edit_appointment boolean not null default false,
  can_view_history boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_caregiver_are_different check (patient_id <> caregiver_id)
);

create unique index one_open_relationship_per_pair
  on public.caregiver_relationships(patient_id, caregiver_id)
  where status in ('pending', 'approved');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  channel public.notification_channel not null default 'in_app',
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medications_patient_id_idx on public.medications(patient_id);
create index medication_logs_patient_scheduled_idx on public.medication_logs(patient_id, scheduled_at desc);
create index appointments_patient_date_idx on public.appointments(patient_id, appointment_date);
create index caregiver_relationships_patient_idx on public.caregiver_relationships(patient_id, status);
create index caregiver_relationships_caregiver_idx on public.caregiver_relationships(caregiver_id, status);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger medications_set_updated_at before update on public.medications
for each row execute function public.set_updated_at();
create trigger medication_logs_set_updated_at before update on public.medication_logs
for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();
create trigger relationships_set_updated_at before update on public.caregiver_relationships
for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  safe_role public.user_role;
begin
  safe_role := case
    when new.raw_user_meta_data ->> 'role' = 'CAREGIVER' then 'CAREGIVER'::public.user_role
    else 'PATIENT'::public.user_role
  end;
  insert into public.profiles (id, email, name, role, phone, timezone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    safe_role,
    new.raw_user_meta_data ->> 'phone',
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Asia/Bangkok')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.has_patient_access(target_patient_id uuid, requested_permission text default 'view')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = target_patient_id
    or exists (
      select 1
      from public.caregiver_relationships relationship
      where relationship.patient_id = target_patient_id
        and relationship.caregiver_id = (select auth.uid())
        and relationship.status = 'approved'
        and case requested_permission
          when 'medication' then relationship.can_edit_medication
          when 'appointment' then relationship.can_edit_appointment
          when 'history' then relationship.can_view_history
          else true
        end
    );
$$;

create or replace function private.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) = target_profile_id
    or exists (
      select 1 from public.caregiver_relationships relationship
      where (relationship.patient_id = target_profile_id and relationship.caregiver_id = (select auth.uid()))
         or (relationship.caregiver_id = target_profile_id and relationship.patient_id = (select auth.uid()))
    );
$$;

alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.caregiver_relationships enable row level security;
alter table public.notifications enable row level security;

create policy "users view permitted profiles" on public.profiles
for select to authenticated using (private.can_view_profile(id));
create policy "users update own profile" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "users view permitted medications" on public.medications
for select to authenticated using (private.has_patient_access(patient_id, 'view'));
create policy "users insert permitted medications" on public.medications
for insert to authenticated with check (private.has_patient_access(patient_id, 'medication'));
create policy "users update permitted medications" on public.medications
for update to authenticated using (private.has_patient_access(patient_id, 'medication'))
with check (private.has_patient_access(patient_id, 'medication'));
create policy "users delete permitted medications" on public.medications
for delete to authenticated using (private.has_patient_access(patient_id, 'medication'));

create policy "users view permitted medication logs" on public.medication_logs
for select to authenticated using (private.has_patient_access(patient_id, 'history'));
create policy "users insert permitted medication logs" on public.medication_logs
for insert to authenticated with check (private.has_patient_access(patient_id, 'medication'));
create policy "users update permitted medication logs" on public.medication_logs
for update to authenticated using (private.has_patient_access(patient_id, 'medication'))
with check (private.has_patient_access(patient_id, 'medication'));

create policy "users view permitted appointments" on public.appointments
for select to authenticated using (private.has_patient_access(patient_id, 'view'));
create policy "users insert permitted appointments" on public.appointments
for insert to authenticated with check (private.has_patient_access(patient_id, 'appointment'));
create policy "users update permitted appointments" on public.appointments
for update to authenticated using (private.has_patient_access(patient_id, 'appointment'))
with check (private.has_patient_access(patient_id, 'appointment'));
create policy "users delete permitted appointments" on public.appointments
for delete to authenticated using (private.has_patient_access(patient_id, 'appointment'));

create policy "participants view relationships" on public.caregiver_relationships
for select to authenticated using (
  (select auth.uid()) = patient_id or (select auth.uid()) = caregiver_id
);
create policy "patients create invitations" on public.caregiver_relationships
for insert to authenticated with check ((select auth.uid()) = patient_id);
create policy "patients manage relationships" on public.caregiver_relationships
for update to authenticated using ((select auth.uid()) = patient_id)
with check ((select auth.uid()) = patient_id);
create policy "patients delete relationships" on public.caregiver_relationships
for delete to authenticated using ((select auth.uid()) = patient_id);

create policy "users view own notifications" on public.notifications
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users update own notifications" on public.notifications
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
