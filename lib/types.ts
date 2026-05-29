export type HalalStatus = "halal" | "questionable" | "haram" | "unknown";
export type Market = "EGX" | "US";
export type Currency = "EGP" | "USD";

export interface HalalScreenResult {
  status: HalalStatus;
  reasons: string[];
  debtRatio?: number;
  interestIncomeRatio?: number;
  receivablesRatio?: number;
  checkedAt: string;
}

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  currency: Currency;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  high52w?: number;
  low52w?: number;
  market: Market;
  halal?: HalalScreenResult;
  lastUpdated: string;
}

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  shares: number;
  avgCostPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  halal?: HalalScreenResult;
  priceSource?: "live" | "manual";
  manualPriceUpdatedAt?: string;
  isPriceStale?: boolean;
}

export interface Portfolio {
  holdings: Holding[];
  totalValueEGP: number;
  totalCostEGP: number;
  totalUnrealizedGainEGP: number;
  totalUnrealizedGainPercent: number;
  lastUpdated: string;
}

export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  addedAt: string;
  notes?: string;
}

export interface AlertRule {
  id: string;
  ticker: string;
  market: Market;
  type: "price_above" | "price_below" | "percent_change";
  threshold: number;
  active: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  language: "ar" | "en";
  publishedAt: string;
  relatedTickers: string[];
  sentiment: "positive" | "negative" | "neutral";
  urgency: "high" | "medium" | "low";
}

export interface TechnicalSignals {
  rsi: number;
  rsiSignal: "overbought" | "oversold" | "neutral";
  macdSignal: "bullish" | "bearish" | "neutral";
  ma50Above200: boolean;
  score: number;
}

export interface StockAnalysis {
  quote: StockQuote;
  halal: HalalScreenResult;
  technical: TechnicalSignals;
  aiSummary: string;
  recommendation: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  targetPrice?: number;
  risks: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type PortfolioHoldingRow = {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  shares: number;
  avg_cost_price: number;
  manual_price: number | null;
  manual_price_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WatchlistRow = {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  notes: string | null;
  created_at: string;
};

export type AlertRuleRow = {
  id: string;
  ticker: string;
  market: Market;
  type: AlertRule["type"];
  threshold: number;
  active: boolean;
  triggered_at: string | null;
  created_at: string;
};

export type HalalCacheRow = {
  ticker: string;
  status: HalalStatus;
  reasons: string[];
  debt_ratio: number | null;
  interest_income_ratio: number | null;
  receivables_ratio: number | null;
  expires_at: string;
  created_at: string;
};

export type PriceSnapshotRow = {
  ticker: string;
  market: Market;
  trading_date: string;
  price: number;
  change_percent: number;
  currency: Currency;
  source: "yahoo" | "manual";
  created_at: string;
};

export type Category = 'career'|'finance'|'business'|'education'|'health'|'spiritual'|'family'|'travel'|'growth';

export type LifePhase = {
  id: string;
  planId: string;
  label: string;
  startYear: number;
  endYear: number;
  description?: string;
  emoji?: string;
  color?: string;
};

export type Milestone = {
  id: string;
  planId: string;
  year: number;
  category: Category;
  text: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type LifePlan = {
  id: string;
  title: string;
  northStar: string;
  startYear: number;
  endYear: number;
  phases: LifePhase[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
};

export type MilestoneUpdate = Pick<Milestone,'id'> & Partial<Milestone>;

export type Goal = {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  progress: number;
  status: 'active'|'completed'|'paused';
  createdAt: string;
};

export type PrayerLog = {
  id: string;
  prayerDate: string;
  prayerName: 'Fajr'|'Dhuhr'|'Asr'|'Maghrib'|'Isha';
  prayed: boolean;
};

export type QuranProgress = {
  id: string;
  logDate: string;
  pagesRead: number;
  juz?: number;
  notes?: string;
};

export type ReadingSession = {
  id: string;
  session_date: string;
  from_page: number;
  to_page: number;
  pages_read: number;
  notes: string | null;
  created_at: string;
};

export type Khatma = {
  id: string;
  started_at: string;
  target_date: string;
  current_page: number;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type SessionApiResponse = {
  today: ReadingSession | null;
  streak: number;
  recentDays: { date: string; pages: number }[];
  totalPages: number;
  bestDay: { date: string; pages: number } | null;
  avgPerDay: number;
  currentPosition: number | null;
};

export type KhatmaApiResponse = {
  active: Khatma | null;
  history: Khatma[];
  totalKhatmas: number;
};

export type FitnessLog = {
  id: string;
  logDate: string;
  type: string;
  durationMin?: number;
  notes?: string;
};
