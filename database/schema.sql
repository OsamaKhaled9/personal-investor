-- Personal Investor — Supabase Schema
-- Run this in your Supabase SQL editor

-- Portfolio holdings
create table if not exists portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text not null,
  market text not null check (market in ('EGX', 'US')),
  currency text not null check (currency in ('EGP', 'USD')),
  shares numeric(18, 6) not null check (shares > 0),
  avg_cost_price numeric(18, 4) not null check (avg_cost_price > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Watchlist
create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  name text not null,
  market text not null check (market in ('EGX', 'US')),
  currency text not null check (currency in ('EGP', 'USD')),
  notes text,
  created_at timestamptz default now()
);

-- Alert rules
create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  market text not null check (market in ('EGX', 'US')),
  type text not null check (type in ('price_above', 'price_below', 'percent_change')),
  threshold numeric(18, 4) not null,
  active boolean default true,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Halal screening cache (30-day TTL)
create table if not exists halal_cache (
  ticker text primary key,
  status text not null check (status in ('halal', 'questionable', 'haram', 'unknown')),
  reasons text[] not null default '{}',
  debt_ratio numeric(10, 6),
  interest_income_ratio numeric(10, 6),
  receivables_ratio numeric(10, 6),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- News cache (deduplicated, 7-day TTL)
create table if not exists news_cache (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  url text not null unique,
  source text not null,
  language text not null check (language in ('ar', 'en')),
  published_at timestamptz not null,
  related_tickers text[] default '{}',
  sentiment text check (sentiment in ('positive', 'negative', 'neutral')),
  urgency text check (urgency in ('high', 'medium', 'low')),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Price history cache (for chart display, 24h TTL)
create table if not exists price_history_cache (
  ticker text not null,
  period text not null, -- '1d', '1w', '1m', '3m', '1y'
  data jsonb not null, -- array of {date, open, high, low, close, volume}
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  primary key (ticker, period)
);

-- Useful indexes
create index if not exists idx_alert_rules_active on alert_rules(active) where active = true;
create index if not exists idx_alert_rules_ticker on alert_rules(ticker);
create index if not exists idx_news_cache_tickers on news_cache using gin(related_tickers);
create index if not exists idx_news_cache_published on news_cache(published_at desc);
create index if not exists idx_halal_cache_expires on halal_cache(expires_at);

-- Auto-update updated_at on portfolio_holdings
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on portfolio_holdings
  for each row execute function update_updated_at();
