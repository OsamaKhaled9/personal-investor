-- Watchlist table — run in Supabase SQL editor before deploying watchlist feature
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text not null,
  market text not null check (market in ('EGX', 'US')),
  currency text not null check (currency in ('EGP', 'USD')),
  notes text,
  created_at timestamptz default now()
);

create unique index watchlist_ticker_unique on watchlist (ticker);
