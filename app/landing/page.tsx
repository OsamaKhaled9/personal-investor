"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Moon, TrendingUp, Target, Activity, Share, Plus, ChevronDown } from "lucide-react";

// ─── Brand constants ───────────────────────────────────────────────────────────
const G = "#C9913D";       // Hayati Gold
const GL = "#E4B96A";      // Gold light
const N = "#17102B";       // Midnight Oud
const P = "#F3EAD8";       // Parchment
const S = "#A09280";       // Sand

// ─── Section shell — full-bleed background inside any container ───────────────
function Section({
  children,
  bg,
  id,
  className = "",
  style,
  ref,
}: {
  children: React.ReactNode;
  bg: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section id={id} className={`relative ${className}`} style={style} ref={ref}>
      {/* Background bleeds past the container using absolute positioning */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          left: "50%",
          width: "100vw",
          transform: "translateX(-50%)",
          background: bg,
        }}
      />
      {children}
    </section>
  );
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <Section
      bg={N}
      className="min-h-[100dvh] flex flex-col overflow-hidden"
    >
      {/* Background imagery */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 w-screen"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        >
          <Image
            src="/logo.png"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.22, mixBlendMode: "luminosity" }}
            priority
          />
        </div>
        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${N} 0%, ${N}cc 35%, transparent 100%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${N}88 0%, transparent 25%, ${N}bb 75%, ${N} 100%)`,
          }}
        />
        {/* Gold glow */}
        <div
          className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full -z-10 blur-[120px] opacity-20"
          style={{ background: G }}
        />
      </div>

      {/* Content — RTL, anchored right */}
      <div
        dir="rtl"
        className="relative z-10 flex-1 flex items-center justify-end"
      >
        <div className="w-full max-w-2xl px-6 md:px-0 py-24 md:py-32 text-right">

          {/* App icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="mb-8 flex justify-end"
          >
            <Image
              src="/smalllogo.png"
              alt="Hayati icon"
              width={76}
              height={76}
              className="rounded-[22px]"
              style={{ boxShadow: `0 8px 40px rgba(201,145,61,0.5)` }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial={{ opacity: 0, x: 56 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.0, 0.0, 0.2, 1] }}
            style={{
              fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
              fontSize: "clamp(5rem, 14vw, 9rem)",
              fontWeight: 900,
              color: G,
              lineHeight: 1,
              textShadow: `0 0 100px rgba(201,145,61,0.25)`,
            }}
          >
            حياتي
          </motion.h1>

          {/* Latin label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.35 }}
            className="text-xs uppercase tracking-[0.4em] mb-7 mt-2"
            style={{ color: G, fontFamily: "'Cairo', sans-serif" }}
          >
            H&nbsp;&nbsp;A&nbsp;&nbsp;Y&nbsp;&nbsp;A&nbsp;&nbsp;T&nbsp;&nbsp;I
          </motion.p>

          {/* Subheadline */}
          <motion.h2
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              fontFamily: "var(--font-cairo), sans-serif",
              fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
              fontWeight: 600,
              color: P,
              lineHeight: 1.85,
            }}
            className="mb-3"
          >
            عِش كل لحظة بوعي
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.52 }}
            style={{
              fontFamily: "var(--font-cairo), sans-serif",
              fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
              color: S,
              lineHeight: 2.0,
              maxWidth: 480,
              marginRight: 0,
              marginLeft: "auto",
            }}
            className="mb-10"
          >
            رفيقك الذكي للعبادة والثروة والصحة وتخطيط الحياة. في تطبيق واحد مصمم بأصالة للعالم العربي.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.68 }}
            className="flex flex-wrap gap-3 justify-end"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${G}, ${GL})`,
                color: N,
                fontFamily: "var(--font-cairo), sans-serif",
                fontSize: "1.05rem",
                padding: "0.875rem 2rem",
                boxShadow: `0 4px 28px rgba(201,145,61,0.45)`,
              }}
            >
              ابدأ رحلتك
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl font-medium transition-all hover:bg-white/10"
              style={{
                border: `1.5px solid rgba(201,145,61,0.3)`,
                color: P,
                fontFamily: "var(--font-cairo), sans-serif",
                fontSize: "1.05rem",
                padding: "0.875rem 2rem",
              }}
            >
              اكتشف المزيد
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="relative z-10 flex justify-center pb-8"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      >
        <ChevronDown size={26} style={{ color: `${G}66` }} />
      </motion.div>
    </Section>
  );
}

