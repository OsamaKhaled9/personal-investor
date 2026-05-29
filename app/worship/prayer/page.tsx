"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PrayerCard } from "@/components/prayer-card";
import { Skeleton } from "@/components/ui/skeleton";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
type SunnahId = "fajr_sunnah" | "morning_adhkar" | "evening_adhkar";

type PrayerLog = { prayer_name: PrayerName; prayed: boolean };
type ApiResponse = {
  times: Record<PrayerName, string>;
  logs: PrayerLog[];
  date: string;
  recentDays?: { date: string; count: number }[];
};

const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const AR: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const PRAYER_QUOTES = [
  { ar: "الصَّلَاةُ عِمَادُ الدِّينِ", en: "Prayer is the pillar of the religion." },
  { ar: "أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ", en: "Establish prayer at the decline of the sun. (17:78)" },
  { ar: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا", en: "Indeed, prayer has been decreed upon the believers at specified times. (4:103)" },
  { ar: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", en: "Seek help through patience and prayer. (2:45)" },
  { ar: "أَوَّلُ مَا يُحَاسَبُ بِهِ الْعَبْدُ الصَّلَاةُ", en: "The first thing a servant will be held accountable for is prayer." },
  { ar: "صَلِّ قَبْلَ أَن تُصَلَّى عَلَيْكَ", en: "Pray before prayers are prayed over you." },
  { ar: "الصَّلَوَاتُ الْخَمْسُ كَفَّارَةٌ لِمَا بَيْنَهَا", en: "The five prayers are expiation for what is between them." },
  { ar: "إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنكَرِ", en: "Indeed, prayer prohibits immorality and wrongdoing. (29:45)" },
  { ar: "خَيْرُ صُفُوفِ الرِّجَالِ أَوَّلُهَا", en: "The best rows for men are the first rows." },
  { ar: "مَنْ حَافَظَ عَلَيْهَا كَانَتْ لَهُ نُورًا وَبُرْهَانًا", en: "Whoever guards it, it will be a light, a proof, and a salvation for him." },
] as const;

const SUNNAH_GOALS: { id: SunnahId; ar: string; en: string }[] = [
  { id: "fajr_sunnah", ar: "سنة الفجر", en: "Fajr Sunnah (2 rak'ahs)" },
  { id: "morning_adhkar", ar: "أذكار الصباح", en: "Morning Adhkar" },
  { id: "evening_adhkar", ar: "أذكار المساء", en: "Evening Adhkar" },
];

const TASBIH_LABELS = ["سبحان الله", "الحمد لله", "الله أكبر"];

const STAR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'>
  <polygon points='20,2 24,16 38,16 27,25 31,38 20,30 9,38 13,25 2,16 16,16' fill='currentColor'/>
</svg>`;

function getNextPrayer(times: Record<PrayerName, string>, now: Date): PrayerName | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_ORDER) {
    const [h, m] = times[name].split(":").map(Number);
    if (h * 60 + m > nowMin) return name;
  }
  return null;
}

function getCountdown(times: Record<PrayerName, string>, now: Date): { name: PrayerName; label: string } | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_ORDER) {
    const [h, m] = times[name].split(":").map(Number);
    const diff = h * 60 + m - nowMin;
    if (diff > 0) {
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return { name, label: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m` };
    }
  }
  return null;
}

// Time-aware atmosphere — CSS gradients, no images
type Atmosphere = "midnight" | "fajr" | "morning" | "dhuhr" | "asr" | "maghrib" | "isha";

function getAtmosphere(times: Record<PrayerName, string> | null, now: Date): Atmosphere {
  if (!times) return "dhuhr";
  const min = now.getHours() * 60 + now.getMinutes();
  const t = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  if (min < t(times.Fajr)) return "midnight";
  if (min < t(times.Fajr) + 90) return "fajr";
  if (min < t(times.Dhuhr)) return "morning";
  if (min < t(times.Asr)) return "dhuhr";
  if (min < t(times.Maghrib)) return "asr";
  if (min < t(times.Maghrib) + 60) return "maghrib";
  return "isha";
}

