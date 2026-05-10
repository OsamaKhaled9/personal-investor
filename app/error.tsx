"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const payload = {
      type: "render-error",
      message: error.message,
      digest: error.digest ?? null,
      stack: error.stack?.slice(0, 600) ?? null,
      url: window.location.href,
      ua: navigator.userAgent.slice(0, 120),
      ts: new Date().toISOString(),
    };

    // Appears in Vercel Function logs
    console.error("[HAYATI:CLIENT_ERROR]", JSON.stringify(payload));

    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6 text-center"
    >
      <p className="font-azal text-5xl text-gold-gradient">خطأ</p>
      <p className="text-sm max-w-xs" style={{ color: "var(--foreground-muted)" }}>
        Something went wrong. The error has been logged.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px]" style={{ color: "var(--foreground-subtle)" }}>
          ref: {error.digest}
        </p>
      )}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={reset}
        className="px-5 py-2 rounded-xl text-sm font-mono font-medium"
        style={{
          background: "rgba(201,145,61,0.10)",
          color: "var(--hayati-gold-400)",
          border: "1px solid rgba(201,145,61,0.20)",
        }}
      >
        Try again
      </motion.button>
    </motion.div>
  );
}
