"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Moon, Target, Activity, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Portfolio } from "@/lib/types";

const PROTEIN_GOAL = 185;
type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const AR_SHORT: Record<PrayerName, string> = {
  Fajr: "فجر", Dhuhr: "ظهر", Asr: "عصر", Maghrib: "مغرب", Isha: "عشاء",
};

// ─── Variants ─────────────────────────────────────────────────────────────────
const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, delay } },
});
const cardContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.28 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 260, damping: 28 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hijriDate() {
  try {
    return new Intl.DateTimeFormat("en-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  } catch { return null; }
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Mesh background ──────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <motion.div className="absolute rounded-full"
        style={{ width: 580, height: 580, background: "radial-gradient(ellipse, rgba(197,160,89,0.09) 0%, transparent 65%)", filter: "blur(72px)", top: "-18%", left: "-12%" }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full"
        style={{ width: 460, height: 460, background: "radial-gradient(ellipse, rgba(55,35,90,0.16) 0%, transparent 65%)", filter: "blur(62px)", top: "8%", right: "-8%" }}
        animate={{ x: [0, -28, 10, 0], y: [0, 38, -18, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute rounded-full"
        style={{ width: 380, height: 380, background: "radial-gradient(ellipse, rgba(90,138,104,0.07) 0%, transparent 65%)", filter: "blur(80px)", bottom: "6%", left: "22%" }}
        animate={{ x: [0, 22, -12, 0], y: [0, -18, 28, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

// ─── Duotone icon ─────────────────────────────────────────────────────────────
function DuotoneIcon({ Icon, color, bg }: { Icon: LucideIcon; color: string; bg: string }) {
  return (
    <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
      <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-20">
        <Icon size={28} style={{ color }} strokeWidth={2.5} />
      </div>
      <Icon size={18} style={{ color }} strokeWidth={2} className="relative" />
    </div>
  );
}

// ─── Daily insight banner ─────────────────────────────────────────────────────
type InsightData = { text: string; accentVar: string; iconBg: string; Icon: LucideIcon };

function getInsight(prayedCount: number, proteinLogged: number): InsightData {
  if (prayedCount === 5)
    return { text: "Spiritually aligned. Focus on your Wealth pillar next.", accentVar: "var(--hayati-sage-400)", iconBg: "rgba(74,154,112,0.13)", Icon: Moon };
  const gap = PROTEIN_GOAL - proteinLogged;
  if (gap > 0)
    return { text: `${gap}g away from your ${PROTEIN_GOAL}g goal. Ready for a shake?`, accentVar: "var(--hayati-gold-300)", iconBg: "rgba(234,185,106,0.12)", Icon: Activity };
  return { text: "All goals on track today. Exceptional work.", accentVar: "var(--hayati-gold-400)", iconBg: "rgba(201,145,61,0.12)", Icon: Target };
}

function InsightBanner({ prayedCount, proteinLogged }: { prayedCount: number; proteinLogged: number }) {
  const insight = getInsight(prayedCount, proteinLogged);
  const { Icon } = insight;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.18 }}
      className="rounded-2xl border p-3 h-full"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "rgba(16,12,32,0.62)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 4px 18px -2px rgba(197,160,89,0.14), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <p className="font-mono text-[8px] tracking-[0.18em] uppercase mb-1.5" style={{ color: "var(--foreground-muted)" }}>Daily Insight</p>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: insight.iconBg }}>
          <Icon size={13} style={{ color: insight.accentVar }} />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{insight.text}</p>
      </div>
    </motion.div>
  );
}

// ─── Daily completion bar ─────────────────────────────────────────────────────
function DailyCompletionBar({ prayedCount, hasPortfolio, proteinLogged }: { prayedCount: number; hasPortfolio: boolean; proteinLogged: number }) {
  const worship = (prayedCount / 5) * 25;
  const wealth = hasPortfolio ? 25 : 0;
  const health = Math.min(proteinLogged / PROTEIN_GOAL, 1) * 25;
  const total = Math.round(worship + wealth + health);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase font-medium" style={{ color: "var(--foreground-muted)" }}>Daily Completion</span>
        <motion.span className="font-mono text-xs font-bold" style={{ color: "var(--hayati-gold-400)" }}
          key={total} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          {total}%
        </motion.span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div className="h-full rounded-full origin-left"
          style={{ background: "linear-gradient(90deg, var(--hayati-gold-600), var(--hayati-gold-400), var(--hayati-gold-300))", boxShadow: "0 0 8px rgba(201,145,61,0.55)" }}
          initial={{ scaleX: 0 }} animate={{ scaleX: total / 100 }}
          transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.6 }} />
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline() {
  const data = [62, 58, 65, 60, 70, 68, 75];
  const W = 88, H = 30;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const step = W / (data.length - 1);
  const pts = data.map((v, i) => ({ x: i * step, y: H - ((v - min) / rng) * (H - 4) - 2 }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${(pts.length - 1) * step},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id="sp-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A9A70" stopOpacity="0.3" /><stop offset="100%" stopColor="#4A9A70" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="sp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A9A70" stopOpacity="0.14" /><stop offset="100%" stopColor="#4A9A70" stopOpacity="0" />
        </linearGradient>
        <filter id="sp-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={area} fill="url(#sp-area)" />
      <motion.path d={line} fill="none" stroke="url(#sp-line)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#sp-glow)"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }} />
      <motion.circle cx={last.x} cy={last.y} r="2.5" fill="#4A9A70" filter="url(#sp-glow)"
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.8, duration: 0.3 }} />
    </svg>
  );
}

// ─── Prayer circles ───────────────────────────────────────────────────────────
function PrayerCircles({ prayedMap, loading }: { prayedMap: Record<PrayerName, boolean> | null; loading: boolean }) {
  const CIRC = 2 * Math.PI * 14;
  if (loading)
    return <div className="flex gap-2 mt-2">{PRAYER_ORDER.map(n => <Skeleton key={n} className="w-10 h-10 rounded-full" style={{ background: "var(--surface-elevated)" }} />)}</div>;
  return (
    <div className="flex gap-2 mt-2">
      {PRAYER_ORDER.map((name, idx) => {
        const done = prayedMap?.[name] ?? false;
        return (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 36 36" width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
                <motion.circle cx="18" cy="18" r="14" fill="none"
                  stroke={done ? "var(--hayati-sage-400)" : "transparent"}
                  strokeWidth="2.5" strokeDasharray={CIRC} strokeLinecap="round"
                  initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: done ? 0 : CIRC }}
                  transition={{ type: "spring", stiffness: 160, damping: 24, delay: idx * 0.06 }}
                  style={{ filter: done ? "drop-shadow(0 0 3px #4A9A70)" : "none", transition: "filter 0.4s" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="w-2 h-2 rounded-full"
                  animate={{ backgroundColor: done ? "#4A9A70" : "rgba(255,255,255,0.12)", boxShadow: done ? "0 0 6px #4A9A70" : "none" }}
                  transition={{ duration: 0.3 }} />
              </div>
            </div>
            <span className="arabic-text text-[9px] leading-none" style={{ color: done ? "var(--hayati-sage-400)" : "var(--foreground-muted)" }}>
              {AR_SHORT[name]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ghost states ─────────────────────────────────────────────────────────────
function GhostListItems() {
  return (
    <motion.div className="mt-3 space-y-2.5" initial={{ opacity: 0.3 }} whileHover={{ opacity: 0.6 }} transition={{ duration: 0.22 }}>
      {[75, 52, 64].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ border: "1.5px solid var(--border)", background: "transparent" }} />
          <div className="h-1.5 rounded-full" style={{ width: `${w}%`, background: "var(--border)", opacity: 0.7 }} />
        </div>
      ))}
    </motion.div>
  );
}

// ─── Card: Worship ────────────────────────────────────────────────────────────
function WorshipCard({ prayedMap, loading }: { prayedMap: Record<PrayerName, boolean> | null; loading: boolean }) {
  const count = prayedMap ? Object.values(prayedMap).filter(Boolean).length : 0;
  return (
    <motion.div variants={cardItem}
      whileHover={{ scale: 1.02, boxShadow: "0 16px 40px -6px rgba(90,138,104,0.32)" }}
      whileTap={{ scale: 0.98 }}
      className="order-1 md:order-1 md:col-span-1"
    >
      <Link href="/worship/prayer" className="block rounded-2xl border p-4 h-full"
        style={{
          borderColor: "rgba(90,138,104,0.20)",
          borderTopColor: "var(--hayati-sage-500)", borderTopWidth: "2px",
          background: "linear-gradient(135deg, rgba(90,138,104,0.10) 0%, rgba(16,12,32,0.74) 55%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 16px -2px rgba(90,138,104,0.15)",
        }}>
        <div className="flex items-center gap-2.5 mb-1">
          <DuotoneIcon Icon={Moon} color="var(--hayati-sage-500)" bg="rgba(90,138,104,0.14)" />
          <div className="flex-1 min-w-0">
            <p className="arabic-text text-sm font-semibold leading-none" style={{ color: "var(--hayati-sage-500)" }}>العبادة</p>
            <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5 font-medium" style={{ color: "var(--foreground-muted)" }}>Worship</p>
          </div>
          {!loading && <span className="font-mono text-sm font-bold shrink-0" style={{ color: "var(--hayati-sage-400)" }}>{count}/5</span>}
        </div>
        <PrayerCircles prayedMap={prayedMap} loading={loading} />
      </Link>
    </motion.div>
  );
}

// ─── Card: Wealth (Hero) ──────────────────────────────────────────────────────
function WealthCard({ portfolio, loading }: { portfolio: Portfolio | null; loading: boolean }) {
  return (
    <motion.div variants={cardItem}
      whileHover={{ scale: 1.02, boxShadow: "0 16px 44px -6px rgba(197,160,89,0.40)" }}
      whileTap={{ scale: 0.98 }}
      className="order-4 md:order-2 md:col-span-2"
    >
      <Link href="/wealth/portfolio" className="block rounded-2xl p-4 h-full"
        style={{
          border: "1px solid rgba(201,145,61,0.12)",
          borderTopColor: "var(--hayati-gold-400)", borderTopWidth: "2px",
          background: "rgba(16,12,32,0.62)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 4px 18px -2px rgba(197,160,89,0.15), inset 0 1px 0 rgba(201,145,61,0.08)",
        }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <DuotoneIcon Icon={TrendingUp} color="var(--hayati-gold-400)" bg="rgba(220,159,72,0.14)" />
            <div>
              <p className="arabic-text text-sm font-semibold leading-none" style={{ color: "var(--hayati-gold-400)" }}>الثروة</p>
              <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5 font-medium" style={{ color: "var(--foreground-muted)" }}>Wealth</p>
            </div>
          </div>
          <Sparkline />
        </div>
        {loading ? (
          <Skeleton className="h-8 w-36" style={{ background: "var(--surface-elevated)" }} />
        ) : portfolio ? (
          <div>
            <p className="font-mono font-bold text-2xl" style={{ color: "var(--foreground)" }}>
              {portfolio.totalValueEGP.toLocaleString("en-EG", { maximumFractionDigits: 0 })}
              <span className="text-sm ml-1.5 font-normal" style={{ color: "var(--foreground-muted)" }}>EGP</span>
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: portfolio.totalUnrealizedGainPercent >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
              {portfolio.totalUnrealizedGainPercent >= 0 ? "+" : ""}{portfolio.totalUnrealizedGainPercent.toFixed(2)}% overall
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>No holdings yet.</p>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-semibold"
              style={{ background: "rgba(201,145,61,0.10)", color: "var(--hayati-gold-400)", border: "1px solid rgba(201,145,61,0.18)" }}>
              Quick Start →
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Card: Life ───────────────────────────────────────────────────────────────
function LifeCard() {
  return (
    <motion.div variants={cardItem}
      whileHover={{ scale: 1.02, boxShadow: "0 16px 40px -6px rgba(208,112,96,0.30)" }}
      whileTap={{ scale: 0.98 }}
      className="order-3 md:order-3 md:col-span-1"
    >
      <Link href="/life/plan" className="block rounded-2xl border p-4 h-full"
        style={{
          borderColor: "rgba(208,112,96,0.18)",
          borderTopColor: "var(--hayati-terra-400)", borderTopWidth: "2px",
          background: "linear-gradient(135deg, rgba(208,112,96,0.10) 0%, rgba(16,12,32,0.74) 55%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 16px -2px rgba(208,112,96,0.15)",
        }}>
        <div className="flex items-center gap-2.5 mb-1">
          <DuotoneIcon Icon={Target} color="var(--hayati-terra-400)" bg="rgba(208,112,96,0.14)" />
          <div>
            <p className="arabic-text text-sm font-semibold leading-none" style={{ color: "var(--hayati-terra-400)" }}>الحياة</p>
            <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5 font-medium" style={{ color: "var(--foreground-muted)" }}>Life</p>
          </div>
        </div>
        <GhostListItems />
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          className="mt-3 w-full py-2 rounded-xl text-center text-xs font-mono font-semibold"
          style={{ background: "rgba(208,112,96,0.10)", color: "var(--hayati-terra-400)", border: "1px solid rgba(208,112,96,0.18)" }}>
          Quick Start →
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Card: Health (inline protein tracker) ────────────────────────────────────
function HealthCard({ proteinLogged, onAdd }: { proteinLogged: number; onAdd: (g: number) => void }) {
  const [open, setOpen] = useState(false);
  const pct = Math.min(proteinLogged / PROTEIN_GOAL, 1);
  const remaining = Math.max(PROTEIN_GOAL - proteinLogged, 0);

  return (
    <motion.div variants={cardItem}
      whileHover={{ scale: 1.015, boxShadow: "0 16px 40px -6px rgba(234,185,106,0.28)" }}
      whileTap={{ scale: 0.98 }}
      className="order-2 md:order-4 md:col-span-2"
    >
      <div className="rounded-2xl border p-4 h-full"
        style={{
          borderColor: "rgba(234,185,106,0.18)",
          borderTopColor: "var(--hayati-gold-300)", borderTopWidth: "2px",
          background: "linear-gradient(135deg, rgba(234,185,106,0.10) 0%, rgba(16,12,32,0.74) 55%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 16px -2px rgba(234,185,106,0.15)",
        }}>
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <DuotoneIcon Icon={Activity} color="var(--hayati-gold-300)" bg="rgba(234,185,106,0.14)" />
          <div className="flex-1 min-w-0">
            <p className="arabic-text text-sm font-semibold leading-none" style={{ color: "var(--hayati-gold-300)" }}>الصحة</p>
            <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5 font-medium" style={{ color: "var(--foreground-muted)" }}>Health</p>
          </div>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono"
            style={{ background: "rgba(234,185,106,0.10)", color: "var(--hayati-gold-300)", border: "1px solid rgba(234,185,106,0.20)" }}>
            <span>Goal: {PROTEIN_GOAL}g</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "inline-block" }}>▾</motion.span>
          </motion.button>
        </div>

        {/* Protein progress (always visible) */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>Protein</span>
            <span className="font-mono text-xs">
              <span className="font-bold" style={{ color: "var(--hayati-gold-400)" }}>{proteinLogged}g</span>
              <span style={{ color: "var(--foreground-muted)" }}> / {PROTEIN_GOAL}g</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div className="h-full rounded-full origin-left"
              style={{ background: "linear-gradient(90deg, var(--hayati-gold-600), var(--hayati-gold-300))", boxShadow: "0 0 8px rgba(234,185,106,0.45)" }}
              animate={{ scaleX: pct }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
          </div>
          {remaining > 0 && (
            <p className="text-[10px] font-mono" style={{ color: "var(--foreground-muted)" }}>{remaining}g remaining</p>
          )}
        </div>

        {/* Quick-add panel (slide-down) */}
        <AnimatePresence>
          {open && (
            <motion.div key="qa"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="overflow-hidden">
              <div className="pt-3 mt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="font-mono text-[9px] tracking-[0.14em] uppercase mb-2 font-medium" style={{ color: "var(--foreground-muted)" }}>Quick add</p>
                <div className="flex gap-2">
                  {[30, 50, 70].map(g => (
                    <motion.button key={g} whileTap={{ scale: 0.88 }} onClick={() => onAdd(g)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-mono font-bold"
                      style={{ background: "rgba(234,185,106,0.10)", color: "var(--hayati-gold-300)", border: "1px solid rgba(234,185,106,0.20)" }}>
                      +{g}g
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer row */}
        {!open && (
          <div className="flex items-center justify-between mt-3">
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
              style={{ background: "rgba(234,185,106,0.09)", color: "var(--hayati-gold-400)", border: "1px solid rgba(234,185,106,0.16)" }}>
              + Log protein
            </motion.button>
            <Link href="/health/fitness" className="text-xs font-mono" style={{ color: "var(--foreground-muted)" }}>
              View all →
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Hub Page ─────────────────────────────────────────────────────────────────
export default function HubPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [prayedMap, setPrayedMap] = useState<Record<PrayerName, boolean> | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [proteinLogged, setProteinLogged] = useState(() => {
    if (typeof window === "undefined") return 0;
    const key = `hayati_protein_${new Date().toLocaleDateString("en-CA")}`;
    return Number(localStorage.getItem(key) ?? "0");
  });

  useEffect(() => {
    fetch("/api/portfolio")
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setPortfolio(d); }).catch(() => {})
      .finally(() => setPortfolioLoading(false));

    fetch("/api/prayer")
      .then(r => r.ok ? r.json() : null)
      .then((d: { logs: { prayer_name: PrayerName; prayed: boolean }[] } | null) => {
        if (!d) return;
        const map = { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false } as Record<PrayerName, boolean>;
        for (const log of d.logs) map[log.prayer_name] = log.prayed;
        setPrayedMap(map);
      }).catch(() => {})
      .finally(() => setPrayerLoading(false));
  }, []);

  function addProtein(g: number) {
    setProteinLogged(prev => {
      const next = Math.min(prev + g, 999);
      const key = `hayati_protein_${new Date().toLocaleDateString("en-CA")}`;
      localStorage.setItem(key, String(next));
      return next;
    });
  }

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const hijri = hijriDate();
  const greeting = getGreeting();
  const prayedCount = prayedMap ? Object.values(prayedMap).filter(Boolean).length : 0;

  return (
    <div className="relative">
      <MeshBackground />
      <div className="relative space-y-5" style={{ zIndex: 1 }}>

        {/* ── Narrative Hero ── */}
        <div className="pt-6 pb-1">
          <div className="flex items-start gap-4">
            {/* Shrunk logo + subtitle (left) */}
            <div className="shrink-0 space-y-1">
              <motion.p variants={fadeUp(0)} initial="hidden" animate="visible"
                className="font-mono text-[8px] tracking-[0.22em] uppercase font-medium"
                style={{ color: "var(--foreground-muted)" }}>
                Command Center
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, scale: 0.88, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.05 }}
                className="font-azal text-5xl text-gold-gradient leading-tight">
                حياتي
              </motion.h1>
              <motion.p variants={fadeUp(0.14)} initial="hidden" animate="visible"
                className="font-scheherazade text-base"
                style={{ color: "var(--foreground-muted)", direction: "rtl" }}>
                عِش كل لحظة بوعي
              </motion.p>
            </div>

            {/* Daily Insight (right — fills freed space) */}
            <div className="flex-1 min-w-0 pt-5">
              <InsightBanner prayedCount={prayedCount} proteinLogged={proteinLogged} />
            </div>
          </div>

          {/* Date row */}
          <motion.div variants={fadeUp(0.22)} initial="hidden" animate="visible"
            className="flex items-center gap-2.5 flex-wrap mt-3">
            <span className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>{greeting}</span>
            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>·</span>
            <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{today}</span>
            {hijri && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border"
                style={{ color: "var(--foreground-muted)", borderColor: "rgba(201,145,61,0.30)", background: "rgba(201,145,61,0.06)" }}>
                <Moon size={10} style={{ color: "var(--hayati-gold-400)" }} />{hijri}
              </span>
            )}
          </motion.div>

          {/* Completion bar */}
          <motion.div variants={fadeUp(0.30)} initial="hidden" animate="visible" className="mt-3">
            <DailyCompletionBar prayedCount={prayedCount} hasPortfolio={portfolio !== null} proteinLogged={proteinLogged} />
          </motion.div>
        </div>

        {/* ── Section label ── */}
        <motion.p variants={fadeUp(0.38)} initial="hidden" animate="visible"
          className="font-mono text-[9px] tracking-[0.22em] uppercase font-medium"
          style={{ color: "var(--foreground-muted)" }}>
          Pillars
        </motion.p>

        {/* ── Bento Grid ── */}
        <motion.div variants={cardContainer} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WorshipCard prayedMap={prayedMap} loading={prayerLoading} />
          <WealthCard portfolio={portfolio} loading={portfolioLoading} />
          <LifeCard />
          <HealthCard proteinLogged={proteinLogged} onAdd={addProtein} />
        </motion.div>

      </div>
    </div>
  );
}
