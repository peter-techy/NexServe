"use client";

import * as React from "react";

export function ShutdownTracker({ isCheckedIn }: { isCheckedIn: boolean }) {
  React.useEffect(() => {
    if (!isCheckedIn) return;

    // 1. Periodic presence heartbeat (every 30 seconds)
    const sendHeartbeat = () => {
      fetch("/api/attendance/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30_000);

    // 2. Browser unload & system shutdown detection
    const handleShutdown = () => {
      const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: "system_shutdown_or_window_close",
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/attendance/checkout", blob);
      } else {
        fetch("/api/attendance/checkout", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handleShutdown);
    window.addEventListener("beforeunload", handleShutdown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handleShutdown);
      window.removeEventListener("beforeunload", handleShutdown);
    };
  }, [isCheckedIn]);

  return null;
}
