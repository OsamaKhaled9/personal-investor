"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Props = { onComplete: () => void };

export function SplashScreen({ onComplete }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("hayati_splash_shown", "1");
    const t = setTimeout(() => setExiting(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 1, 1] }}
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
          style={{ background: "#08060F" }}
        >
          {/* Radial gold halo */}
          <div
            className="absolute"
            style={{
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 50% 50%, rgba(201,145,61,0.18) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative z-10"
          >
            <Image
              src="/logo.png"
              width={120}
              height={120}
              alt="Hayati"
              priority
              className="select-none"
            />
          </motion.div>

          {/* حياتي wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0, 0, 0.2, 1] }}
            className="font-azal text-4xl mt-4 relative z-10"
            style={{ color: "var(--hayati-gold-400)" }}
          >
            حياتي
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