// ─── PILLARS ───────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    href: "/worship",
    arabic: "العبادة",
    english: "Worship",
    icon: Moon,
    color: "#5A8A68",
    desc: "تتبع الصلوات وأوقات الأذان وتلاوة القرآن بيومياتك الروحية.",
  },
  {
    href: "/wealth/portfolio",
    arabic: "الثروة",
    english: "Wealth",
    icon: TrendingUp,
    color: G,
    desc: "محفظة حلال في البورصة المصرية وأسواق الولايات المتحدة مع تحليل ذكاء اصطناعي.",
  },
  {
    href: "/life/plan",
    arabic: "الحياة",
    english: "Life",
    icon: Target,
    color: "#BC8CFF",
    desc: "جدول أهدافك اليومية وذكرياتك وخطة حياتك في مكان واحد.",
  },
  {
    href: "/health/fitness",
    arabic: "الصحة",
    english: "Health",
    icon: Activity,
    color: "#F85149",
    desc: "تتبع لياقتك وعاداتك الصحية مع مؤشرات تقدم مرئية.",
  },
];

function PillarsSection() {
  return (
    <Section id="features" bg="#09070F" className="py-24">
      <div dir="rtl" className="space-y-14">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p
            className="text-xs uppercase tracking-[0.35em] mb-3"
            style={{ color: G, fontFamily: "'Cairo', sans-serif" }}
          >
            الأركان الأربعة
          </p>
          <h2
            style={{
              fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: P,
              lineHeight: 1.4,
            }}
          >
            حياة متكاملة في تطبيق واحد
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.href}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={p.href}
                className="group flex flex-col h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderTopColor: p.color,
                  borderTopWidth: "2px",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
                  style={{ background: `${p.color}1A` }}
                >
                  <p.icon size={19} style={{ color: p.color }} />
                </div>
                <p
                  className="font-bold text-2xl mb-0.5"
                  style={{ fontFamily: "var(--font-cairo), sans-serif", color: P }}
                >
                  {p.arabic}
                </p>
                <p
                  className="text-[10px] uppercase tracking-[0.25em] mb-3"
                  style={{ color: p.color }}
                >
                  {p.english}
                </p>
                <p
                  className="text-sm leading-[1.9]"
                  style={{ color: S, fontFamily: "'Cairo', sans-serif" }}
                >
                  {p.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── HABIT HEATMAP ─────────────────────────────────────────────────────────────
const HEATMAP_COLORS = [
  "transparent",
  "rgba(201,145,61,0.18)",
  "rgba(201,145,61,0.40)",
  "rgba(201,145,61,0.68)",
  "#C9913D",
];

function HabitHeatmap({ colorOverride }: { colorOverride?: string[] }) {
  const WEEKS = 13;
  const DAYS = 7;
  const colors = colorOverride ?? HEATMAP_COLORS;

  const val = (w: number, d: number) => {
    const n = (w * 13 + d * 7 + 17) % 100;
    const r = (w + 1) / WEEKS;
    if (n < r * 50) return (n % 4) + 1;
    if (n < r * 72) return (n % 2) + 1;
    return 0;
  };

  return (
    <div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} className="flex gap-1">
            {Array.from({ length: DAYS }, (_, d) => (
              <motion.div
                key={d}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (w * DAYS + d) * 0.003, duration: 0.25 }}
                className="h-[14px] flex-1 min-w-0 rounded-[3px]"
                style={{
                  background: colors[val(w, d)] ?? colors[0],
                  border: "1px solid rgba(201,145,61,0.10)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end" dir="ltr">
        <span style={{ fontSize: "10px", color: S }}>less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div
            key={v}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{
              background: colors[v] ?? colors[0],
              border: "1px solid rgba(201,145,61,0.12)",
            }}
          />
        ))}
        <span style={{ fontSize: "10px", color: S }}>more</span>
      </div>
    </div>
  );
}

