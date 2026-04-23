-- ============================================================
-- Order in the Court — full schema
-- Run once in the Supabase SQL editor
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

create table if not exists coach_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  team_name     text,
  organisation  text,
  invite_code   text unique default substring(gen_random_uuid()::text, 1, 6),
  created_at    timestamptz default now()
);

create table if not exists player_profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  jersey_number     int,
  position          text,
  height            text,
  bio               text,
  profile_photo_url text,
  created_at        timestamptz default now()
);

-- Roster entries created by a coach (independent of auth users)
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  coach_id       uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  jersey_number  int,
  position       text,
  created_at     timestamptz default now()
);

-- Links a coach to a player who signed up (via invite code)
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid references auth.users(id) on delete cascade not null,
  player_id  uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(coach_id, player_id)
);

create table if not exists lineups (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid references auth.users(id) on delete cascade not null,
  title      text not null,
  created_at timestamptz default now()
);

create table if not exists lineup_slots (
  id               uuid primary key default gen_random_uuid(),
  lineup_id        uuid references lineups(id) on delete cascade not null,
  player_id        uuid references players(id) on delete cascade not null,
  position_number  int not null check (position_number between 1 and 6),
  created_at       timestamptz default now(),
  unique(lineup_id, position_number)
);

create table if not exists games (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid references auth.users(id) on delete cascade not null,
  home_score       int default 0,
  away_score       int default 0,
  set_number       int default 1,
  active_lineup_id uuid references lineups(id),
  share_token      text unique default replace(gen_random_uuid()::text, '-', ''),
  created_at       timestamptz default now()
);

create table if not exists player_stats (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid references games(id) on delete cascade not null,
  player_id   uuid references players(id) on delete cascade not null,
  set_number  int not null,
  kills       int default 0,
  digs        int default 0,
  aces        int default 0,
  blocks      int default 0,
  errors      int default 0,
  unique(game_id, player_id, set_number)
);

create table if not exists training_sessions (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid references auth.users(id) on delete cascade not null,
  type             text not null,
  duration_minutes int not null,
  intensity        int check (intensity between 1 and 5),
  body_feel        int check (body_feel between 1 and 5),
  notes            text,
  media_url        text,
  inserted_at      timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────

alter table coach_profiles   enable row level security;
alter table player_profiles  enable row level security;
alter table players          enable row level security;
alter table team_members     enable row level security;
alter table lineups          enable row level security;
alter table lineup_slots     enable row level security;
alter table games            enable row level security;
alter table player_stats     enable row level security;
alter table training_sessions enable row level security;

-- coach_profiles: own row only
create policy "coach: own profile" on coach_profiles
  for all using (auth.uid() = id);

-- player_profiles: own row only
create policy "player: own profile" on player_profiles
  for all using (auth.uid() = id);

-- players: coaches manage their own roster
create policy "coach: manage own players" on players
  for all using (auth.uid() = coach_id);

-- team_members: coaches see their own links
create policy "coach: see own team members" on team_members
  for all using (auth.uid() = coach_id);

-- lineups: coaches manage their own
create policy "coach: manage own lineups" on lineups
  for all using (auth.uid() = coach_id);

-- lineup_slots: coaches manage slots belonging to their lineups
create policy "coach: manage own lineup slots" on lineup_slots
  for all using (
    exists (
      select 1 from lineups
      where lineups.id = lineup_slots.lineup_id
        and lineups.coach_id = auth.uid()
    )
  );

-- games: coaches manage; anyone can read via share_token
create policy "coach: manage own games" on games
  for all using (auth.uid() = coach_id);

create policy "public: read game by share_token" on games
  for select using (share_token is not null);

-- player_stats: coaches manage stats in their games
create policy "coach: manage player stats" on player_stats
  for all using (
    exists (
      select 1 from games
      where games.id = player_stats.game_id
        and games.coach_id = auth.uid()
    )
  );

-- player_stats: players can read their own stats
create policy "player: read own stats" on player_stats
  for select using (
    exists (
      select 1 from team_members tm
      join players p on p.id = player_stats.player_id
      where tm.player_id = auth.uid()
        and tm.coach_id = (
          select coach_id from games where games.id = player_stats.game_id
        )
    )
  );

-- training_sessions: players manage their own
create policy "player: manage own training" on training_sessions
  for all using (auth.uid() = player_id);

-- training_sessions: coaches read sessions of players on their team
create policy "coach: read team training" on training_sessions
  for select using (
    exists (
      select 1 from team_members
      where team_members.coach_id = auth.uid()
        and team_members.player_id = training_sessions.player_id
    )
  );

-- ── Auto-create profiles on signup ──────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  if new.raw_user_meta_data->>'role' = 'coach' then
    insert into coach_profiles (id) values (new.id);
  elsif new.raw_user_meta_data->>'role' = 'player' then
    insert into player_profiles (id) values (new.id);
  end if;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
