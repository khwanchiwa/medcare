-- Upgrade the original MedCare Users table to work with Supabase Auth.
-- Run this in Supabase SQL Editor before production use.

alter table public."Users"
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

alter table public."Users"
  alter column password drop not null;

create index if not exists users_auth_user_id_idx
  on public."Users"(auth_user_id);

alter table public."Users" enable row level security;

drop policy if exists "users view own account" on public."Users";
create policy "users view own account"
  on public."Users"
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

drop policy if exists "users update own account" on public."Users";
create policy "users update own account"
  on public."Users"
  for update
  to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check ((select auth.uid()) = auth_user_id);

grant select, update on public."Users" to authenticated;
grant select, insert, update, delete on public."Users" to service_role;

comment on column public."Users".password is
  'Deprecated. Passwords are managed by Supabase Auth and must not be stored here.';
