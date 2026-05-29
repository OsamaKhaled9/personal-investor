"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { HeaderCard, computeDailyGoal } from "@/components/quran/header-card";
import { StatsRow } from "@/components/quran/stats-row";
import { PositionCard } from "@/components/quran/position-card";
import { KhatmaSection } from "@/components/quran/khatma-section";
import { ReaderOverlay } from "@/components/quran/reader/reader-overlay";
import type {
  SessionApiResponse,
  KhatmaApiResponse,
  ReadingSession,
} from "@/lib/types";

const STAR_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'>
  <polygon points='20,2 24,16 38,16 27,25 31,38 20,30 9,38 13,25 2,16 16,16' fill='currentColor'/>
</svg>`;

export default function QuranPage() {
  const [sessionData, setSessionData] = useState<SessionApiResponse | null>(null);
  const [khatmaData, setKhatmaData] = useState<KhatmaApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const [readerInitialPage, setReaderInitialPage] = useState(1);

  // Single parallel fetch on mount — cancelled-flag cleanup
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/quran/sessions").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/quran/khatma").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([sessions, khatma]) => {
        if (cancelled) return;
        if (sessions) setSessionData(sessions as SessionApiResponse);
        if (khatma) setKhatmaData(khatma as KhatmaApiResponse);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // All derived values — useMemo, no raw computation in render
  const currentPosition = useMemo(
    () => sessionData?.currentPosition ?? 1,
    [sessionData]
  );

  const dailyGoal = useMemo(
    () =>
      computeDailyGoal(
        khatmaData?.active ?? null,
        sessionData?.today?.pages_read ?? 0
      ),
    [khatmaData, sessionData]
  );

  // All callbacks — useCallback, stable identity
  const handleSessionLogged = useCallback((session: ReadingSession) => {
    setSessionData((prev) =>
      prev
        ? { ...prev, today: session, currentPosition: session.to_page }
        : prev
    );
  }, []);

  const handleOpenReader = useCallback((page: number) => {
    setReaderInitialPage(page);
    setShowReader(true);
  }, []);

  const handleCloseReader = useCallback(() => {
    setShowReader(false);
  }, []);

  const handleKhatmaUpdated = useCallback(() => {
    fetch("/api/quran/khatma")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setKhatmaData(d as KhatmaApiResponse);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative space-y-5 max-w-lg">
      {/* Islamic star watermark — CSS only, fixed, pointer-events none */}
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

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1
            className="arabic-text text-3xl font-bold text-gold-gradient leading-tight"
            style={{ direction: "rtl" }}
          >
            القرآن الكريم
          </h1>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.18em] mt-0.5"
            style={{ color: "var(--foreground-muted)" }}
          >
            The Noble Quran
          </p>
        </motion.div>

        {/* ── Header card ── */}
        {loading ? (
          <Skeleton
            className="h-24 rounded-2xl"
            style={{ background: "var(--surface-elevated)" }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <HeaderCard
              streak={sessionData?.streak ?? 0}
              pagesRead={sessionData?.today?.pages_read ?? 0}
              goal={dailyGoal.goal}
              goalLabel={dailyGoal.label}
            />
          </motion.div>
        )}

        {/* ── Stats row ── */}
        {loading ? (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-16 rounded-xl"
                style={{ background: "var(--surface-elevated)" }}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <StatsRow
              totalPages={sessionData?.totalPages ?? 0}
              totalKhatmas={khatmaData?.totalKhatmas ?? 0}
              avgPerDay={sessionData?.avgPerDay ?? 0}
              bestDay={sessionData?.bestDay ?? null}
            />
          </motion.div>
        )}

        {/* ── Position card + session form ── */}
        {loading ? (
          <Skeleton
            className="h-36 rounded-2xl mt-4"
            style={{ background: "var(--surface-elevated)" }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
          >
            <PositionCard
              currentPosition={currentPosition}
              onSessionLogged={handleSessionLogged}
              onOpenReader={handleOpenReader}
            />
          </motion.div>
        )}

        {/* ── Khatma section ── */}
        {loading ? (
          <Skeleton
            className="h-32 rounded-2xl mt-4"
            style={{ background: "var(--surface-elevated)" }}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <KhatmaSection
              active={khatmaData?.active ?? null}
              history={khatmaData?.history ?? []}
              totalKhatmas={khatmaData?.totalKhatmas ?? 0}
              onUpdated={handleKhatmaUpdated}
            />
          </motion.div>
        )}
      </div>

      {/* Full-screen reader — fully unmounted on close, AnimatePresence handles slide */}
      <AnimatePresence>
        {showReader && (
          <ReaderOverlay
            key="reader"
            initialPage={readerInitialPage}
            onClose={handleCloseReader}
            onSessionLogged={handleSessionLogged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
