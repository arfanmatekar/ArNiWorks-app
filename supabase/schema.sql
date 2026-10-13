-- Run this script in the Supabase SQL editor before launching the application.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100 and full_name = btrim(full_name)),
  account_type text not null default 'freelancer'
    check (account_type in ('freelancer', 'client', 'admin')),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 3000),
  portfolio_url text,
  skills text[] not null default '{}'
    check (cardinality(skills) <= 30),
  experience_level text check (experience_level is null or experience_level in ('entry', 'intermediate', 'expert')),
  hourly_rate numeric(12, 2) check (hourly_rate is null or hourly_rate >= 0),
  currency text not null default 'INR' check (currency in ('INR', 'USD', 'EUR')),
  company_name text check (company_name is null or char_length(company_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 8 and 120),
  description text not null check (char_length(description) between 30 and 8000),
  category text not null check (category in (
    'Web Development', 'Graphic Design', 'Video Editing', 'Data Entry',
    'Content Writing', 'Digital Marketing', 'Data Science'
  )),
  budget numeric(14, 2) not null check (budget > 0),
  currency text not null check (currency in ('INR', 'USD', 'EUR')),
  deadline date,
  requirements text[] not null default '{}' check (cardinality(requirements) <= 20),
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  freelancer_id uuid not null references public.profiles (id) on delete cascade,
  cover_letter text not null check (char_length(cover_letter) between 40 and 4000),
  proposed_price numeric(14, 2) not null check (proposed_price > 0),
  currency text not null check (currency in ('INR', 'USD', 'EUR')),
  estimated_delivery_days integer not null check (estimated_delivery_days between 1 and 3650),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (project_id, freelancer_id)
);

