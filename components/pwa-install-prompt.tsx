"use client";

/**
 * PWAInstallPrompt
 *
 * iOS Safari does not fire the `beforeinstallprompt` event, so we build our own.
 * Shown once to iOS Safari users who are NOT already in standalone (installed) mode.
 * Dismissed state is persisted to localStorage and re-shown after 7 days.
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Share, ChevronDown, Plus, X } from "lucide-react";

// ─── Detection helpers ─────────────────────────────────────────────────────────

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  // Safari on iOS includes "Safari" but NOT "CriOS", "FxiOS", etc.
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  return isIOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

// ─── Brand tokens ──────────────────────────────────────────────────────────────
const G = "#C9913D";
const GL = "#E4B96A";
const N_SURFACE = "#1C1726";
const P = "#F3EAD8";
const S = "#A09280";

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: "١",
    Icon: Share,
    color: "#58A6FF",
    title: "اضغط أيقونة المشاركة",
    sub: "في شريط Safari أسفل الشاشة",
  },
  {
    num: "٢",
    Icon: ChevronDown,
    color: G,
    title: "مرّر القائمة للأسفل",
    sub: "حتى ترى الخيارات الإضافية",
  },
  {
    num: "٣",
    Icon: Plus,
    color: "#5A8A68",
    title: "«إضافة إلى الشاشة الرئيسية»",
    sub: "ثم اضغط «إضافة» للتأكيد",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) return;
    if (isStandalone()) return;

    const stored = localStorage.getItem("hayati-pwa-dismissed");
    if (stored) {
      const daysSince = (Date.now() - Number(stored)) / 86_400_000;
      if (daysSince < 7) return;
    }

    // Small delay so the page loads first
    const t = setTimeout(() => setVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem("hayati-pwa-dismissed", String(Date.now()));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Scrim */}
          <motion.div
            key="pwa-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[499]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={dismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            key="pwa-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.9 }}
            className="fixed bottom-0 inset-x-0 z-[500] rounded-t-[28px] px-5 pt-4 pb-10"
            style={{
              background: N_SURFACE,
              border: "1px solid rgba(201,145,61,0.2)",
              borderBottom: "none",
            }}
            dir="rtl"
          >
            {/* Drag handle */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />

            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="إغلاق"
              className="absolute top-5 left-5 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)", color: S }}
            >
              <X size={14} />
            </button>

            {/* App identity row */}
            <div className="flex items-center gap-3 mb-6 justify-end">
              <div className="text-right">
                <p
                  className="font-bold text-base"
                  style={{ fontFamily: "var(--font-cairo),'Cairo',sans-serif", color: P }}
                >
                  أضف حياتي
                </p>
                <p
                  className="text-xs"
                  style={{ color: S, fontFamily: "'Cairo',sans-serif" }}
                >
                  ثبّت التطبيق على شاشتك الرئيسية
                </p>
              </div>
              <Image
                src="/smalllogo.png"
                alt="Hayati"
                width={48}
                height={48}
                className="rounded-[14px]"
                style={{ boxShadow: `0 4px 16px rgba(201,145,61,0.35)` }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6">
              {STEPS.map((step) => (
                <div key={step.num} className="flex items-center gap-3">
                  {/* Icon chip */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${step.color}1A`,
                      border: `1px solid ${step.color}38`,
                    }}
                  >
                    <step.Icon size={15} style={{ color: step.color }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-right">
                    <p
                      className="text-sm font-medium"
                      style={{ color: P, fontFamily: "'Cairo',sans-serif" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs" style={{ color: S, fontFamily: "'Cairo',sans-serif" }}>
                      {step.sub}
                    </p>
                  </div>

                  {/* Arabic numeral */}
                  <span
                    className="text-sm font-bold w-5 text-center shrink-0"
                    style={{ color: `${step.color}77` }}
                  >
                    {step.num}
                  </span>
                </div>
              ))}
            </div>

            {/* Primary action */}
            <button
              onClick={dismiss}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 mb-2"
              style={{
                background: `linear-gradient(135deg, ${G}, ${GL})`,
                color: "#17102B",
                fontFamily: "'Cairo',sans-serif",
                boxShadow: `0 4px 20px rgba(201,145,61,0.35)`,
              }}
            >
              فهمت، شكراً
            </button>

            {/* Secondary dismiss */}
            <button
              onClick={dismiss}
              className="w-full py-3 rounded-2xl text-sm transition-all hover:opacity-80"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: S,
                border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "'Cairo',sans-serif",
              }}
            >
              لاحقاً
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
