-- ============================================
-- PlataYa Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  date_of_birth date,
  id_type text check (id_type in ('passport', 'drivers_license', 'state_id')),
  id_number text,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'submitted', 'approved', 'rejected')),
  onboarding_step integer default 0,
  onboarding_complete boolean default false
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- ── RECIPIENTS ────────────────────────────────
create table public.recipients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  bank_name text not null,
  bank_account_number text not null,
  relationship text,
  is_default boolean default false
);

alter table public.recipients enable row level security;
create policy "Users can manage own recipients" on public.recipients
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index
create index recipients_user_id_idx on public.recipients(user_id);

-- ── TRANSACTIONS ──────────────────────────────
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.recipients(id) not null,
  amount_usd numeric(10,2) not null check (amount_usd >= 10),
  amount_dop numeric(12,2) not null,
  exchange_rate numeric(8,4) not null,
  fee_usd numeric(8,2) not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  moonpay_transaction_id text,
  reference_code text not null unique
);

create trigger transactions_updated_at before update on public.transactions
  for each row execute procedure public.handle_updated_at();

alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);

-- Index
create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_status_idx on public.transactions(status);
