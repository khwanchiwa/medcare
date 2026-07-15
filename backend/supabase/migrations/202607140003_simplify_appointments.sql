-- MedCare appointments now require only title, date, time and preparation notes.
-- Keep legacy columns for existing data, but allow new records to omit them.
alter table if exists public.appointments
  alter column hospital drop not null;
