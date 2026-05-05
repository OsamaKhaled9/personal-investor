@AGENTS.md

# Personal Investor — Project Guide

## What this is
A halal-compliant personal investment intelligence app for the Egyptian (EGX) and US markets.
PWA deployed on Vercel. Telegram Bot for notifications. $0/month to run.

## Stack
- Next.js 16 App Router + TypeScript
- Tailwind CSS 4 + Framer Motion + shadcn/ui
- Supabase (free tier PostgreSQL)
- grammY (Telegram bot)
- yahoo-finance2 (market data)
- @google/generative-ai (Gemini Flash — free tier)

## Conventions
- All financial values are stored as numbers (not strings)
- EGP amounts use 2 decimal places; percentages use 4 decimal places
- EGX tickers on Yahoo Finance use `.CA` suffix (e.g. `COMI.CA`)
- US tickers are plain (e.g. `AAPL`)
- Halal status: `"halal"` | `"questionable"` | `"haram"` — always include reasoning
- All server-only code (scrapers, AI calls, Telegram) lives in `lib/` and is never imported client-side
- API routes are in `app/api/` and are always `edge` runtime unless they need Node (scrapers)

## EGX Market Hours
- Sunday–Thursday, 10:00–14:30 Cairo time (UTC+2, or UTC+3 in summer)
- Closed Friday & Saturday + Egyptian public holidays

## Key files
- `lib/types.ts` — shared TypeScript types
- `lib/supabase.ts` — Supabase client (server-side only)
- `lib/yahoo-finance.ts` — price & fundamentals via yahoo-finance2
- `lib/egx-scraper.ts` — fallback scraper for EGX tickers not on Yahoo
- `lib/halal-screener.ts` — AAOIFI-based screening engine
- `lib/ai.ts` — Gemini Flash wrapper
- `lib/telegram.ts` — grammY bot instance + message helpers
- `lib/news-aggregator.ts` — Arabic + English news scraping

## Environment variables (see .env.local.example)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `GEMINI_API_KEY`
- `NEWS_API_KEY`
- `ALPHA_VANTAGE_KEY`
- `CRON_SECRET` — shared secret for vercel cron job auth

## Halal screening (AAOIFI criteria)
Primary (automatic disqualify): alcohol, tobacco, pork, weapons, gambling, adult content, conventional banking/insurance
Financial ratios: total debt/market cap < 33%, interest income/revenue < 5%, receivables/assets < 33%
Cache screening results for 30 days (fundamentals change slowly)
