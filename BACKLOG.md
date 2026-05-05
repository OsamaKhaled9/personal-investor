# Personal Investor — Product Backlog

> Generated after full feature audit · Last updated: 2026-05-05  
> App is ~80% complete. All core flows are built. Remaining work is polish, bugs, and high-value additions.

---

## Current State Summary

| Area | Status | Notes |
|------|--------|-------|
| Portfolio dashboard | ✅ Built | Real-time prices, P&L, add/remove holdings |
| Market screener | ⚠️ Partial | EGX works; **US tab hardcoded to EGX endpoint (BUG)** |
| Stock detail page | ✅ Built | Price, technicals, halal, AI analysis |
| AI chat analyst | ✅ Built | Portfolio-aware Gemini Flash |
| Alerts (CRUD + eval) | ✅ Built | Price-above/below/percent, Telegram trigger |
| Halal screening | ✅ Built | AAOIFI rules, Supabase 30-day cache |
| Telegram bot | ✅ Built | 6 commands + freeform AI chat |
| Cron jobs | ✅ Built | Morning brief + weekly health check |
| News aggregation | ⚠️ Partial | Fetches articles; **sentiment hardcoded "neutral"** |
| EGX ticker list | ⚠️ Partial | Only 18 hardcoded tickers |
| Watchlist | 🔲 Not built | Types defined, no UI or API |
| Portfolio analytics | 🔲 Not built | No allocation chart, no realized P&L |
| Error handling | 🔲 Not built | Pages crash on API failure, no error boundaries |
| PWA assets | 🔲 Not built | Placeholder icons, no offline support |

---

## Epics & Backlog

---

### 🔴 EPIC 1 — Critical Bugs (Sprint 1, do first)

---

#### US-001 · Fix US Market Tab in Screener — 3 pts
**As a** user browsing US halal stocks,  
**I want** the US tab in the Market Screener to show US stocks,  
**So that** I can discover halal US equities alongside EGX.

**Root cause:** `app/market/page.tsx` line 22 — both tabs call `/api/market/egx`:
```ts
const endpoint = tab === "EGX" ? "/api/market/egx" : "/api/market/egx"; // BUG
```

**Acceptance Criteria:**
- Given I click the "US" tab, when the page loads, then it fetches `/api/market/us/list` (new endpoint)
- US stocks show ticker, name, price in USD, change %, halal badge
- Halal filter applies to US stocks (haram stocks hidden by default)
- Search works across both tabs independently

**Implementation:**
1. Create `app/api/market/us/list/route.ts` — returns a curated list of halal-screened US stocks
2. Seed with ~30 well-known halal US stocks (tech, healthcare, consumer)
3. Fix the ternary in `market/page.tsx`

**Files:** `app/market/page.tsx`, `app/api/market/us/list/route.ts`, `lib/egx-scraper.ts` (add US_HALAL_TICKERS)

---

#### US-002 · Add Error Boundaries to All Pages — 3 pts
**As a** user,  
**I expect** a helpful error message when data fails to load,  
**So that** I'm not staring at a crashed white screen.

**Root cause:** All pages (`page.tsx`) do `fetch().then().then()` with no `.catch()`. Any API failure crashes the component.

**Acceptance Criteria:**
- Given the portfolio API fails, when the dashboard loads, then a "Couldn't load portfolio — tap to retry" card appears
- Given the market API fails, when the market page loads, then a skeleton with error state shows
- All pages handle loading, error, and empty states explicitly
- Retry button re-fetches data without page reload

**Files:** `app/page.tsx`, `app/market/page.tsx`, `app/stock/[ticker]/page.tsx`, `app/chat/page.tsx`, `app/alerts/page.tsx`

---

### 🟠 EPIC 2 — Watchlist (Sprint 1–2)

---

#### US-003 · Watchlist API (CRUD) — 3 pts
**As a** user tracking stocks I don't yet own,  
**I want** to save tickers to a watchlist,  
**So that** I can monitor them without adding fake holdings to my portfolio.

