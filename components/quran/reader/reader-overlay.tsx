"use client";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  startTransition,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ReaderHeader } from "./reader-header";
import { VerseCard } from "./verse-card";
import { PageView } from "./page-view";
import type { SlimAyah } from "./verse-card";
import type { ReadingSession } from "@/lib/types";

type TafseerAyah = { number: number; text: string };

type Props = {
  initialPage: number;
  onClose: () => void;
  onSessionLogged?: (session: ReadingSession) => void;
};

export function ReaderOverlay({ initialPage, onClose, onSessionLogged }: Props) {
  const [readerPage, setReaderPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<"verse" | "page">(() => {
    if (typeof window === "undefined") return "verse";
    return (
      (localStorage.getItem("hayati_quran_view") as "verse" | "page") ?? "verse"
    );
  });
  const [expandedTafseer, setExpandedTafseer] = useState<Set<number>>(new Set());
  const [ayahs, setAyahs] = useState<SlimAyah[] | null>(null);
  const [tafseer, setTafseer] = useState<TafseerAyah[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [loggingSession, setLoggingSession] = useState(false);

  const startPageRef = useRef(initialPage);

  // Fetch page data — debounced 300ms, sessionStorage cache
  useEffect(() => {
    let cancelled = false;
    const textKey = `hayati_quran_p_${readerPage}`;
    const tafseerKey = `hayati_quran_t_${readerPage}`;

    const cachedText = sessionStorage.getItem(textKey);
    const cachedTafseer = sessionStorage.getItem(tafseerKey);

    if (cachedText && cachedTafseer) {
      startTransition(() => {
        setAyahs(JSON.parse(cachedText) as SlimAyah[]);
        setTafseer(JSON.parse(cachedTafseer) as TafseerAyah[]);
        setLoadingPage(false);
      });
      return;
    }

    setAyahs(null);
    setLoadingPage(true);

    const id = setTimeout(() => {
      fetch(`/api/quran/page?p=${readerPage}&tafseer=1`)
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (d: { ayahs: SlimAyah[]; tafseer: TafseerAyah[] } | null) => {
            if (cancelled || !d) return;
            sessionStorage.setItem(textKey, JSON.stringify(d.ayahs));
            sessionStorage.setItem(
              tafseerKey,
              JSON.stringify(d.tafseer ?? [])
            );
            startTransition(() => {
              setAyahs(d.ayahs);
              setTafseer(d.tafseer ?? []);
            });
          }
        )
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingPage(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [readerPage]);

  // Clear expanded tafseer when page changes
  useEffect(() => {
    setExpandedTafseer(new Set());
  }, [readerPage]);

  const tafseerMap = useMemo(
    () => new Map(tafseer.map((t) => [t.number, t.text])),
    [tafseer]
  );

  const handleToggleTafseer = useCallback((num: number) => {
    setExpandedTafseer((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);

  const handleViewModeChange = useCallback((mode: "verse" | "page") => {
    setViewMode(mode);
    localStorage.setItem("hayati_quran_view", mode);
  }, []);

  const handleExit = useCallback(() => {
    if (readerPage !== startPageRef.current) {
      setShowLogPrompt(true);
    } else {
      onClose();
    }
  }, [readerPage, onClose]);

  const handleLogAndClose = useCallback(async () => {
    setLoggingSession(true);
    try {
      const res = await fetch("/api/quran/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_page: startPageRef.current,
          to_page: readerPage,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: ReadingSession };
        onSessionLogged?.(json.data);
      }
    } catch {
      // proceed to close regardless
    } finally {
      setLoggingSession(false);
      onClose();
    }
  }, [readerPage, onClose, onSessionLogged]);

  const prevPage = useCallback(
    () => setReaderPage((p) => Math.max(1, p - 1)),
    []
  );
  const nextPage = useCallback(
    () => setReaderPage((p) => Math.min(604, p + 1)),
    []
  );

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 36 }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80) handleExit();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--background)",
        willChange: "transform",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ReaderHeader
        page={readerPage}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onExit={handleExit}
      />

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {loadingPage ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-28 rounded-2xl"
                style={{ background: "var(--surface-elevated)" }}
              />
            ))}
          </div>
        ) : viewMode === "verse" ? (
          <div className="h-full overflow-y-auto px-4 py-4">
            {(ayahs ?? []).map((ayah) => (
              <VerseCard
                key={ayah.number}
                ayah={ayah}
                tafseerText={tafseerMap.get(ayah.number) ?? null}
                isExpanded={expandedTafseer.has(ayah.number)}
                onToggleTafseer={handleToggleTafseer}
              />
            ))}
          </div>
        ) : (
          <PageView
            ayahs={ayahs ?? []}
            page={readerPage}
            onPrevPage={prevPage}
            onNextPage={nextPage}
          />
        )}
      </div>

      {/* Log session prompt — slides from bottom */}
      <AnimatePresence>
        {showLogPrompt && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t p-5 space-y-4"
            style={{
              background: "var(--surface)",
              borderColor: "rgba(201,145,61,0.18)",
            }}
          >
            <p className="font-mono text-sm" style={{ color: "var(--foreground)" }}>
              You read pages {startPageRef.current}–{readerPage}. Log this session?
            </p>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogAndClose}
                disabled={loggingSession}
                className="flex-1 py-2.5 rounded-xl font-mono text-sm font-semibold"
                style={{
                  background: "rgba(201,145,61,0.12)",
                  color: "var(--hayati-gold-400)",
                  border: "1px solid rgba(201,145,61,0.22)",
                  opacity: loggingSession ? 0.6 : 1,
                }}
              >
                {loggingSession ? "Logging..." : "Yes, log it"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-mono text-sm"
                style={{
                  background: "var(--surface-elevated)",
                  color: "var(--foreground-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                Skip
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
