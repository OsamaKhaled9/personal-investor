"use client";
import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SlimAyah = {
  number: number;
  text: string;
  surahName: string;
  surahNum: number;
  numberInSurah: number;
};

type Props = {
  ayah: SlimAyah;
  tafseerText: string | null;
  isExpanded: boolean;
  onToggleTafseer: (num: number) => void;
};

function toArabicNumeral(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function VerseCardInner({ ayah, tafseerText, isExpanded, onToggleTafseer }: Props) {
  const handleToggle = useCallback(() => {
    onToggleTafseer(ayah.number);
  }, [ayah.number, onToggleTafseer]);

  return (
    <div
      className="rounded-2xl border p-5 mb-3"
      style={{
        borderColor: "rgba(201,145,61,0.12)",
        background: "var(--surface)",
      }}
    >
      {/* Verse text with number badge */}
      <div className="relative">
        <div
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{
            background: "rgba(201,145,61,0.15)",
            color: "var(--hayati-gold-400)",
          }}
        >
          {toArabicNumeral(ayah.numberInSurah)}
        </div>
        <p
          className="font-scheherazade text-2xl text-right pr-8"
          dir="rtl"
          style={{ color: "var(--foreground)", lineHeight: 2.2 }}
        >
          {ayah.text}
        </p>
      </div>

      {/* Tafseer section */}
      {tafseerText && (
        <div
          className="mt-3 pt-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 font-mono text-[10px]"
            style={{ color: "var(--foreground-muted)" }}
          >
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ display: "inline-block", lineHeight: 1 }}
            >
              ▾
            </motion.span>
            التفسير
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="overflow-hidden"
              >
                <p
                  className="arabic-text text-sm pt-2"
                  dir="rtl"
                  style={{ color: "var(--foreground-muted)", lineHeight: 2 }}
                >
                  {tafseerText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function arePropsEqual(prev: Props, next: Props): boolean {
  return (
    prev.ayah.number === next.ayah.number &&
    prev.isExpanded === next.isExpanded
  );
}

export const VerseCard = memo(VerseCardInner, arePropsEqual);