**Acceptance Criteria:**
- `GET /api/watchlist` returns all watchlist items with current quotes
- `POST /api/watchlist` adds a ticker (validates it exists)
- `DELETE /api/watchlist?id=X` removes an item
- Duplicate tickers rejected with 409
- Watchlist items include: ticker, market, name, price, change %, halal status

**Files:** `app/api/watchlist/route.ts`, Supabase `watchlist` table (schema exists in `lib/types.ts`)

---

#### US-004 · Watchlist UI Page — 5 pts
**As a** user,  
**I want** a dedicated watchlist page,  
**So that** I can see all stocks I'm monitoring at a glance.

**Acceptance Criteria:**
- `/watchlist` page lists all watched stocks with price cards (same style as portfolio cards)
- "Add to Watchlist" button opens a dialog with ticker + market selector
- Each card has: name, ticker, price, change %, halal badge, "Analyze" link, "Remove" button
- Empty state: "No stocks in watchlist yet" with an Add button
- Watchlist accessible from the navigation bar

**Files:** `app/watchlist/page.tsx`, `components/nav-bar.tsx` (add link)

---

#### US-005 · "Add to Watchlist" from Stock Detail Page — 2 pts
**As a** user browsing a stock,  
**I want** to add it to my watchlist from the stock detail page,  
**So that** I don't have to navigate away to save it.

**Acceptance Criteria:**
- Stock detail page shows "Watch" button (bookmark icon) next to the ticker name
- Clicking it adds to watchlist (POST /api/watchlist), button turns filled/active
- If already watched, button is pre-filled; clicking removes it (DELETE)
- Toast notification confirms "Added to watchlist" / "Removed from watchlist"

**Files:** `app/stock/[ticker]/page.tsx`

---

### 🟠 EPIC 3 — News Sentiment Intelligence (Sprint 2)

---

#### US-006 · AI Sentiment Analysis for News Articles — 5 pts
**As a** user reading market news,  
**I want** each article to show a real sentiment (bullish/bearish/neutral),  
**So that** I can quickly gauge market mood without reading every article.

**Root cause:** `lib/news-aggregator.ts` hardcodes `sentiment: "neutral"` for all scraped articles. Only NewsAPI articles attempt sentiment — but also just use `"neutral"`.

**Acceptance Criteria:**
- When news articles are fetched and cached, each article runs through Gemini Flash for sentiment
- Gemini prompt: "Given this headline and snippet, classify sentiment as bullish/bearish/neutral and urgency as high/medium/low. Also extract Egyptian or US stock tickers mentioned."
- Batch process articles (max 5 at a time to stay within Gemini free tier)
- Sentiment shown as colored tag on news cards (green/red/gray)
- Urgency "high" articles shown at top, flagged with ⚡ icon

**Files:** `lib/news-aggregator.ts`, `lib/ai.ts` (add `analyzeNewsBatch()`)

---

#### US-007 · Smart Ticker Extraction from News — 3 pts
**As a** user,  
**I want** news articles to be correctly tagged with the stocks they mention,  
**So that** portfolio-relevant news surfaces to me automatically.

**Root cause:** `lib/news-aggregator.ts` uses naive regex against company names to extract tickers. Misses many EGX stocks and mis-tags others.

**Acceptance Criteria:**
- Gemini Flash extracts mentioned tickers as part of the sentiment analysis (US-006 batch)
- Extracted tickers matched against `EGX_KNOWN_TICKERS` and `US_HALAL_TICKERS` lists
- News articles in the portfolio dashboard only show if they mention a held ticker
- "Related stocks" tags shown on each article card

**Files:** `lib/news-aggregator.ts`, `lib/ai.ts`

---

### 🟡 EPIC 4 — Expand EGX Coverage (Sprint 2)

---

#### US-008 · Expand EGX Ticker List to 50+ Stocks — 3 pts
**As an** EGX investor,  
**I want** to see more than 18 stocks in the screener,  
**So that** I can discover opportunities beyond the top names.

**Current state:** `lib/egx-scraper.ts` has only 18 hardcoded tickers in `EGX_KNOWN_TICKERS`.