const ATMOSPHERE_BG: Record<Atmosphere, string> = {
  midnight: "radial-gradient(ellipse at 25% 15%, rgba(35,28,82,0.22) 0%, transparent 55%)",
  fajr:     "radial-gradient(ellipse at 50% 0%, rgba(201,145,61,0.14) 0%, rgba(53,45,110,0.10) 45%, transparent 70%)",
  morning:  "radial-gradient(ellipse at 80% 10%, rgba(201,145,61,0.09) 0%, transparent 50%)",
  dhuhr:    "none",
  asr:      "radial-gradient(ellipse at 70% 20%, rgba(201,145,61,0.11) 0%, transparent 55%)",
  maghrib:  "radial-gradient(ellipse at 75% 15%, rgba(192,104,88,0.18) 0%, rgba(201,145,61,0.10) 35%, transparent 65%)",
  isha:     "radial-gradient(ellipse at 30% 10%, rgba(53,45,110,0.24) 0%, rgba(23,16,43,0.15) 50%, transparent 80%)",
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function PrayerPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [prayed, setPrayed] = useState<Record<PrayerName, boolean>>({
    Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Desktop detection — single instance of Focus Vault
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Quote rotator
  const [quoteIdx, setQuoteIdx] = useState(() => new Date().getDate() % PRAYER_QUOTES.length);
  const [quoteDir, setQuoteDir] = useState(1);

  // Tasbih — persisted by day
  const todayKey = new Date().toLocaleDateString("en-CA");
  const [tasbih, setTasbih] = useState(0);
  const [showTasbih, setShowTasbih] = useState(false);

  // Sunnah goals — persisted by day
  const [sunnahDone, setSunnahDone] = useState<Record<SunnahId, boolean>>({
    fajr_sunnah: false,
    morning_adhkar: false,
    evening_adhkar: false,
  });

  // --- Effects ---
  useEffect(() => {
    fetch("/api/prayer")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiResponse | null) => {
        if (!d) return;
        setData(d);
        const map: Record<PrayerName, boolean> = {
          Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false,
        };
        for (const log of d.logs) map[log.prayer_name] = log.prayed;
        setPrayed(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteDir(1);
      setQuoteIdx((i) => (i + 1) % PRAYER_QUOTES.length);
    }, 9_000);
    return () => clearInterval(id);
  }, []);

  // Load tasbih + sunnah from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`hayati_tasbih_${todayKey}`);
    if (saved) setTasbih(Math.min(99, Number(saved)));
    const savedSunnah = localStorage.getItem(`hayati_sunnah_${todayKey}`);
    if (savedSunnah) setSunnahDone(JSON.parse(savedSunnah) as Record<SunnahId, boolean>);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    async (name: PrayerName) => {
      const next = !prayed[name];
      setPrayed((prev) => ({ ...prev, [name]: next }));
      try {
        const res = await fetch("/api/prayer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prayer_name: name, prayed: next }),
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        setPrayed((prev) => ({ ...prev, [name]: !next }));
      }
    },
    [prayed]
  );

  const incrementTasbih = useCallback(() => {
    setTasbih((n) => {
      if (n >= 99) return n;
      const next = n + 1;
      localStorage.setItem(`hayati_tasbih_${todayKey}`, String(next));
      return next;
    });
  }, [todayKey]);

  const toggleSunnah = useCallback((id: SunnahId) => {
    setSunnahDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(`hayati_sunnah_${todayKey}`, JSON.stringify(next));
      return next;
    });
  }, [todayKey]);

  // --- Derived values ---
  const prayedCount = Object.values(prayed).filter(Boolean).length;
  const nextPrayer = data ? getNextPrayer(data.times, currentTime) : null;
  const countdown = data ? getCountdown(data.times, currentTime) : null;
  const allDone = !loading && prayedCount === 5;
  const atmosphere = getAtmosphere(data?.times ?? null, currentTime);
  const atmosphereBg = ATMOSPHERE_BG[atmosphere];
  const recentDays = data?.recentDays ?? [];

  const tasbihPhase = tasbih < 33 ? 0 : tasbih < 66 ? 1 : tasbih < 99 ? 2 : 3;
  const tasbihDone = tasbih >= 99;
  const tasbihProgress = tasbihDone ? 1 : (tasbih % 33) / 33;
  const tasbihLabel = tasbihDone ? "أحسنت" : TASBIH_LABELS[tasbihPhase] ?? TASBIH_LABELS[0];

  // --- Sub-components (JSX vars to avoid double-render) ---
  const quoteCard = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative"
    >
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: "-4px",
          background: "radial-gradient(ellipse at 50% 50%, rgba(201,145,61,0.18) 0%, transparent 68%)",
          borderRadius: "20px", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0px rgba(201,145,61,0.0)",
            "0 0 22px rgba(201,145,61,0.22)",
            "0 0 0px rgba(201,145,61,0.0)",
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(201,145,61,0.22)", background: "rgba(201,145,61,0.06)" }}
      >
        <div className="flex justify-center pt-4 pb-0.5 gap-1.5">
          {["●", "◆", "●"].map((s, i) => (
            <span key={i} className="text-[6px]" style={{ color: "var(--hayati-gold-400)", opacity: 0.45 }}>{s}</span>
          ))}
        </div>
        <div className="px-5 pt-2 pb-3" style={{ minHeight: 96 }}>
          <AnimatePresence mode="wait" custom={quoteDir}>
            <motion.div
              key={quoteIdx}
              custom={quoteDir}
              initial={{ opacity: 0, y: quoteDir * 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: quoteDir * -14 }}
              transition={{ duration: 0.38, ease: "easeInOut" }}
              className="text-center"
            >
              <p
                className="arabic-text text-xl font-semibold leading-loose"
                style={{ color: "var(--hayati-gold-300)", direction: "rtl" }}
              >
                {PRAYER_QUOTES[quoteIdx].ar}
              </p>
              <p
                className="font-mono text-[10px] mt-2 leading-relaxed mx-auto"
                style={{ color: "var(--foreground-muted)", maxWidth: "28ch" }}
              >
                {PRAYER_QUOTES[quoteIdx].en}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center items-center gap-1.5 pb-3">
          {PRAYER_QUOTES.map((_, i) => (
            <button
              key={i}
              aria-label={`Quote ${i + 1}`}
              onClick={() => { setQuoteDir(i > quoteIdx ? 1 : -1); setQuoteIdx(i); }}
            >
              <motion.div
                animate={{ width: i === quoteIdx ? 14 : 5, opacity: i === quoteIdx ? 1 : 0.28 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="h-1 rounded-full"
                style={{ background: "var(--hayati-gold-400)" }}
              />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  const tasbihCard = (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "rgba(201,145,61,0.16)", background: "var(--surface)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-muted)" }}>
        Tasbih · التسبيح
      </p>
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="28" cy="28" r="22" stroke="var(--surface-elevated)" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="22"
              stroke={tasbihDone ? "var(--accent-green)" : "var(--hayati-gold-400)"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - tasbihProgress)}`}
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-sm tabular-nums" style={{ color: tasbihDone ? "var(--accent-green)" : "var(--hayati-gold-400)" }}>
              {tasbihDone ? "✓" : tasbih % 33 === 0 && tasbih > 0 ? "33" : String(tasbih % 33)}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="arabic-text text-lg font-semibold" style={{ color: tasbihDone ? "var(--accent-green)" : "var(--hayati-gold-300)" }}>
            {tasbihLabel}
          </p>
          <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            {tasbihDone ? "Complete — 99 done" : `Set ${tasbihPhase + 1}/3 · ${33 - (tasbih % 33)} remaining`}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={incrementTasbih}
          disabled={tasbihDone}
          className="w-11 h-11 rounded-full shrink-0 font-bold text-xl flex items-center justify-center"
          style={{
            background: tasbihDone ? "var(--surface-elevated)" : "rgba(201,145,61,0.12)",
            color: tasbihDone ? "var(--foreground-muted)" : "var(--hayati-gold-400)",
            border: `1px solid ${tasbihDone ? "var(--border)" : "rgba(201,145,61,0.22)"}`,
          }}
          aria-label="Count tasbih"
        >
          {tasbihDone ? "✓" : "○"}
        </motion.button>
      </div>
      {/* Phase dots */}
      <div className="flex gap-2 mt-3">
        {TASBIH_LABELS.map((label, i) => (
          <div key={i} className="flex-1">
            <div
              className="h-1 rounded-full"
              style={{
                background: tasbih >= (i + 1) * 33
                  ? "var(--accent-green)"
                  : i === tasbihPhase && !tasbihDone
                  ? "var(--hayati-gold-400)"
                  : "var(--surface-elevated)",
                transition: "background 0.3s ease",
              }}
            />
            <p className="arabic-text text-[9px] mt-1 text-center" style={{ color: "var(--foreground-muted)" }}>
              {label.split(" ")[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const sunnahCard = (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest mb-3" style={{ color: "var(--foreground-muted)" }}>
        Daily Sunnah · سنن اليوم
      </p>
      <div className="space-y-2.5">
        {SUNNAH_GOALS.map((goal) => {
          const done = sunnahDone[goal.id];
          return (
            <button
              key={goal.id}
              onClick={() => toggleSunnah(goal.id)}
              className="flex items-center gap-3 w-full text-left"
            >
              <motion.div
                animate={
                  done
                    ? { backgroundColor: "var(--accent-green)", borderColor: "var(--accent-green)" }
                    : { backgroundColor: "rgba(0,0,0,0)", borderColor: "var(--border)" }
                }
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
              >
                <motion.svg
                  animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.3 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  width="10" height="10" viewBox="0 0 12 12" fill="none"
                  stroke="white" strokeWidth="2"
                >
                  <path d="M1 6l3 3 7-6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="arabic-text text-sm" style={{ color: done ? "var(--accent-green)" : "var(--foreground)", opacity: done ? 0.7 : 1 }}>
                  {goal.ar}
                </p>
                <p className="font-mono text-[9px]" style={{ color: "var(--foreground-muted)" }}>{goal.en}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // --- 7-Day Pulse row ---
  const weeklyPulse = recentDays.length > 0 && (
    <div className="flex items-center gap-2 mt-3">
      <p className="font-mono text-[9px] uppercase tracking-widest shrink-0" style={{ color: "var(--foreground-muted)" }}>
        7d
      </p>
      <div className="flex items-center gap-1.5">
        {recentDays.map((day, i) => {
          const isToday = i === 6;
          const full = day.count === 5;
          const partial = day.count > 0 && day.count < 5;
          return (
            <div key={day.date} title={`${day.date}: ${day.count}/5`}>
              <motion.div
                animate={{
                  backgroundColor: full
                    ? "var(--hayati-gold-400)"
                    : partial
                    ? "var(--hayati-gold-700)"
                    : "var(--surface-elevated)",
                  scale: isToday ? 1.15 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="rounded-sm"
                style={{
                  width: isToday ? 14 : 12,
                  height: isToday ? 14 : 12,
                  border: isToday ? "1px solid rgba(201,145,61,0.35)" : "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative max-w-lg lg:max-w-5xl">
      {/* Fixed: geometric watermark */}
      <div
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(STAR_SVG)}")`,
          backgroundSize: "56px 56px",
          backgroundRepeat: "repeat",
          opacity: 0.035,
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          color: "var(--hayati-gold-400)",
        }}
      />
      {/* Fixed: time-aware atmosphere gradient */}
      {atmosphereBg !== "none" && (
        <div
          aria-hidden
          style={{
            background: atmosphereBg,
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            transition: "background 4s ease",
          }}
        />
      )}

      {/* Content */}
      <div className="relative lg:grid lg:grid-cols-5 lg:gap-8" style={{ zIndex: 1 }}>

        {/* ── LEFT PANE (full width mobile, 3/5 desktop) ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-0.5">Prayer</h1>
                {loading ? (
                  <Skeleton className="h-4 w-28" style={{ background: "var(--surface-elevated)" }} />
                ) : (
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    {prayedCount} / 5 prayers today
                  </p>
                )}
              </div>
              {/* Countdown banner */}
              {!loading && countdown && !allDone && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-right shrink-0"
                >
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "var(--foreground-muted)" }}>
                    Next prayer
                  </p>
                  <p className="font-mono font-bold text-base" style={{ color: "var(--hayati-gold-400)" }}>
                    {countdown.label}
                  </p>
                  <p className="arabic-text text-xs" style={{ color: "var(--foreground-muted)" }}>
                    {AR[countdown.name]}
                  </p>
                </motion.div>
              )}
              {!loading && allDone && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="arabic-text text-sm font-semibold"
                  style={{ color: "var(--hayati-sage-400)" }}
                >
                  الحمد لله
                </motion.p>
              )}
            </div>

            {/* Progress bar */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--surface-elevated)" }}
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: prayedCount / 5 }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
                  className="h-full rounded-full origin-left"
                  style={{ background: allDone ? "var(--accent-green)" : "var(--hayati-gold-400)" }}
                />
              </motion.div>
            )}

            {/* 7-Day Pulse */}
            {!loading && weeklyPulse}
          </motion.div>

          {/* Prayer list */}
          {loading ? (
            <div className="space-y-3">
              {PRAYER_ORDER.map((name) => (
                <Skeleton key={name} className="h-16 rounded-xl" style={{ background: "var(--surface-elevated)" }} />
              ))}
            </div>
          ) : !data ? (
            <div
              className="rounded-xl border border-dashed p-12 text-center"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <p style={{ color: "var(--foreground-muted)" }}>Could not load prayer times. Check your connection.</p>
            </div>
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
              {PRAYER_ORDER.map((name) => (
                <motion.div key={name} variants={itemVariants}>
                  <PrayerCard
                    name={name}
                    arabicName={AR[name]}
                    time={data.times[name]}
                    prayed={prayed[name]}
                    isNext={nextPrayer === name}
                    nextIn={nextPrayer === name && countdown ? countdown.label : undefined}
                    onToggle={() => toggle(name)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Mobile: Focus Vault inline (hidden on lg+) */}
          {!loading && !isDesktop && (
            <div className="space-y-4 pt-2">
              {quoteCard}
              {/* Tasbih collapsible on mobile */}
              <div>
                <button
                  onClick={() => setShowTasbih((v) => !v)}
                  className="w-full text-center font-mono text-[10px] mb-2"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  {showTasbih ? "Hide Tasbih ↑" : "Show Tasbih · التسبيح ↓"}
                </button>
                <AnimatePresence>
                  {showTasbih && (
                    <motion.div
                      key="tasbih"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 30 }}
                      className="overflow-hidden"
                    >
                      {tasbihCard}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {sunnahCard}
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: Focus Vault (desktop only) ── */}
        {isDesktop && (
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <p
                className="font-mono text-[9px] uppercase tracking-[0.22em]"
                style={{ color: "var(--foreground-muted)" }}
              >
                Focus Vault
              </p>
              {!loading && (
                <>
                  {quoteCard}
                  {tasbihCard}
                  {sunnahCard}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
