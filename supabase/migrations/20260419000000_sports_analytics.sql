-- Roles enum & user_roles table (separate from profiles to prevent privilege escalation)
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer role check (avoids recursive RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- Auto-create profile + default 'user' role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_a text not null,
  team_b text not null,
  team_a_short text not null,
  team_b_short text not null,
  venue text,
  format text not null default 'T20', -- T20, ODI, Test
  status text not null default 'upcoming', -- upcoming, live, completed
  -- Innings 1
  team_a_runs int not null default 0,
  team_a_wickets int not null default 0,
  team_a_overs numeric(4,1) not null default 0,
  -- Innings 2
  team_b_runs int not null default 0,
  team_b_wickets int not null default 0,
  team_b_overs numeric(4,1) not null default 0,
  current_innings int not null default 1,
  batting_team text, -- 'A' or 'B'
  result_summary text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Players
create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  role text not null default 'Batter', -- Batter, Bowler, All-rounder, Wicket-keeper
  jersey_number int,
  created_at timestamptz not null default now()
);

-- Player match stats
create table public.player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  runs int not null default 0,
  balls_faced int not null default 0,
  fours int not null default 0,
  sixes int not null default 0,
  wickets int not null default 0,
  overs_bowled numeric(4,1) not null default 0,
  runs_conceded int not null default 0,
  is_out boolean not null default false,
  is_striker boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger matches_updated_at before update on public.matches
for each row execute function public.set_updated_at();
create trigger player_stats_updated_at before update on public.player_stats
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.player_stats enable row level security;

-- Profiles: users see/update their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- user_roles: users can view their own roles; only admins can modify
create policy "Users view own roles"
  on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins view all roles"
  on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Matches: public read; admin write
create policy "Matches public read" on public.matches for select using (true);
create policy "Admins manage matches" on public.matches for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Players: public read; admin write
create policy "Players public read" on public.players for select using (true);
create policy "Admins manage players" on public.players for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Player stats: public read; admin write
create policy "Stats public read" on public.player_stats for select using (true);
create policy "Admins manage stats" on public.player_stats for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Realtime
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.player_stats;
