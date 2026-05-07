"use client";
import { useEffect, useRef, useState } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const startY = useRef(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
    };
    const onTouchEnd = async (e: TouchEvent) => {
      if (refreshing) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      const atTop = window.scrollY === 0;
      if (atTop && delta > 72) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, refreshing]);

  return refreshing;
}
