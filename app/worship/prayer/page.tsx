"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PrayerCard } from "@/components/prayer-card";
import { Skeleton } from "@/components/ui/skeleton";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

type PrayerLog = { prayer_name: PrayerName; prayed: boolean };

type ApiResponse = {
  times: Record<PrayerName, string>;
  logs: PrayerLog[];
  date: string;
};

const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const AR: Record<PrayerName, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

function getNextPrayer(times: Record<PrayerName, string>): PrayerName | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_ORDER) {
    const [h, m] = times[name].split(":").map(Number);
    if (h * 60 + m > nowMinutes) return name;
  }
  return null;
}

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

  useEffect(() => {
    fetch("/api/prayer")
      .then((r) => r.ok ? r.json() : null)
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

  const prayedCount = Object.values(prayed).filter(Boolean).length;
  const nextPrayer = data ? getNextPrayer(data.times) : null;

  return (
    <div className="space-y-6 max-w-lg">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Prayer</h1>
        {loading ? (
          <Skeleton className="h-5 w-32 bg-surface-elevated" />
        ) : (
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            {prayedCount} / 5 prayers today
          </p>
        )}
      </motion.div>

      {/* Progress bar */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--surface-elevated)" }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: prayedCount / 5 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
            className="h-full rounded-full origin-left"
            style={{ background: "var(--accent-green)" }}
          />
        </motion.div>
      )}

      {/* Prayer list */}
      {loading ? (
        <div className="space-y-3">
          {PRAYER_ORDER.map((name) => (
            <Skeleton key={name} className="h-16 rounded-xl bg-surface-elevated" />
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
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {PRAYER_ORDER.map((name) => (
            <motion.div key={name} variants={itemVariants}>
              <PrayerCard
                name={name}
                arabicName={AR[name]}
                time={data.times[name]}
                prayed={prayed[name]}
                isNext={nextPrayer === name}
                onToggle={() => toggle(name)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
