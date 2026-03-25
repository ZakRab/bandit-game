-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Game state (singleton row)
create table game_sessions (
  id text primary key default 'main',
  current_round int not null default 0,
  round_active boolean not null default false
);

-- Players
create table players (
  id text primary key,
  persona text not null,
  joined_at timestamptz default now()
);

-- Choices
create table choices (
  id serial primary key,
  player_id text not null,
  round int not null,
  attempt int not null,
  choice text not null,
  success boolean not null,
  created_at timestamptz default now()
);

-- Enable Realtime on all tables
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table choices;

-- RLS policies (open for the game — no auth needed)
alter table game_sessions enable row level security;
alter table players enable row level security;
alter table choices enable row level security;

create policy "open_read_write" on game_sessions for all using (true) with check (true);
create policy "open_read_write" on players for all using (true) with check (true);
create policy "open_read_write" on choices for all using (true) with check (true);

-- Seed initial game state
insert into game_sessions (id, current_round, round_active) values ('main', 0, false);
