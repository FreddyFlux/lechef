"use client";

import { useState, useEffect, useRef } from "react";

interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>;
}

interface WakeLock {
  request(type: "screen"): Promise<WakeLockSentinel>;
}

interface NavigatorWithWakeLock extends Navigator {
  wakeLock?: WakeLock;
}

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    const nav = navigator as NavigatorWithWakeLock;
    if ("wakeLock" in nav) {
      setIsSupported(true);
    }

    // Cleanup: release wake lock when component unmounts
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported) {
      setError("Wake Lock API is not supported on this device/browser");
      return false;
    }

    try {
      const nav = navigator as NavigatorWithWakeLock;
      const sentinel = await nav.wakeLock!.request("screen");
      wakeLockRef.current = sentinel;
      setIsActive(true);
      setError(null);

      // Handle when wake lock is released (e.g., user switches tabs)
      sentinel.addEventListener("release", () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to activate wake lock";
      setError(errorMessage);
      setIsActive(false);
      return false;
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to release wake lock";
        setError(errorMessage);
      }
    }
  };

  return {
    isSupported,
    isActive,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}

