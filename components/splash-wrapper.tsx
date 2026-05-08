"use client";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/splash-screen";

export function SplashWrapper() {
  // null = not yet determined (SSR-safe). useEffect resolves it client-side
  // so server and client both start with null → no hydration mismatch.
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    setShow(!sessionStorage.getItem("hayati_splash_shown"));
  }, []);

  if (!show) return null;
  return <SplashScreen onComplete={() => setShow(false)} />;
}
