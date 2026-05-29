@AGENTS.md

# Hayati (حياتي) — Personal Life OS

## What this is
A personal life operating system for a Muslim man in Egypt. Five pillars: Wealth, Worship, Life, Health, Hub. Deployed as a PWA on Vercel. Zero infrastructure cost. All notifications via Telegram bot. The owner is the only user — no auth, no multi-tenancy.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties (no modules) |
| Animation | Framer Motion v12 |
| UI Components | shadcn/ui via @base-ui/react |
| Database | Supabase free tier (PostgreSQL) — `@supabase/supabase-js` |
| Charts | Recharts |
| Telegram | grammY |
| Market data | yahoo-finance2 + custom Yahoo v8 raw API |
| AI | @google/generative-ai (Gemini 2.0 Flash) |
| Hosting | Vercel (edge runtime preferred) |
| Fonts | Geist, Cairo, IBM Plex Sans/Arabic, Tajawal, Scheherazade |

### Do NOT use these (installed but unused/should be removed)
- `axios` — use native `fetch()` instead
- `date-fns` — use native `Date` + `toLocaleDateString()` instead
- `tw-animate-css` — no longer needed, Framer handles animations
- `prisma` / `@prisma/client` — NOT installed, NOT used. Use Supabase client.
- `@tanstack/react-query` — NOT installed. Use `fetch + useState + useEffect`.
- `SWR` — NOT installed.

---

## Architecture Patterns

### Server vs Client boundary
- `lib/` files are **server-only** — market data, AI, Telegram, scrapers never import client-side
- API routes live in `app/api/` — edge runtime by default, Node runtime only for scrapers/AI
- Components with `"use client"` handle all interactivity

### Data fetching (client-side)
Use `fetch + useState + useEffect` with a cancelled-flag cleanup. This is the app-wide pattern:

```typescript
const [data, setData] = useState<T | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  fetch("/api/endpoint")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (!cancelled && d) setData(d); })
    .catch(() => {})
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, []);
```

Do NOT introduce React Query, SWR, or any other data-fetching library.

### API response convention
All API routes return JSON. For mutations, use:
```typescript
return Response.json({ data, success: true });
// or on error:
return Response.json({ error: message }, { status: 500 });
```

### Supabase usage
Always use `supabaseAdmin` from `lib/supabase.ts`. There is no RLS — single service role key for all operations. Never import supabase client-side.

```typescript
import { supabaseAdmin } from "@/lib/supabase";
const { data, error } = await supabaseAdmin.from("table").select(...);
```

---

## Timezone
**All date/time logic uses Cairo timezone (Africa/Cairo).** UTC+2 standard, UTC+3 summer.

```typescript
// Today's date in Cairo
new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })
// Returns "YYYY-MM-DD" format

// Current time in minutes since midnight (Cairo)
const s = new Date().toLocaleTimeString("en-CA", {
  timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false,
});
const [h, m] = s.split(":").map(Number);
const nowMin = h * 60 + m;
```

---

## Database Tables (Supabase PostgreSQL)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `portfolio_holdings` | id, ticker, name, market (EGX/US), currency (EGP/USD), shares, avg_cost_price, manual_price, manual_price_updated_at | Manual price stale after 3 days |
| `watchlist` | id, ticker, name, market, currency, notes | |
| `alert_rules` | id, ticker, market, type (price_above/price_below/percent_change), threshold, active, triggered_at | |
| `prayer_logs` | prayer_date (date), prayer_name (Fajr/Dhuhr/Asr/Maghrib/Isha), prayed (boolean) | Unique on (prayer_date, prayer_name) |
| `prayer_reminders` | id, reminder_date (date), prayer_name, sent_at | Unique on (reminder_date, prayer_name) — dedup for cron |
| `quran_progress` | log_date (date, unique), pages_read (int), juz (int?), notes (text?) | Simple daily page counter |
| `halal_cache` | ticker, status, reasons[], debt_ratio, interest_income_ratio, receivables_ratio, expires_at | 30-day TTL |
| `price_snapshots` | ticker, market, trading_date, price, change_percent, currency, source | Unique on (ticker, market, trading_date) |
| `fitness_logs` | id, log_date, type, duration_min, notes | Stub — not fully built |
| `life_plans` | id, title, north_star, start_year, end_year | |
| `life_phases` | id, plan_id, label, start_year, end_year, description, emoji, color | FK → life_plans |
| `milestones` | id, plan_id, year, category, text, completed, completed_at, order | FK → life_plans |
| `goals` | id, title, description, category, target_date, progress, status | |
| `news_cache` | id, title, summary, url, source, language, published_at, related_tickers[], sentiment, urgency | |

---

## CSS / Styling Patterns

**All styling = Tailwind v4 utility classes + inline `style={}` props for dynamic values.**
No CSS modules. No `@apply`. No styled-components.