create unique index if not exists applications_one_accepted_per_project
  on public.applications (project_id) where status = 'accepted';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists messages_project_created_idx
  on public.messages (project_id, created_at);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  unique (project_id, reviewer_id),
  check (reviewer_id <> recipient_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  reason text not null check (reason in ('fraud', 'harassment', 'spam', 'other')),
  description text not null check (char_length(description) between 20 and 3000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now(),
  check (reported_user_id is null or reported_user_id <> reporter_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_type = 'admin'
      and p.account_status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_status = 'active'
  );
$$;

create or replace function public.can_view_project(requested_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    where a.project_id = requested_project_id
      and a.freelancer_id = (select auth.uid())
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_type text := new.raw_user_meta_data ->> 'account_type';
  requested_name text := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
begin
  if requested_type is null or requested_type not in ('freelancer', 'client') then
    requested_type := 'freelancer';
  end if;
  if char_length(requested_name) < 2 or char_length(requested_name) > 100 then
    raise exception 'A valid full name is required to create an account';
  end if;
  insert into public.profiles (id, full_name, account_type)
  values (new.id, requested_name, requested_type);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.account_type is distinct from old.account_type
      or new.account_status is distinct from old.account_status)
    and not public.is_admin()
    and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only an administrator may change account permissions or status';
  end if;
  return new;
end;
$$;

create or replace function public.validate_profile_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(new.skills) > 30
    or exists (
      select 1 from unnest(new.skills) as skill_values(skill)
      where char_length(btrim(skill_values.skill)) not between 1 and 40
    ) then
    raise exception 'Profile skills must be up to 30 non-empty values of 40 characters or fewer';
  end if;
  if new.portfolio_url is not null
    and (char_length(new.portfolio_url) > 2048 or new.portfolio_url !~* '^https?://') then
    raise exception 'Portfolio links must be valid HTTP or HTTPS URLs';
  end if;
  if new.avatar_url is not null
    and (char_length(new.avatar_url) > 2048 or new.avatar_url !~* '^https?://') then
    raise exception 'Profile photos must use an HTTP or HTTPS URL';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_content on public.profiles;
create trigger profiles_validate_content before insert or update on public.profiles
  for each row execute procedure public.validate_profile_content();

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

create or replace function public.validate_project_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if cardinality(new.requirements) > 20
    or exists (
      select 1 from unnest(new.requirements) as skill_values(skill)
      where char_length(btrim(skill_values.skill)) not between 1 and 40
    ) then
    raise exception 'Project skills must be up to 20 non-empty values of 40 characters or fewer';
  end if;
  if new.deadline is not null and new.deadline < current_date then
    if tg_op = 'INSERT' then
      raise exception 'Project deadlines must be today or later';
    elsif new.deadline is distinct from old.deadline then
      raise exception 'Project deadlines must be today or later';
    end if;
  end if;
  if new.status in ('in_progress', 'completed') and not exists (
    select 1 from public.applications a
    where a.project_id = new.id and a.status = 'accepted'
  ) then
    raise exception 'A project needs an accepted proposal before work can begin or be completed';
  end if;
  if tg_op = 'UPDATE' and old.status = 'completed'
    and new.status <> 'completed' and not public.is_admin() then
    raise exception 'Completed projects cannot be reopened';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_validate_status on public.projects;
create trigger projects_validate_status before insert or update on public.projects
  for each row execute procedure public.validate_project_status();

create or replace function public.respond_to_application(
  requested_application_id uuid,
  decision text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project uuid;
begin
  if decision not in ('accepted', 'rejected') then
    raise exception 'Invalid proposal decision';
  end if;
  select a.project_id into target_project
  from public.applications a
  join public.projects p on p.id = a.project_id
  where a.id = requested_application_id
    and p.client_id = (select auth.uid())
    and p.status = 'open'
    and a.status = 'pending'
    and public.is_active_user()
  for update of p;

  if target_project is null then
    raise exception 'Proposal is unavailable or you are not authorized to review it';
  end if;

  update public.applications
  set status = decision
  where id = requested_application_id and status = 'pending';

  if decision = 'accepted' then
    update public.applications
    set status = 'rejected'
    where project_id = target_project
      and id <> requested_application_id
      and status = 'pending';
    update public.projects
    set status = 'in_progress'
    where id = target_project;
  end if;
end;
$$;

create or replace function public.admin_list_accounts()
returns table (
  id uuid,
  full_name text,
  account_type text,
  account_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  return query
    select p.id, p.full_name, p.account_type, p.account_status, p.created_at
    from public.profiles p
    order by p.created_at desc
    limit 500;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Read public freelancer profiles" on public.profiles;
create policy "Read public freelancer profiles" on public.profiles
  for select to anon, authenticated using (
    (account_type = 'freelancer' and account_status = 'active')
    or id = (select auth.uid())
    or (select public.is_admin())
  );
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Read open projects and authorized projects" on public.projects;
create policy "Read open projects and authorized projects" on public.projects
  for select to anon, authenticated using (
    status = 'open'
    or client_id = (select auth.uid())
    or (select public.is_admin())
    or (select public.can_view_project(id))
  );
drop policy if exists "Clients create their own projects" on public.projects;
create policy "Clients create their own projects" on public.projects
  for insert to authenticated with check (
    client_id = (select auth.uid()) and status = 'open'
    and (select public.is_active_user())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_type = 'client')
  );
drop policy if exists "Clients and admins update projects" on public.projects;
create policy "Clients and admins update projects" on public.projects
  for update to authenticated using (
    (client_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  ) with check (
    (client_id = (select auth.uid()) and (select public.is_active_user()))
    or (select public.is_admin())
  );

drop policy if exists "Participants read applications" on public.applications;
create policy "Participants read applications" on public.applications
  for select to authenticated using (
    freelancer_id = (select auth.uid())
    or exists (select 1 from public.projects p where p.id = project_id and p.client_id = (select auth.uid()))
    or (select public.is_admin())
  );
drop policy if exists "Freelancers apply to open projects" on public.applications;
create policy "Freelancers apply to open projects" on public.applications
  for insert to authenticated with check (
    freelancer_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_type = 'freelancer')
    and exists (select 1 from public.projects p where p.id = project_id and p.status = 'open' and p.client_id <> (select auth.uid()))
  );

drop policy if exists "Accepted project participants read messages" on public.messages;
create policy "Accepted project participants read messages" on public.messages
  for select to authenticated using (
    (select public.is_admin())
    or exists (
      select 1 from public.projects p
      join public.applications a on a.project_id = p.id and a.status = 'accepted'
      where p.id = messages.project_id
        and ((p.client_id = (select auth.uid()) and a.freelancer_id = recipient_id)
          or (a.freelancer_id = (select auth.uid()) and p.client_id = recipient_id))
        and (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    )
  );
drop policy if exists "Accepted project participants send messages" on public.messages;
create policy "Accepted project participants send messages" on public.messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (
      select 1 from public.projects p
      join public.applications a on a.project_id = p.id and a.status = 'accepted'
      where p.id = messages.project_id
        and ((p.client_id = (select auth.uid()) and a.freelancer_id = recipient_id)
          or (a.freelancer_id = (select auth.uid()) and p.client_id = recipient_id))
    )
  );

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews
  for select to anon, authenticated using (true);
drop policy if exists "Completed project participants leave reviews" on public.reviews;
create policy "Completed project participants leave reviews" on public.reviews
  for insert to authenticated with check (
    reviewer_id = (select auth.uid())
    and (select public.is_active_user())
    and exists (
      select 1 from public.projects p
      join public.applications a on a.project_id = p.id and a.status = 'accepted'
      where p.id = reviews.project_id and p.status = 'completed'
        and ((p.client_id = reviewer_id and a.freelancer_id = recipient_id)
          or (a.freelancer_id = reviewer_id and p.client_id = recipient_id))
    )
  );

drop policy if exists "Reporters and admins read reports" on public.reports;
create policy "Reporters and admins read reports" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Active members submit reports" on public.reports;
create policy "Active members submit reports" on public.reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and (select public.is_active_user())
  );
drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports
  for update to authenticated using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on public.profiles, public.projects, public.applications, public.messages,
  public.reviews, public.reports from public, anon, authenticated;

revoke all on function public.respond_to_application(uuid, text) from public, anon;
grant execute on function public.respond_to_application(uuid, text) to authenticated;
revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.is_active_user() from public, anon;
grant execute on function public.is_active_user() to authenticated;
revoke all on function public.can_view_project(uuid) from public;
grant execute on function public.can_view_project(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view profile avatars" on storage.objects;
create policy "Anyone can view profile avatars" on storage.objects
  for select to anon, authenticated using (bucket_id = 'profile-avatars');
drop policy if exists "Users upload their own avatars" on storage.objects;
create policy "Users upload their own avatars" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_active_user())
  );
drop policy if exists "Users delete their own avatars" on storage.objects;
create policy "Users delete their own avatars" on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

grant select on public.profiles to anon, authenticated;
grant update (full_name, avatar_url, bio, portfolio_url, skills, experience_level, hourly_rate, currency, company_name, account_status)
  on public.profiles to authenticated;
grant select on public.projects to anon, authenticated;
grant insert (client_id, title, description, category, budget, currency, deadline, requirements)
  on public.projects to authenticated;
grant update (title, description, category, budget, currency, deadline, requirements, status)
  on public.projects to authenticated;
grant select on public.applications to authenticated;
grant insert (project_id, freelancer_id, cover_letter, proposed_price, currency, estimated_delivery_days)
  on public.applications to authenticated;
grant select on public.messages to authenticated;
grant insert (project_id, sender_id, recipient_id, content) on public.messages to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (project_id, reviewer_id, recipient_id, rating, comment) on public.reviews to authenticated;
grant select on public.reports to authenticated;
grant insert (reporter_id, reported_user_id, project_id, reason, description) on public.reports to authenticated;
grant update (status) on public.reports to authenticated;
grant usage on schema public to anon, authenticated;

-- Bootstrap an administrator only after registering a trusted account:
-- update public.profiles set account_type = 'admin' where id = '<trusted-user-uuid>';