**Acceptance Criteria:**
- `EGX_KNOWN_TICKERS` expanded to 50+ tickers covering all major EGX sectors
- Each ticker verified as working with Yahoo Finance `.CA` suffix
- Sectors covered: Banking, Telecom, Real Estate, Industrials, Healthcare, Food & Beverage, Chemicals, Energy, Financial Services, Retail
- Tickers with no Yahoo data (like ESRS) flagged with `yahooFallback: false` so the meta-price fallback is used

**Files:** `lib/egx-scraper.ts`

**Research needed:** Verify which EGX tickers exist on Yahoo Finance `.CA` — test each via `curl "https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}.CA?range=5d&interval=1d"`

---

#### US-009 · EGX Market Movers (Top Gainers/Losers) — 3 pts
**As an** EGX investor,  
**I want** to see today's top gainers and losers on the market page,  
**So that** I can quickly spot momentum plays.

**Current state:** `scrapeEGXTopMovers()` exists but relies on EGX website scraping which is unreliable.

**Acceptance Criteria:**
- Market page shows "Top Gainers" and "Top Losers" tabs (or sections) populated from known tickers
- Computed server-side from the already-fetched `getMultipleQuotes()` data — no separate scraping needed
- "Movers" section shows top 5 gainers and top 5 losers sorted by `changePercent`
- Each mover card shows: ticker, name, price, change %, halal badge

**Implementation note:** Derive movers from the existing `/api/market/egx` quotes data — no fragile scraping needed.

**Files:** `app/api/market/egx/route.ts`, `app/market/page.tsx`

---

### 🟡 EPIC 5 — Portfolio Analytics (Sprint 3)

---

#### US-010 · Portfolio Allocation Chart — 5 pts
**As a** portfolio owner,  
**I want** a visual breakdown of my holdings by sector and by market (EGX/US),  
**So that** I can understand my diversification at a glance.

**Acceptance Criteria:**
- Dashboard shows a donut/pie chart of portfolio allocation by sector (e.g., Banking 40%, Real Estate 25%)
- Second chart or toggle shows allocation by market (EGX vs US)
- Chart uses Recharts (already installed)
- Hovering a segment highlights the relevant holding cards
- Empty state: "Add holdings to see allocation breakdown"

**Files:** `app/page.tsx`, `components/charts/allocation-chart.tsx` (new)

---

#### US-011 · Realized P&L Tracking — 5 pts
**As a** portfolio owner,  
**I want** to record when I sell shares and see my realized gains/losses,  
**So that** I can track my actual investment performance over time.

**Current state:** The app only tracks unrealized P&L. There is no way to record a sale.