### When to use Tailwind classes vs inline styles
- Static layout, spacing, typography → Tailwind: `flex`, `gap-4`, `rounded-xl`, `font-mono`
- Dynamic values that depend on state or CSS variables → inline `style={{}}`
- Gradients always inline (Tailwind can't express them cleanly)
- Border colors with CSS variables inline: `style={{ borderColor: "rgba(201,145,61,0.25)" }}`

### CSS variables (semantic tokens)
Defined in `app/globals.css`. Light mode = `:root`, dark = `html.dark`.

```
--background          Page background
--surface             Card / panel background
--surface-elevated    Input, hover state, skeleton
--border              Default border color
--foreground          Primary text
--foreground-muted    Secondary text / labels
--accent-green        Success / prayed / positive → var(--hayati-sage-500) light, var(--hayati-sage-400) dark
--accent-gold         Brand / interactive → var(--hayati-gold-500) light, var(--hayati-gold-400) dark
--accent-red          Error / negative
--hayati-gold-*       50–900 gold scale
--hayati-night-*      50–900 violet-black scale
--hayati-sand-*       50–900 warm neutral scale
--hayati-sage-*       50–900 green scale
--hayati-terra-*      50–900 terracotta scale
--shadow-xs/sm/md/lg  Warm-tinted shadows
--shadow-gold         Gold glow shadow
```

### Key class utilities
```typescript
"arabic-text"     // font-family: Tajawal, Cairo; direction: rtl; line-height: 1.7
"text-gold-gradient" // background-clip: text, gold gradient
cn()              // from lib/utils.ts — clsx + tailwind-merge
```

### PWA / iOS constraints (strictly observed)
- Max 2 concurrent `backdrop-filter: blur()` elements per page (iOS GPU limit)
- Animate only GPU-accelerated properties: `opacity`, `transform` (`scale`, `translateX/Y`, `rotate`)
- Never animate `height`, `width`, `margin`, `padding`, `filter` directly — use scale/clip instead
- All `setInterval`/`setTimeout` in `useEffect` must have cleanup: `return () => clearInterval(id)`
- `useEffect` deps must be stable — no inline object/function literals in dep arrays

---

## Framer Motion Patterns

### Standard entry animations
```typescript
// Single element
<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} />

// Staggered list
const list = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } } };
<motion.ul variants={list} initial="hidden" animate="visible">
  <motion.li variants={item} />
</motion.ul>
```

### Spring configs by context
```typescript
// Checkbox / toggle (snappy)
{ type: "spring", stiffness: 500, damping: 25 }
// Card / layout (smooth)
{ type: "spring", stiffness: 260, damping: 28 }
// Progress bar (deliberate)
{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }
// Nav pill (subtle)
{ type: "spring", bounce: 0.2, duration: 0.4 }
```

### AnimatePresence
```typescript
// Exit animations require wrapping in AnimatePresence
<AnimatePresence mode="wait">
  <motion.div key={uniqueKey} initial={...} animate={...} exit={...} />
</AnimatePresence>

// Height collapse (accordion / collapsible)
<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden" />
```

### Infinite animations (use with care — GPU only)
```typescript
// Breathing glow (opacity pulse) — use on background/glow divs, NOT on content
animate={{ opacity: [0.5, 1, 0.5] }}
transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}

// boxShadow pulse (GPU-composited)
animate={{ boxShadow: ["0 0 0px rgba(...,0)", "0 0 22px rgba(...,0.22)", "0 0 0px rgba(...,0)"] }}
transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
```

### Critical: Framer cannot animate CSS keywords
```typescript
// WRONG — causes runtime warning and broken animation
animate={{ backgroundColor: "transparent" }}
// CORRECT
animate={{ backgroundColor: "rgba(0,0,0,0)" }}
```

### CSS keyframes for breathing animations on cards
When a card needs a breathing border glow, use the CSS class `.prayer-card-next` (defined in globals.css) rather than a Framer Infinity loop on boxShadow — avoids conflicts with Framer's inline style system.

---

## Component Patterns

### Loading skeletons
```typescript
<Skeleton className="h-16 rounded-xl" style={{ background: "var(--surface-elevated)" }} />
```

### Error / empty states
```typescript
<div className="rounded-xl border border-dashed p-12 text-center"
  style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
  <p style={{ color: "var(--foreground-muted)" }}>Message here.</p>
</div>
```

### Optimistic updates pattern
```typescript
// 1. Update local state immediately
setState(prev => ({ ...prev, field: newValue }));
// 2. Call API
try {
  const res = await fetch(...);
  if (!res.ok) throw new Error();
} catch {
  // 3. Revert on failure
  setState(prev => ({ ...prev, field: originalValue }));
}
```

---

## Route Structure

```
app/
├── page.tsx                    Hub dashboard (5-pillar overview)
├── landing/page.tsx            Marketing landing page
├── wealth/
│   ├── page.tsx                Redirect → /wealth/portfolio
│   ├── portfolio/page.tsx      Holdings + P&L dashboard
│   ├── market/page.tsx         EGX + US halal screener
│   ├── stock/[ticker]/page.tsx Stock detail + AI analysis
│   ├── watchlist/page.tsx      Watchlist management
│   ├── chat/page.tsx           AI investment chat
│   └── alerts/page.tsx         Price alert rules
├── worship/
│   ├── layout.tsx              Sub-nav: Prayer | Quran
│   ├── page.tsx                Redirect → /worship/prayer
│   ├── prayer/page.tsx         5-prayer daily tracker + tasbih + sunnah
│   └── quran/page.tsx          Simple page counter + streak (being replaced)
├── life/
│   ├── layout.tsx              Sub-nav: Plan | Reminders | Calendar
│   ├── plan/page.tsx           Life plan with phases + milestones
│   ├── reminders/page.tsx      Daily reminders
│   └── calendar/page.tsx       Calendar (stub)
├── health/
│   └── fitness/page.tsx        Fitness log (stub)
└── api/
    ├── prayer/route.ts         Prayer times + logs + 7-day history
    ├── quran/route.ts          Daily page log + streak
    ├── quran/page/route.ts     Proxy to alquran.cloud for verse preview
    ├── portfolio/route.ts      Holdings CRUD + live prices
    ├── watchlist/route.ts      Watchlist CRUD
    ├── halal/route.ts          Halal screening (cached)
    ├── alerts/route.ts         Alert rules CRUD + evaluation
    ├── market/egx/route.ts     EGX quotes
    ├── market/us/list/route.ts US quotes
    ├── price-history/route.ts  Historical chart data
    ├── ai/analyze/route.ts     Stock AI analysis
    ├── ai/chat/route.ts        Investment AI chat
    ├── news/route.ts           Cached news
    └── cron/
        ├── morning-brief/      Daily portfolio + news Telegram message
        ├── prayer-brief/       Daily prayer times Telegram
        ├── prayer-reminder/    30-min before prayer Telegram (*/30 * * * *)
        ├── quran-reminder/     Nudge if no reading in 2 days (0 17 * * *)
        ├── quran-verse/        Daily random verse Telegram (0 12 * * *)
        ├── snapshot-prices/    Daily price cache
        └── stale-prices/       Mark stale manual prices
```

---

## Key Business Rules

### Halal screening (AAOIFI)
- Auto-disqualify: alcohol, tobacco, weapons, conventional banking/insurance, gambling, adult content
- Financial: debt/mcap < 33%, interest/revenue < 5%, receivables/assets < 33%
- Cache results 30 days. Status: `"halal" | "questionable" | "haram" | "unknown"`

### Prayer tracking
- 5 prayers: Fajr, Dhuhr, Asr, Maghrib, Isha
- Source: Aladhan API, method 5 (Egyptian General Authority), Cairo timezone
- Streak: consecutive days with ≥1 prayer logged. Counts from yesterday if today not yet logged.
- 30-min-before Telegram reminders via `prayer_reminders` table dedup

### Quran tracking (current — simple)
- 604 pages total, 30 Juz
- Page → Juz: `Math.min(30, Math.max(1, Math.ceil((page / 604) * 30)))`
- Streak: consecutive days with `pages_read > 0`
- One log entry per day (upsert on `log_date`)

### Portfolio
- P&L: `unrealizedGain = (currentPrice - avgCostPrice) * shares`
- Price fallback: live Yahoo → manual price (stale > 3 days) → avg_cost_price
- USD/EGP rate: live USDEGP=X ticker, fallback 50
- EGX tickers use `.CA` suffix on Yahoo Finance

### EGX market hours
- Sunday–Thursday, 10:00–14:30 Cairo time (closed Fri/Sat + Egyptian holidays)

---

## Currently In Progress / Planned

| Feature | Status |
|---------|--------|
| Quran tracker (full Surah/Khatma) | Planning — replacing /worship/quran |
| Fitness tracker | Stub — not built |
| Health cron (weekly brief) | Not built |
| Google Calendar sync | Not built |
| Life reminders (Telegram) | Not built |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
GEMINI_API_KEY
NEWS_API_KEY
ALPHA_VANTAGE_KEY
CRON_SECRET                     — shared secret for all cron routes (Bearer token)
```

---

## Files Every Session Should Know

| File | Why it matters |
|------|----------------|
| `lib/types.ts` | All shared TS types — check before defining new ones |
| `lib/supabase.ts` | Single DB client — always import `supabaseAdmin` from here |
| `lib/utils.ts` | `cn()` helper — use for all className merging |
| `app/globals.css` | All CSS variables, keyframes, utility classes |
| `components/ui/skeleton.tsx` | Loading placeholder |
| `components/nav-bar.tsx` | Navigation — sub-navs live in each layout.tsx |
| `vercel.json` | Cron job schedules — add new crons here |
