-- ============================================
-- Family Wallets — shared family pot
-- Run after 002_limits_and_compliance.sql
-- ============================================

-- ── FAMILY WALLETS ───────────────────────────
create table public.family_wallets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  name text not null,
  owner_phone text not null,
  balance_usd numeric(10,2) default 0 not null check (balance_usd >= 0)
);

create trigger family_wallets_updated_at before update on public.family_wallets
  for each row execute procedure public.handle_updated_at();

-- ── WALLET MEMBERS ───────────────────────────
create table public.wallet_members (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  wallet_id uuid references public.family_wallets(id) on delete cascade not null,
  phone text not null,
  name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active')),
  spend_limit_usd numeric(10,2),
  unique (wallet_id, phone)
);

create index wallet_members_wallet_id_idx on public.wallet_members(wallet_id);
create index wallet_members_phone_idx on public.wallet_members(phone);

-- ── WALLET TRANSACTIONS ──────────────────────
create table public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  wallet_id uuid references public.family_wallets(id) on delete cascade not null,
  member_phone text not null,
  type text not null check (type in ('top_up', 'spend')),
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  description text,
  balance_after numeric(10,2) not null
);

create index wallet_transactions_wallet_id_idx on public.wallet_transactions(wallet_id);

-- ── WALLET REQUESTS ──────────────────────────
create table public.wallet_requests (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  wallet_id uuid references public.family_wallets(id) on delete cascade not null,
  requester_phone text not null,
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied'))
);

create trigger wallet_requests_updated_at before update on public.wallet_requests
  for each row execute procedure public.handle_updated_at();

create index wallet_requests_wallet_id_idx on public.wallet_requests(wallet_id);
create index wallet_requests_status_idx on public.wallet_requests(status);
