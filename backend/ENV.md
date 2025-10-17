# Environment Variables Configuration

Copy this template to create your `.env` file and fill in your values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (Required)
SUPABASE_URL=https://rohglryiaxxcobugmpik.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Game Configuration
INITIAL_BALANCE=1000
AIRDROP_AMOUNT=0.06
```

## Important Notes:

1. **SUPABASE_URL**: Your Supabase project URL (found in Project Settings > API)
2. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (found in Project Settings > API > service_role key)
   - ⚠️ **NEVER** commit this key to version control
   - ⚠️ This key bypasses Row Level Security (RLS)
3. **INITIAL_BALANCE**: Starting balance for new users (default: 1000)
4. **AIRDROP_AMOUNT**: Amount shown in airdrop UI (default: 0.06)

## Database Setup:

The application now uses **Supabase JS Client** exclusively. You need to:

1. Create your database schema using the Supabase SQL Editor
2. Run the migration script found in `/backend/src/services/db.ts`
3. Or use the Supabase Dashboard to create tables manually

### Quick Start SQL:

Run this in your Supabase SQL Editor to set up the database:

```sql
-- Enable UUID generation
create extension if not exists pgcrypto;

-- Create users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  address text unique not null,
  name text not null,
  email text not null,
  balance numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create games table
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

-- Create bets table
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

-- Create indexes
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_game_id on public.bets(game_id);
create index if not exists idx_bets_status on public.bets(status);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_created_at on public.games(created_at desc);

-- Create trigger function for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers
create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_games_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger trg_bets_updated_at before update on public.bets
  for each row execute function public.set_updated_at();
```