// ─── SCHEDULE PREVIEW ──────────────────────────────────────────────────────────
const EVENTS = [
  { time: "05:30", label: "صلاة الفجر",         color: "#5A8A68", bar: "42%" },
  { time: "08:00", label: "روتين الصباح",        color: "#58A6FF", bar: "58%" },
  { time: "09:30", label: "اجتماع العمل",         color: G,         bar: "62%" },
  { time: "12:15", label: "صلاة الظهر",          color: "#5A8A68", bar: "38%" },
  { time: "15:00", label: "مراجعة المحفظة",       color: "#D29922", bar: "50%" },
  { time: "18:00", label: "صلاة المغرب",          color: "#5A8A68", bar: "40%" },
  { time: "20:00", label: "قراءة القرآن",         color: "#BC8CFF", bar: "48%" },
];

function SchedulePreview() {
  return (
    <div
      dir="rtl"
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          {["#F85149", "#D29922", "#3FB950"].map((c) => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-widest uppercase" style={{ color: S }}>
            الأربعاء
          </p>
          <p
            className="font-bold text-base leading-tight"
            style={{ color: P, fontFamily: "var(--font-cairo), sans-serif" }}
          >
            ٨ مايو
          </p>
        </div>
      </div>

      {/* Events */}
      <div className="p-3 space-y-2">
        {EVENTS.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-2.5"
          >
            <span
              className="text-[10px] font-mono w-9 shrink-0"
              style={{ color: `${S}88`, direction: "ltr" }}
            >
              {ev.time}
            </span>
            <div
              className="h-7 rounded-lg flex items-center px-2.5"
              style={{
                background: `${ev.color}15`,
                borderRight: `2.5px solid ${ev.color}`,
                width: ev.bar,
                minWidth: 80,
              }}
            >
              <span
                className="text-xs truncate"
                style={{ color: ev.color, fontFamily: "'Cairo', sans-serif" }}
              >
                {ev.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT DEMO ──────────────────────────────────────────────────────────────
const HABITS = [
  { label: "الصلوات الخمس",      color: "#5A8A68" },
  { label: "تلاوة القرآن",        color: "#BC8CFF" },
  { label: "التمارين الرياضية",  color: G },
];

function ProductDemoSection() {
  return (
    <Section bg="#0B0918" className="py-24">
      <div dir="rtl" className="space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ color: G }}>
            تجربة المنتج
          </p>
          <h2
            style={{
              fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              fontWeight: 900,
              color: P,
              lineHeight: 1.4,
            }}
          >
            كل يوم. كل عادة. كل هدف.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Scheduler */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="font-bold text-lg mb-1"
              style={{ fontFamily: "'Cairo', sans-serif", color: P }}
            >
              المجدول اليومي
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: S, fontFamily: "'Cairo', sans-serif", lineHeight: 1.9 }}
            >
              جدول أيامك بأسلوب احترافي مع تمييز أوقات الصلاة والأهداف.
            </p>
            <SchedulePreview />
          </motion.div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p
              className="font-bold text-lg mb-1"
              style={{ fontFamily: "'Cairo', sans-serif", color: P }}
            >
              خريطة العادات
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: S, fontFamily: "'Cairo', sans-serif", lineHeight: 1.9 }}
            >
              تتبع عاداتك بخريطة حرارية تكشف أنماط حياتك على مدار الأسابيع.
            </p>
            <div
              className="rounded-2xl p-5 space-y-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {HABITS.map((h) => (
                <div key={h.label}>
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: h.color, fontFamily: "'Cairo', sans-serif" }}
                    >
                      {h.label}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: h.color }}
                    />
                  </div>
                  <HabitHeatmap
                    colorOverride={[
                      "transparent",
                      `${h.color}22`,
                      `${h.color}44`,
                      `${h.color}77`,
                      h.color,
                    ]}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

