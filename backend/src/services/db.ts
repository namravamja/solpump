import { Client } from 'pg';

export async function ensureUsersTable(): Promise<void> {
  const databaseUrl = process.env.SUPABASE_DB_URL as string | undefined;
  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.warn('Skipping DB init: SUPABASE_DB_URL not set');
    return;
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      create extension if not exists pgcrypto;

      create table if not exists public.users (
        id uuid primary key default gen_random_uuid(),
        address text unique not null,
        name text not null,
        email text not null,
        balance numeric not null default 0,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );

      create unique index if not exists users_address_key on public.users(address);
      -- Intentionally avoid a hard unique index on name to prevent startup failures when duplicates exist
      -- create unique index if not exists users_name_key on public.users(name);

      do $$
      begin
        if not exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'users' and column_name = 'balance'
        ) then
          alter table public.users add column balance numeric not null default 0;
        end if;
      end$$;

      create or replace function public.set_updated_at()
      returns trigger language plpgsql as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;

      drop trigger if exists trg_users_updated_at on public.users;
      create trigger trg_users_updated_at
      before update on public.users
      for each row execute function public.set_updated_at();

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

      -- Create indexes for better performance
      create index if not exists idx_bets_user_id on public.bets(user_id);
      create index if not exists idx_bets_game_id on public.bets(game_id);
      create index if not exists idx_bets_status on public.bets(status);
      create index if not exists idx_games_status on public.games(status);
      create index if not exists idx_games_created_at on public.games(created_at desc);

      -- Add triggers for updated_at
      drop trigger if exists trg_games_updated_at on public.games;
      create trigger trg_games_updated_at
      before update on public.games
      for each row execute function public.set_updated_at();

      drop trigger if exists trg_bets_updated_at on public.bets;
      create trigger trg_bets_updated_at
      before update on public.bets
      for each row execute function public.set_updated_at();
    `);
  } finally {
    await client.end();
  }
}


