-- NEPSE Future AI - initial schema draft (PostgreSQL)

--
-- SECURITY ARCHITECTURE OVERVIEW:
-- ================================
-- This schema implements a two-layer security model:
--
-- 1. EXPRESS APPLICATION LAYER (API Middleware):
--    - authenticateToken: Verifies JWT and extracts user claims (id, role)
--    - requireRole(['admin']): Enforces role-based authorization at API level
--    - All admin operations use adminClient (service role, bypasses RLS)
--    - All user operations use userClient (anon key, enforces RLS)
--    Example: POST /auth/register uses adminClient + requireRole check
--
-- 2. DATABASE LAYER (Row Level Security - RLS):
--    - RLS policies provide defense-in-depth for direct DB access
--    - auth.uid() = user_id: User can only see/modify their own records (users, subscriptions, payments)
--    - auth.role() = 'authenticated': Authenticated users can read public/shared data (prices, news, fundamentals)
--    - For admin operations: Express middleware + service role (adminClient) provides access control
--    - The 'role' column in users table is application RBAC; JWT 'role' claim remains 'authenticated' for all logged-in users
--
-- KEY POINTS:
-- - admin_logs uses auth.jwt() ->> 'role' for custom JWT claims (future integration)
-- - All routes must authenticate BEFORE issuing Supabase queries (no anonymous writes)
-- - All writes use adminClient (validated by Express middleware first)
-- - All reads use userClient EXCEPT admin endpoints protected by requireRole(['admin'])
-- - Payload validation happens in Express before database queries (Comment 6: constraints checked at API layer)
--

-- Ensure required extensions are available (pgcrypto provides gen_random_uuid)
create extension if not exists pgcrypto;

-- Users and auth profiles (will integrate with Supabase later)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'user', -- 'user' | 'admin' (application RBAC, enforced by Express middleware)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  session_expires_at timestamptz,
  constraint role_check CHECK (role IN ('user','admin'))
);

-- Indexes to speed up auth queries
create index if not exists idx_users_email on users(email);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  plan text not null default 'monthly',
  status text not null default 'trial', -- trial | active | past_due | canceled
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  constraint subscription_status_check check (status in ('trial', 'active', 'past_due', 'canceled'))
);

create index if not exists idx_subscriptions_user_id on subscriptions(user_id);

-- Row Level Security (RLS) Policies
alter table users enable row level security;
create policy if not exists users_select_own on users for select using (auth.uid() = id);
create policy if not exists users_update_own on users for update using (auth.uid() = id);
create policy if not exists users_insert_own on users for insert with check (auth.uid() = id);

alter table subscriptions enable row level security;
create policy if not exists subscriptions_select_own on subscriptions for select using (auth.uid() = user_id);
create policy if not exists subscriptions_insert_own on subscriptions for insert with check (auth.uid() = user_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  provider text not null, -- esewa | khalti | imepay
  amount_npr integer not null,
  txn_id text,
  status text not null default 'pending', -- pending | verified | failed
  meta jsonb,
  created_at timestamptz not null default now(),
  constraint payment_amount_positive check (amount_npr > 0),
  constraint payment_status_check check (status in ('pending', 'verified', 'failed')),
  constraint payment_provider_check check (provider in ('esewa', 'khalti', 'imepay'))
);

create index if not exists idx_payments_user_id on payments(user_id);

alter table payments enable row level security;
create policy if not exists payments_select_own on payments for select using (auth.uid() = user_id);
create policy if not exists payments_insert_own on payments for insert with check (auth.uid() = user_id);

create table if not exists companies (
  id serial primary key,
  symbol text unique not null,
  name text,
  sector text,
  market_cap numeric,
  pe_ratio numeric,
  created_at timestamptz not null default now(),
  constraint market_cap_non_negative check (market_cap >= 0)
);

create table if not exists prices_ohlc (
  id bigserial primary key,
  company_id int references companies(id) on delete cascade,
  symbol text,
  date date not null,
  open numeric,
  high numeric,
  low numeric,
  close numeric,
  volume numeric,
  unique(company_id, date),
  constraint prices_positive check (open > 0 and high > 0 and low > 0 and close > 0),
  constraint volume_non_negative check (volume >= 0),
  constraint high_low_check check (high >= low)
);

create index if not exists idx_prices_company_date on prices_ohlc(company_id, date);
create index if not exists idx_prices_ohlc_symbol on prices_ohlc(symbol);

alter table prices_ohlc enable row level security;
create policy if not exists prices_ohlc_select_authenticated on prices_ohlc for select using (auth.role() = 'authenticated');

create table if not exists fundamentals (
  id bigserial primary key,
  company_id int references companies(id) on delete cascade,
  period text not null, -- e.g., FY2023 Q4
  pe_ratio numeric,
  pb_ratio numeric,
  roe numeric,
  roa numeric,
  dividend_yield numeric,
  created_at timestamptz not null default now(),
  unique(company_id, period)
);

create index if not exists idx_fundamentals_company_id on fundamentals(company_id);

alter table fundamentals enable row level security;
create policy if not exists fundamentals_select_authenticated on fundamentals for select using (auth.role() = 'authenticated');

create table if not exists news (
  id bigserial primary key,
  source text,
  title text,
  url text,
  published_at timestamptz,
  lang text,
  created_at timestamptz not null default now()
);

create table if not exists sentiments (
  id bigserial primary key,
  news_id bigint references news(id) on delete cascade,
  label text,
  score numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_sentiments_news_id on sentiments(news_id);

alter table news enable row level security;
create policy if not exists news_select_authenticated on news for select using (auth.role() = 'authenticated');

alter table sentiments enable row level security;
create policy if not exists sentiments_select_authenticated on sentiments for select using (auth.role() = 'authenticated');

create table if not exists forecasts (
  id bigserial primary key,
  company_id int references companies(id) on delete cascade,
  horizon_days int not null,
  generated_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists idx_forecasts_company_id on forecasts(company_id);

alter table forecasts enable row level security;
create policy if not exists forecasts_select_authenticated on forecasts for select using (auth.role() = 'authenticated');

create table if not exists rankings (
  id bigserial primary key,
  as_of_date date not null,
  payload jsonb not null
);

alter table rankings enable row level security;
create policy if not exists rankings_select_authenticated on rankings for select using (auth.role() = 'authenticated');

create table if not exists admin_logs (
  id bigserial primary key,
  admin_email text,
  action text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_admin_email on admin_logs(admin_email);
create index if not exists idx_admin_logs_created_at on admin_logs(created_at desc);

alter table admin_logs enable row level security;
create policy if not exists admin_logs_admin_only on admin_logs for all using (auth.jwt() ->> 'role' = 'admin');