// ─── TYPOGRAPHY SHOWCASE ───────────────────────────────────────────────────────
const SPECIMENS = [
  { word: "حياة",   meaning: "Life",  weight: "900", size: "clamp(3.5rem,8vw,5.5rem)",  font: "var(--font-azal-display),'Cairo'" },
  { word: "سلام",   meaning: "Peace", weight: "700", size: "clamp(3rem,7vw,4.5rem)",    font: "var(--font-cairo),sans-serif" },
  { word: "نور",    meaning: "Light", weight: "400", size: "clamp(2.5rem,6vw,4rem)",    font: "var(--font-cairo),sans-serif" },
  { word: "أمل",   meaning: "Hope",  weight: "300", size: "clamp(2rem,5vw,3.5rem)",    font: "var(--font-cairo),sans-serif" },
];

function TypographySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const fontWeight = useTransform(scrollYProgress, [0.05, 0.45, 0.9], [300, 900, 400]);
  const opacity    = useTransform(scrollYProgress, [0.0, 0.15, 0.85, 1.0], [0, 1, 1, 0]);

  return (
    <Section ref={ref} bg={`linear-gradient(180deg, #0B0918 0%, ${N} 100%)`} className="py-24">
      <div dir="rtl" className="space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ color: G }}>
            الهوية المرئية
          </p>
          <h2
            style={{
              fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              fontWeight: 900,
              color: P,
              lineHeight: 1.4,
            }}
          >
            خط عربي أصيل. عصري. لا مثيل له.
          </h2>
        </motion.div>

        {/* Scroll-driven weight specimen */}
        <div className="text-center overflow-hidden">
          <motion.span
            style={{ fontWeight, opacity }}
            className="block"
          >
            <span
              style={{
                fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
                fontSize: "clamp(5.5rem, 18vw, 11rem)",
                color: G,
                lineHeight: 1.05,
                display: "block",
                textShadow: `0 0 120px rgba(201,145,61,0.2)`,
              }}
            >
              حياتي
            </span>
          </motion.span>
          <p
            className="text-[10px] uppercase tracking-[0.4em] mt-3"
            style={{ color: `${G}55` }}
          >
            29LT Azel Display · Scroll-driven variable weight
          </p>
        </div>

        {/* Font specimens */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {SPECIMENS.map((s, i) => (
            <motion.div
              key={s.word}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div
                className="rounded-2xl px-4 py-6 mb-3 flex items-center justify-center"
                style={{
                  background: "rgba(201,145,61,0.05)",
                  border: "1px solid rgba(201,145,61,0.14)",
                  minHeight: 110,
                }}
              >
                <span
                  style={{
                    fontFamily: s.font,
                    fontSize: s.size,
                    fontWeight: s.weight,
                    color: P,
                    lineHeight: 1.15,
                  }}
                >
                  {s.word}
                </span>
              </div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: S, fontFamily: "'Cairo', sans-serif" }}
              >
                {s.meaning}
              </p>
              <p
                className="text-[10px] font-mono"
                style={{ color: `${G}77` }}
              >
                weight: {s.weight}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── PWA INSTALL ───────────────────────────────────────────────────────────────
const INSTALL_STEPS = [
  {
    num: "١",
    icon: Share,
    color: "#58A6FF",
    title: "اضغط أيقونة المشاركة",
    sub: "في شريط Safari أسفل الشاشة",
  },
  {
    num: "٢",
    icon: ChevronDown,
    color: G,
    title: "مرّر القائمة للأسفل",
    sub: "حتى ترى الخيارات الإضافية",
  },
  {
    num: "٣",
    icon: Plus,
    color: "#5A8A68",
    title: "«إضافة إلى الشاشة الرئيسية»",
    sub: "ثم اضغط «إضافة» للتأكيد",
  },
];

function PWASection() {
  return (
    <Section bg="#07060D" className="py-24">
      <div dir="rtl" className="max-w-3xl mx-auto space-y-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ color: G }}>
            ثبّت التطبيق
          </p>
          <h2
            style={{
              fontFamily: "var(--font-azal-display), 'Cairo', sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              fontWeight: 900,
              color: P,
              lineHeight: 1.4,
            }}
            className="mb-3"
          >
            أضف حياتي إلى شاشتك
          </h2>
          <p style={{ color: S, fontFamily: "'Cairo', sans-serif", lineHeight: 1.95 }}>
            استمتع بتجربة تطبيق حقيقي على iPhone دون متجر التطبيقات.
          </p>
        </motion.div>

        {/* Install card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl p-6 md:p-9"
          style={{
            background: "rgba(201,145,61,0.04)",
            border: "1px solid rgba(201,145,61,0.16)",
          }}
        >
          {/* App preview row */}
          <div className="flex items-center gap-4 justify-end mb-8">
            <div className="text-right">
              <p
                className="font-bold text-xl"
                style={{ color: P, fontFamily: "var(--font-cairo), sans-serif" }}
              >
                حياتي
              </p>
              <p className="text-sm" style={{ color: S, fontFamily: "'Cairo', sans-serif" }}>
                Hayati Lifestyle App
              </p>
            </div>
            <Image
              src="/smalllogo.png"
              alt="Hayati"
              width={56}
              height={56}
              className="rounded-[16px]"
              style={{ boxShadow: `0 4px 20px rgba(201,145,61,0.3)` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-5">
            {INSTALL_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex items-center gap-4"
              >
                {/* Arabic numeral badge */}
                <span
                  className="text-sm font-bold shrink-0 w-7 text-center"
                  style={{ color: `${step.color}88` }}
                >
                  {step.num}
                </span>
                {/* Content */}
                <div className="flex-1 text-right">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: P, fontFamily: "'Cairo', sans-serif" }}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs" style={{ color: S, fontFamily: "'Cairo', sans-serif" }}>
                    {step.sub}
                  </p>
                </div>
                {/* Icon chip */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${step.color}18`,
                    border: `1px solid ${step.color}35`,
                  }}
                >
                  <step.icon size={16} style={{ color: step.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${G}, ${GL})`,
              color: N,
              fontFamily: "var(--font-cairo), sans-serif",
              fontSize: "1.1rem",
              padding: "1rem 2.5rem",
              boxShadow: `0 4px 28px rgba(201,145,61,0.4)`,
            }}
          >
            افتح التطبيق الآن
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <Section
      bg={N}
      className="py-10 border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" } as React.CSSProperties}
    >
      <div
        dir="rtl"
        className="flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Image src="/smalllogo.png" alt="Hayati" width={30} height={30} className="rounded-lg" />
          <span
            className="font-bold text-lg"
            style={{ fontFamily: "var(--font-cairo), sans-serif", color: G }}
          >
            حياتي
          </span>
        </div>
        <p className="text-sm" style={{ color: S, fontFamily: "'Cairo', sans-serif" }}>
          صُنع بمحبة للعالم العربي · {new Date().getFullYear()}
        </p>
        <p className="text-xs font-mono" style={{ color: `${S}55` }}>
          v1.0 · PWA · Next.js
        </p>
      </div>
    </Section>
  );
}

// ─── PAGE ROOT ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    // Break out of the root layout's container padding
    <div className="-mx-4 -mt-6 -mb-24 md:-mb-6" style={{ overflowX: "clip" }}>
      <HeroSection />
      <PillarsSection />
      <ProductDemoSection />
      <TypographySection />
      <PWASection />
      <Footer />
    </div>
  );
}
