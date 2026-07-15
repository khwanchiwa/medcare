-- Pending caregiver invitations for the original Users/Patients schema.
-- Patients.caregiver_id is updated only after the caregiver accepts.

create table if not exists public.legacy_caregiver_invitations (
  id bigserial primary key,
  patient_user_id int8 not null references public."Users"(id) on delete cascade,
  caregiver_user_id int8 not null references public."Users"(id) on delete cascade,
  relationship_label text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'revoked')),
  can_edit_medication boolean not null default true,
  can_edit_appointment boolean not null default true,
  can_view_history boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists legacy_caregiver_invitations_active_idx
  on public.legacy_caregiver_invitations(patient_user_id, caregiver_user_id)
  where status in ('pending', 'approved');

create index if not exists legacy_caregiver_invitations_patient_idx
  on public.legacy_caregiver_invitations(patient_user_id, status);

create index if not exists legacy_caregiver_invitations_caregiver_idx
  on public.legacy_caregiver_invitations(caregiver_user_id, status);

grant select, insert, update, delete on public.legacy_caregiver_invitations to service_role;
grant usage, select on sequence public.legacy_caregiver_invitations_id_seq to service_role;