**Acceptance Criteria:**
- "Sell" action on each holding card opens a dialog: shares to sell, sell price
- Sell creates a record in a new `transactions` Supabase table
- Portfolio dashboard shows total realized P&L alongside unrealized P&L
- Partial sell reduces holding shares (doesn't delete if remaining > 0)
- Full sell removes the holding and records final P&L

**Files:** `app/page.tsx`, `app/api/portfolio/route.ts`, Supabase schema (new `transactions` table)

**Supabase schema:**
```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  market text not null,
  shares numeric not null,
  price_per_share numeric not null,
  type text not null check (type in ('buy','sell')),
  executed_at timestamptz default now()
);
```

---

#### US-012 · Portfolio Growth Projection — 3 pts
**As an** investor,  
**I want** to see a projected value of my portfolio at different time horizons,  
**So that** I can set realistic expectations for my EGX investments.

**Acceptance Criteria:**
- Dashboard shows "Projection" card with 1y, 3y, 5y projected values
- Default assumption: EGX historical average ~15% annual return
- User can adjust the annual growth rate assumption with a slider
- Shows projected EGP value and % gain at each horizon
- Clear disclaimer: "Based on assumed annual return — not a guarantee"

**Files:** `app/page.tsx`, `components/portfolio/projection-card.tsx` (new)

---

### 🟡 EPIC 6 — Alert Enhancements (Sprint 3)

---

#### US-013 · Percent-Change Alert Evaluation Fix — 2 pts
**As a** user with a percent-change alert,  
**I want** the alert to fire when a stock moves by my threshold %,  
**So that** I'm notified about significant daily moves.

**Current state:** The alerts API (PUT `/api/alerts`) handles `price_above` and `price_below` but the `percent_change` type evaluation logic needs verification against actual current-price-vs-previous-close comparison.

**Acceptance Criteria:**
- `percent_change` alerts compare `|currentPrice - previousClose| / previousClose * 100` against threshold
- Alert fires for both positive and negative moves exceeding threshold
- Telegram message includes direction: "COMI moved +3.2% today (above your 3% alert)"
- Alert is deactivated after firing (same as other types)

**Files:** `app/api/alerts/route.ts`

---

#### US-014 · Recurring Alerts (Don't Auto-Deactivate) — 2 pts
**As a** user,  
**I want** the option to keep an alert active after it fires,  
**So that** I get notified every day a stock stays above/below my threshold.

**Acceptance Criteria:**
- Alert creation dialog has a "One-time" vs "Recurring" toggle
- Recurring alerts are NOT deactivated after firing — they re-trigger on next cron evaluation
- Telegram message includes "(recurring alert)" label
- Recurring alerts shown with a ↻ icon in the alerts list

**Files:** `app/alerts/page.tsx`, `app/api/alerts/route.ts`, Supabase `alert_rules` (add `recurring boolean default false`)

---

### 🟢 EPIC 7 — PWA & Mobile Polish (Sprint 4)

---

#### US-015 · Real PWA Icons & Manifest — 2 pts
**As a** mobile user,  
**I want** proper app icons when I install the PWA on my iPhone,  
**So that** the app looks professional on my home screen.

**Current state:** `public/icons/` has placeholder files; manifest.json references icons that don't exist.

**Acceptance Criteria:**
- App icon designed (simple "PI" monogram on dark green background)
- Icons generated at 192×192 and 512×512 PNG
- `manifest.json` correctly references icons
- `theme_color` and `background_color` match the app's color scheme
- On iOS Safari, "Add to Home Screen" installs with correct name and icon

**Files:** `public/manifest.json`, `public/icons/`

---

#### US-016 · Loading Skeleton States — 3 pts
**As a** mobile user on a slow connection,  
**I want** skeleton placeholders while data loads,  
**So that** the app feels fast and doesn't jump around.

**Current state:** Some pages show spinners; others show empty content. No consistent loading pattern.

**Acceptance Criteria:**
- Portfolio dashboard: skeleton cards while holdings load (3 placeholder cards)
- Market screener: skeleton rows while quotes load (8 placeholder rows)
- Stock detail: skeleton for price, technicals, AI analysis sections independently
- Skeleton components already exist in shadcn/ui (`<Skeleton />`) — use them consistently

**Files:** `app/page.tsx`, `app/market/page.tsx`, `app/stock/[ticker]/page.tsx`

---

#### US-017 · Pull-to-Refresh on Dashboard — 2 pts
**As a** mobile user,  
**I want** to pull down to refresh prices on the portfolio dashboard,  
**So that** I can get the latest prices without tapping any buttons.

**Acceptance Criteria:**
- Portfolio dashboard supports pull-to-refresh on touch devices
- "Last updated" timestamp shown below the portfolio summary
- Manual refresh button (↻) also available for desktop users
- Refresh triggers re-fetch of `/api/portfolio`

**Files:** `app/page.tsx`

---

### 🟢 EPIC 8 — Telegram Bot Enhancements (Sprint 4)

---

#### US-018 · `/watchlist` Telegram Command — 2 pts
**As a** user,  
**I want** to check my watchlist from Telegram,  
**So that** I can quickly scan watched stocks while on the go.

**Acceptance Criteria:**
- `/watchlist` command returns a formatted list of watchlist items with current prices
- Format: `📊 COMI — 136.00 EGP (+0.74%) ✅ Halal`
- If watchlist is empty: "Your watchlist is empty. Add stocks at [app URL]"

**Files:** `app/api/telegram/webhook/route.ts`

---

#### US-019 · `/add TICKER [MARKET]` Telegram Command — 2 pts
**As a** user,  
**I want** to add a stock to my watchlist directly from Telegram,  
**So that** I can save interesting stocks without opening the web app.

**Acceptance Criteria:**
- `/add COMI EGX` adds COMI to the watchlist via POST /api/watchlist
- `/add AAPL` (no market) defaults to US
- Confirms: "✅ COMI added to your watchlist"
- If already in watchlist: "COMI is already in your watchlist"

**Files:** `app/api/telegram/webhook/route.ts`

---

#### US-020 · `/news [TICKER]` Telegram Command — 2 pts
**As a** user,  
**I want** to get the latest news from Telegram,  
**So that** I can read market news without opening the web app.

**Acceptance Criteria:**
- `/news` returns the 3 most recent articles (headline + sentiment emoji + source)
- `/news COMI` returns articles tagged with the COMI ticker
- Sentiment emoji: 📈 bullish, 📉 bearish, ➡️ neutral
- Each article links to the original URL

**Files:** `app/api/telegram/webhook/route.ts`

---

### 🔵 EPIC 9 — Data Quality & Infrastructure (Sprint 4–5)

---

#### US-021 · Database Schema Migration for Transactions — 1 pt
**As a** developer,  
**I need** the `transactions` table in Supabase,  
**So that** realized P&L tracking (US-011) can be implemented.

**Acceptance Criteria:**
- Migration SQL written and documented in `database/` directory
- Table matches schema defined in US-011
- RLS disabled (personal app, no auth)

**Files:** `database/migrations/002_transactions.sql` (new)

---

#### US-022 · Expand US Halal Stock List — 3 pts
**As a** user browsing US stocks,  
**I want** a curated list of pre-screened halal US equities,  
**So that** I can invest in US markets without manually screening each stock.

**Acceptance Criteria:**
- `US_HALAL_TICKERS` list created in `lib/egx-scraper.ts` or new `lib/us-stocks.ts`
- ~40 well-known halal-compliant US stocks across sectors: Tech (AAPL, MSFT, GOOGL), Healthcare (JNJ, ABBV), Consumer (AMZN, NKE), Industrials (HON, CAT), Energy (clean energy only)
- Each ticker pre-tagged with sector and known halal status
- Halal status verified against the halal screener (or manually researched)
- Note: conventional banks (JPM, BAC), defense (RTX, LMT), alcohol (BUD), tobacco explicitly excluded

**Files:** `lib/us-stocks.ts` (new), `app/api/market/us/list/route.ts`

---

#### US-023 · Supabase Watchlist Table Schema — 1 pt
**As a** developer,  
**I need** the `watchlist` table in Supabase,  
**So that** the watchlist feature (US-003) can be implemented.

**Note:** `WatchlistItem` type is defined in `lib/types.ts` but the table doesn't exist in Supabase yet.

**Acceptance Criteria:**
- Migration SQL written in `database/migrations/`
- Table has: id, ticker, market, created_at
- RLS disabled

**Files:** `database/migrations/003_watchlist.sql` (new)

---

## Sprint Plan

### Sprint 1 — Foundation Fixes (2 weeks) · 16 pts

**Goal:** Fix critical bugs, add error resilience, start watchlist

| Story | Points | Priority |
|-------|--------|----------|
| US-001 Fix US Market Tab (BUG) | 3 | 🔴 Critical |
| US-002 Error Boundaries | 3 | 🔴 Critical |
| US-022 US Halal Stock List | 3 | 🟠 High |
| US-023 Watchlist DB schema | 1 | 🟠 High |
| US-003 Watchlist API | 3 | 🟠 High |
| US-004 Watchlist UI | 5 | 🟠 High |

**Stretch:** US-005 (Watch button on stock detail — 2pts)

---

### Sprint 2 — Intelligence & Coverage (2 weeks) · 19 pts

**Goal:** Real sentiment, more EGX stocks, market movers

| Story | Points | Priority |
|-------|--------|----------|
| US-005 Watch button on stock page | 2 | 🟠 High |
| US-006 AI News Sentiment | 5 | 🟠 High |
| US-007 Smart Ticker Extraction | 3 | 🟠 High |
| US-008 Expand EGX Tickers | 3 | 🟡 Medium |
| US-009 EGX Market Movers | 3 | 🟡 Medium |
| US-013 Percent-Change Alert Fix | 2 | 🟡 Medium |
| US-014 Recurring Alerts | 2 | 🟡 Medium |

---

### Sprint 3 — Portfolio Analytics (2 weeks) · 16 pts

**Goal:** Allocation charts, realized P&L, projections

| Story | Points | Priority |
|-------|--------|----------|
| US-021 Transactions DB schema | 1 | 🟡 Medium |
| US-010 Allocation Chart | 5 | 🟡 Medium |
| US-011 Realized P&L Tracking | 5 | 🟡 Medium |
| US-012 Portfolio Projection | 3 | 🟡 Medium |
| US-016 Loading Skeletons | 3 | 🟢 Low |

---

### Sprint 4 — Mobile Polish & Bot (2 weeks) · 11 pts

**Goal:** PWA quality, Telegram enhancements, UX polish

| Story | Points | Priority |
|-------|--------|----------|
| US-015 PWA Icons & Manifest | 2 | 🟢 Low |
| US-017 Pull-to-Refresh | 2 | 🟢 Low |
| US-018 /watchlist Telegram | 2 | 🟢 Low |
| US-019 /add Telegram command | 2 | 🟢 Low |
| US-020 /news Telegram command | 2 | 🟢 Low |

---

## Backlog (Unscheduled / Future)

- **Dark/Light theme toggle** — user preference persisted to localStorage
- **Portfolio CSV export** — download holdings + P&L as spreadsheet
- **Price history for holdings** — show when you bought vs where price is now on a chart
- **Multiple portfolios** — separate EGX and US portfolios
- **Stock comparison** — compare two stocks side by side
- **Telegram inline keyboard** — buttons in bot messages instead of typed commands
- **Notification preferences** — per-stock notification on/off
- **Offline mode** — PWA service worker caches last portfolio for offline viewing
- **EGX IPO tracker** — list upcoming EGX IPOs with subscription deadlines
- **Currency tracker** — USD/EGP rate widget on dashboard

---

## Definition of Done

- [ ] Feature works in browser (Chrome + iOS Safari tested)
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [ ] API route returns correct data verified manually
- [ ] Loading and error states handled
- [ ] No new console errors or warnings
- [ ] Responsive on mobile (375px viewport)

---

## Notes for Implementation

### Key File Locations
- Market data: `lib/yahoo-finance.ts` — `fetchEGXQuoteRaw()`, `getQuote()`, `getMultipleQuotes()`
- EGX tickers: `lib/egx-scraper.ts` — `EGX_KNOWN_TICKERS[]`
- Halal screening: `lib/halal-screener.ts` — `screenStock()`
- AI calls: `lib/ai.ts` — `analyzeStock()`, `chat()`, `generateMorningBrief()`
- Telegram: `lib/telegram.ts` + `app/api/telegram/webhook/route.ts`
- Supabase tables: `portfolio_holdings`, `alert_rules`, `halal_cache`, `news_cache`

### Data Flow Reminder
- EGX prices → `fetchEGXQuoteRaw(ticker)` → Yahoo Finance v8 API (raw fetch, not library)
- US prices → `yahooFinance.quote(ticker)` → yahoo-finance2 library (works fine for US)
- Halal → `screenStock(ticker, market)` → Supabase cache → yahooFinance.quoteSummary → Gemini fallback
- News → `fetchAndCacheNews()` → NewsAPI + Cheerio scraping → Supabase cache

### Free Tier Limits to Watch
| Service | Limit | Current Usage |
|---------|-------|---------------|
| Gemini Flash | 15 RPM, 1M tokens/day | ~50 req/day — fine |
| NewsAPI | 100 req/day | ~4 scrapes/day — fine |
| Supabase | 500MB DB | ~5MB — fine |
| Vercel | 100k invocations/day | ~200/day — fine |

When adding AI news sentiment (US-006): batch articles in groups of 5 to avoid Gemini rate limit.
