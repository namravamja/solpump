-- SOLPUMP Database Migration Script
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- 
-- This script will create all necessary tables, indexes, and triggers
-- for the SOLPUMP casino application.

-- Enable UUID generation extension
create extension if not exists pgcrypto;

-- ============================================
-- USERS TABLE
-- ============================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  name text not null,
  email text not null,
  balance numeric not null default 1000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create unique index on address
create unique index if not exists users_address_key on public.users(address);

-- Add balance column if it doesn't exist (for existing databases)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'balance'
  ) then
    alter table public.users add column balance numeric not null default 1000;
  end if;
end$$;

-- ============================================
-- GAMES TABLE
-- ============================================
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  target_multiplier numeric not null,
  current_multiplier numeric not null default 1.0,
  status text not null default 'COUNTDOWN' check (status in ('COUNTDOWN', 'RUNNING', 'COMPLETED', 'CANCELLED')),
  start_time timestamptz,
  end_time timestamptz,
  final_multiplier numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- BETS TABLE
-- ============================================
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  user_address text not null,
  user_name text not null,
  amount numeric not null check (amount > 0),
  auto_cashout numeric,
  game_id uuid not null references public.games(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'CASHED_OUT', 'LOST', 'WON')),
  multiplier_at_cashout numeric,
  payout numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_game_id on public.bets(game_id);
create index if not exists idx_bets_status on public.bets(status);
create index if not exists idx_bets_user_address on public.bets(user_address);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_created_at on public.games(created_at desc);

-- ============================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================

-- Users table trigger
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- Games table trigger
drop trigger if exists trg_games_updated_at on public.games;
create trigger trg_games_updated_at
before update on public.games
for each row execute function public.set_updated_at();

-- Bets table trigger
drop trigger if exists trg_bets_updated_at on public.bets;
create trigger trg_bets_updated_at
before update on public.bets
for each row execute function public.set_updated_at();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your tables were created successfully:

-- Check tables exist
select 
  schemaname,
  tablename
from pg_tables
where schemaname = 'public' 
  and tablename in ('users', 'games', 'bets')
order by tablename;

-- Check indexes
select 
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('users', 'games', 'bets')
order by tablename, indexname;

-- ============================================
-- GRANT PERMISSIONS (Optional - if using RLS)
-- ============================================
-- If you want to enable Row Level Security, uncomment these:
-- 
-- alter table public.users enable row level security;
-- alter table public.games enable row level security;
-- alter table public.bets enable row level security;
-- 
-- Grant permissions to authenticated users:
-- grant usage on schema public to authenticated;
-- grant all on public.users to authenticated;
-- grant all on public.games to authenticated;
-- grant all on public.bets to authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
do $$
begin
  raise notice '✅ Database migration completed successfully!';
  raise notice '   Tables created: users, games, bets';
  raise notice '   Indexes created for optimal performance';
  raise notice '   Triggers configured for automatic timestamp updates';
end$$;

