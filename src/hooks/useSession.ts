import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";

/**
 * Hook for managing admin session timeout
 */
export function useSessionTimeout() {
  const router = useRouter();
  const [isWarning, setIsWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let warningTimeout: number | null = null;
    let logoutTimeout: number | null = null;
    let countdownInterval: number | null = null;

    const resetTimeouts = () => {
      if (warningTimeout !== null) clearTimeout(warningTimeout);
      if (logoutTimeout !== null) clearTimeout(logoutTimeout);
      if (countdownInterval !== null) clearInterval(countdownInterval);

      setIsWarning(false);
      setTimeLeft(0);

      // Set warning timeout
      warningTimeout = window.setTimeout(() => {
        setIsWarning(true);
        setTimeLeft(Math.round((APP_CONFIG.SESSION_TIMEOUT_MS - APP_CONFIG.SESSION_WARNING_MS) / 1000));

        // Start countdown
        countdownInterval = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (countdownInterval !== null) clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, APP_CONFIG.SESSION_WARNING_MS);

      // Set logout timeout
      logoutTimeout = window.setTimeout(async () => {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        router.replace("/admin/login?reason=session-expired");
      }, APP_CONFIG.SESSION_TIMEOUT_MS);
    };

    // Reset on any user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetTimeouts();

    events.forEach((event) => document.addEventListener(event, handleActivity));

    // Initial setup
    resetTimeouts();

    return () => {
      events.forEach((event) => document.removeEventListener(event, handleActivity));
      if (warningTimeout !== null) clearTimeout(warningTimeout);
      if (logoutTimeout !== null) clearTimeout(logoutTimeout);
      if (countdownInterval !== null) clearInterval(countdownInterval);
    };
  }, [router]);

  return { isWarning, timeLeft };
}

/**
 * Hook for managing API request timeouts
 */
export function useApiTimeout(timeoutMs: number = 30000) {
  const [isTimedOut, setIsTimedOut] = useState(false);

  const fetchWithTimeout = async (url: string, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        setIsTimedOut(true);
        throw new Error("Request timeout");
      }
      throw error;
    }
  };

  return { fetchWithTimeout, isTimedOut };
}
