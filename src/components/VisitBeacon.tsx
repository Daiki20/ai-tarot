"use client";

import { useEffect } from "react";

// Один визит за сессию браузера. Боты без JS не считаются — так ближе к «людям».
export default function VisitBeacon() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("tv_seen")) return;
      sessionStorage.setItem("tv_seen", "1");
    } catch {
      // приватный режим — просто бьём один раз за загрузку
    }
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track");
      } else {
        fetch("/api/track", { method: "POST", keepalive: true }).catch(() => {});
      }
    } catch {
      /* no-op */
    }
  }, []);

  return null;
}
