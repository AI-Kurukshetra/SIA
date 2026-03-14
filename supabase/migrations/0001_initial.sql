create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (team_id, user_id)
);

create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  hostname text not null,
  provider text not null,
  environment text not null check (environment in ('production', 'staging', 'development')),
  region text not null,
  os_family text not null,
  ssh_user text not null,
  status text not null default 'healthy' check (status in ('healthy', 'warning', 'critical')),
  owner text not null,
  summary text not null,
  tags text[] not null default '{}',
  last_scanned_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  server_id uuid not null references public.servers(id) on delete cascade,
  source text not null default 'agent' check (source in ('agent', 'demo')),
  status text not null default 'completed' check (status in ('completed', 'running', 'queued', 'failed')),
  started_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  report_title text not null,
  executive_summary text not null,
  architecture_notes text not null,
  services jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  ports jsonb not null default '[]'::jsonb,
  software jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_profiles_team_id on public.profiles(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);
create index if not exists idx_servers_team_id on public.servers(team_id);
create index if not exists idx_scans_server_id on public.scans(server_id);
create index if not exists idx_scans_team_id_completed_at on public.scans(team_id, completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team_id uuid := gen_random_uuid();
  local_part text := split_part(coalesce(new.email, 'workspace'), '@', 1);
  team_slug text := regexp_replace(lower(local_part), '[^a-z0-9]+', '-', 'g');
  team_name text := coalesce(new.raw_user_meta_data ->> 'team_name', initcap(replace(local_part, '.', ' ')) || ' Workspace');
  full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', initcap(replace(local_part, '.', ' ')));
begin
  insert into public.teams (id, name, slug)
  values (new_team_id, team_name, left(team_slug, 40) || '-' || substr(new.id::text, 1, 8));

  insert into public.profiles (id, team_id, full_name, email)
  values (new.id, new_team_id, full_name, new.email);

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_servers_updated_at on public.servers;
create trigger set_servers_updated_at
  before update on public.servers
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_scans_updated_at on public.scans;
create trigger set_scans_updated_at
  before update on public.scans
  for each row execute procedure public.set_updated_at();

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.servers enable row level security;
alter table public.scans enable row level security;

create policy "team members can read teams"
  on public.teams
  for select
  using (public.is_team_member(id));

create policy "team members can read profiles"
  on public.profiles
  for select
  using (public.is_team_member(team_id));

create policy "team members can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "team members can read memberships"
  on public.team_members
  for select
  using (public.is_team_member(team_id));

create policy "team members can manage servers"
  on public.servers
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "team members can manage scans"
  on public.scans
  for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));
