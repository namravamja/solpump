import { getSupabase } from './supabase.js';

/**
 * Initialize database schema using Supabase SQL query execution
 * This replaces the pg direct connection approach
 */
export async function ensureUsersTable(): Promise<void> {
  try {
    const supabase = getSupabase();
    
    console.log('🔧 Initializing database schema via Supabase...');

    // Execute database initialization SQL
    // Note: Supabase JS doesn't have a direct SQL execution method for DDL
    // We'll use the REST API to execute raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        -- Enable pgcrypto extension for UUID generation
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

        -- Create unique index on address
        create unique index if not exists users_address_key on public.users(address);

        -- Add balance column if it doesn't exist (migration support)
        do $$
        begin
          if not exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = 'users' and column_name = 'balance'
          ) then
            alter table public.users add column balance numeric not null default 0;
          end if;
        end$$;

        -- Create trigger function for updated_at
        create or replace function public.set_updated_at()
        returns trigger language plpgsql as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$;

        -- Create trigger for users table
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

        -- Add triggers for updated_at on games
        drop trigger if exists trg_games_updated_at on public.games;
        create trigger trg_games_updated_at
        before update on public.games
        for each row execute function public.set_updated_at();

        -- Add triggers for updated_at on bets
        drop trigger if exists trg_bets_updated_at on public.bets;
        create trigger trg_bets_updated_at
        before update on public.bets
        for each row execute function public.set_updated_at();
      `
    });

    if (error) {
      // If RPC method doesn't exist, we need to handle this differently
      console.warn('⚠️  Direct SQL execution via RPC not available.');
      console.warn('⚠️  Please run the database migration script manually in Supabase SQL Editor.');
      console.warn('⚠️  Or ensure tables are created via Supabase Dashboard.');
      console.warn('   Error:', error.message);
      
      // Instead, we'll verify tables exist using a simple query
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.message.includes('relation "public.users" does not exist')) {
        console.error('❌ Users table does not exist. Please create database schema manually.');
        console.error('   Use the Supabase SQL Editor to run the migration script.');
      } else {
        console.log('✅ Database tables appear to be initialized.');
      }
      
      return;
    }

    console.log('✅ Database schema initialized successfully');
  } catch (err: any) {
    console.error('❌ Database initialization error:', err?.message ?? 'Unknown error');
    console.warn('⚠️  Continuing without automatic schema initialization.');
    console.warn('⚠️  Please ensure database tables are created manually if needed.');
    console.warn('\n📋 Run this SQL in your Supabase SQL Editor:\n');
    console.warn(`
      -- Enable pgcrypto extension
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

      -- Create games and bets tables (see full schema in db.ts)
    `);
  }
}
