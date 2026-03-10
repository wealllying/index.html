-- ============================================
-- Transaction limits + compliance fields
-- Run after 001_initial_schema.sql
-- ============================================

-- Limits per user (defaults: 500 per tx, 2000/day, 5000/month)
alter table public.profiles
  add column if not exists limit_per_transfer_usd numeric(10,2) default 500,
  add column if not exists limit_daily_usd numeric(10,2) default 2000,
  add column if not exists limit_monthly_usd numeric(10,2) default 5000,
  add column if not exists kyc_rejection_reason text;

-- Source of funds + purpose (compliance)
alter table public.transactions
  add column if not exists source_of_funds text check (source_of_funds in ('salary', 'savings', 'business', 'gift', 'other')),
  add column if not exists purpose_of_transfer text check (purpose_of_transfer in ('family_support', 'education', 'medical', 'business', 'savings', 'other'));
