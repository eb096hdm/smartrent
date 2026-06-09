import { useState, useRef } from "react";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 Minuten
const REQUEST_TIMEOUT_MS = 30_000;
const DEDUP_WINDOW_MS = 5_000;

function getRateLimitState(): { timestamps: number[] } {
  try {
    const raw = sessionStorage.getItem("sr_rl");
    return raw ? JSON.parse(raw) : { timestamps: [] };
  } catch {
    return { timestamps: [] };
  }
}

export function checkRateLimit(): boolean {
  const state = getRateLimitState();
  const now = Date.now();
  const recent = state.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  try {
    sessionStorage.setItem("sr_rl", JSON.stringify({ timestamps: recent }));
  } catch {
    /* ignore */
  }
  return true;
}

export function useSecureWebhook() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestRef = useRef<{ payload: string; time: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function sendRequest(payload: Record<string, unknown>) {
    setError(null);

    // Honeypot: Anfragen von Bots abfangen
    if ((payload as { __hp?: string }).__hp) return null;

    // Double-Submit verhindern
    if (isLoading) return null;

    // Rate Limiting
    if (!checkRateLimit()) {
      setError("Zu viele Anfragen. Bitte warte einige Minuten.");
      return null;
    }

    // Deduplizierung (identische Anfrage innerhalb von 5 Sek.)
    const payloadStr = JSON.stringify(payload);
    const now = Date.now();
    if (
      lastRequestRef.current &&
      lastRequestRef.current.payload === payloadStr &&
      now - lastRequestRef.current.time < DEDUP_WINDOW_MS
    ) {
      return null;
    }
    lastRequestRef.current = { payload: payloadStr, time: now };

    // Request absetzen
    setIsLoading(true);
    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortRef.current?.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = (import.meta.env.VITE_WEBHOOK_URL ??
        import.meta.env.VITE_MAKE_WEBHOOK_URL) as string;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-make-apikey": (import.meta.env.VITE_WEBHOOK_SECRET as string) ?? "",
        },
        body: payloadStr,
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setError("Preisberechnung vorübergehend nicht verfügbar.");
        return null;
      }

      const data = await res.json();
      return data;
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") {
        setError("Anfrage hat zu lange gedauert. Bitte erneut versuchen.");
      } else {
        setError("Verbindungsfehler. Bitte Internetverbindung prüfen.");
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }

  return { sendRequest, isLoading, error, setError };
}
