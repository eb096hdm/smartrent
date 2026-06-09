import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { PricingRequest, WeekResponse, DayCard, DotColor, CardColor, DataSourceStatus } from "./types";

export const WEBHOOK_CONNECTION_ERROR = "Verbindung zu Make fehlgeschlagen — bitte prüfe die Webhook-URL in den Einstellungen.";
export const WEBHOOK_URL_MISSING_ERROR = "Webhook-URL nicht konfiguriert";

// ---------------------------------------------------------------------------
// Mock fallback – used when neither backend nor webhook is available
// ---------------------------------------------------------------------------
const buildMockResponse = (basePrice: number, startDate: Date): WeekResponse => {
  const weekdays = ["MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG", "SONNTAG"];
  const presets: {
    dot: DotColor; dot_label: string; card_color: CardColor;
    factor: number; occ: number; text: string; detail: string; events?: string[];
  }[] = [
    { dot: "green",  dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.00, occ: 78, text: "Stabile Nachfrage – marktüblicher Preis empfohlen.",       detail: "Solide Marktnachfrage und stabile Buchungslage. Der empfohlene Preis liegt im Marktdurchschnitt für vergleichbare Objekte." },
    { dot: "green",  dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.05, occ: 82, text: "Leicht erhöhte Nachfrage erkannt.",                        detail: "Die Buchungsrate liegt über dem Wochenmittel. Eine moderate Preiserhöhung ist möglich." },
    { dot: "yellow", dot_label: "Event in der Nähe",  card_color: "orange", factor: 1.18, occ: 91, text: "Event in der Nähe – höherer Preis möglich.",                detail: "Ein lokales Event treibt die Nachfrage. Wir empfehlen einen Aufschlag, ohne die Buchungswahrscheinlichkeit zu gefährden.", events: ["Stadtfest"] },
    { dot: "green",  dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.02, occ: 75, text: "Marktüblicher Preis empfohlen.",                           detail: "Keine besonderen Faktoren – stabile, marktübliche Preisempfehlung." },
    { dot: "yellow", dot_label: "Event in der Nähe",  card_color: "orange", factor: 1.22, occ: 94, text: "Wochenend-Peak mit Event-Bonus.",                          detail: "Freitag mit hoher Wochenendnachfrage und einem Event in der Region.", events: ["Konzert in der Arena"] },
    { dot: "green",  dot_label: "Gute Auslastung",    card_color: "blue",   factor: 1.15, occ: 88, text: "Wochenende – höhere Buchungsrate.",                        detail: "Samstage zeigen die höchste Buchungsrate – Premium-Preis empfohlen." },
    { dot: "red",    dot_label: "Schwache Nachfrage", card_color: "red",    factor: 0.85, occ: 42, text: "Schwache Nachfrage – Preis senken.",                        detail: "Sonntagabend ist traditionell schwach gebucht. Eine Preissenkung erhöht die Buchungswahrscheinlichkeit." },
  ];

  const days: DayCard[] = presets.map((p, i) => {
    const d = addDays(startDate, i);
    const price = Math.round((basePrice || 90) * p.factor);
    const change = Math.round(((price / (basePrice || 90)) - 1) * 100);
    return {
      weekday: weekdays[i],
      label: format(d, "dd. MMM", { locale: de }),
      price: `${price} €/Nacht`,
      change_label: `${change > 0 ? "+" : ""}${change}% ${change >= 0 ? "über" : "unter"} deinem aktuellen Preis`,
      dot: p.dot,
      dot_label: p.dot_label,
      card_color: p.card_color,
      occupancy: `${p.occ}%`,
      card_text: p.text,
      detail_text: p.detail,
      active_events: p.events,
      factors: { saison: 1.1, event: 1.2, konkurrenz: 0.95, komfort: 0.85 },
    };
  });

  const avg = Math.round(days.reduce((s, d) => s + parseInt(String(d.price)), 0) / days.length);

  return {
    days,
    summary: {
      week_avg: `Wochen-Durchschnitt: ${avg} €`,
      top_event: "Konzert in der Arena",
      top_event_day: "Freitag",
      text: "Diese Woche zeigt eine solide Buchungslage mit Spitzen am Wochenende. Bester Tag: Freitag, schwächster Tag: Sonntag.",
      best_day: "Freitag",
      worst_day: "Sonntag",
    },
    market: {
      avg: `${Math.round(avg * 0.95)} €`,
      min: `${Math.round(avg * 0.7)} €`,
      max: `${Math.round(avg * 1.3)} €`,
      level: "mittel",
      competitors: [
        { type: "Wohnung", size_sqm: "60 m²", price: `${avg - 5} €`,  quality: "Mittel",     platform: "Airbnb",      distance_km: "0.4 km" },
        { type: "Wohnung", size_sqm: "72 m²", price: `${avg + 8} €`,  quality: "Hochwertig", platform: "Booking.com", distance_km: "0.9 km" },
        { type: "Haus",    size_sqm: "95 m²", price: `${avg + 22} €`, quality: "Hochwertig", platform: "VRBO",        distance_km: "1.5 km" },
      ],
    },
    events: [
      { name: "Stadtfest",            date: format(addDays(startDate, 2), "yyyy-MM-dd"), description: "Innenstadt, ganztägig" },
      { name: "Konzert in der Arena", date: format(addDays(startDate, 4), "yyyy-MM-dd"), description: "Großevent mit überregionaler Anziehung" },
    ],
  };
};

const withDataSource = (data: WeekResponse, dataSource: DataSourceStatus): WeekResponse => ({
  ...data,
  _meta: { data_source: dataSource },
});

const parseWebhookJson = (rawText: string): WeekResponse => {
  let cleaned = rawText.trim();
  const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) cleaned = fence[1].trim();
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const m = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) cleaned = m[0];
  }

  const parsed = JSON.parse(cleaned) as unknown;
  const candidates = Array.isArray(parsed) ? parsed : [parsed];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && Array.isArray((candidate as WeekResponse).days)) {
      return candidate as WeekResponse;
    }
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["data", "result", "response", "body", "output"]) {
      const value = obj[key];
      if (typeof value === "string") return parseWebhookJson(value);
      if (value && typeof value === "object" && Array.isArray((value as WeekResponse).days)) {
        return value as WeekResponse;
      }
    }
  }

  throw new Error("Webhook JSON enthält kein days[]-Array.");
};

// ---------------------------------------------------------------------------
// Main export
// Uses real Make webhook unless VITE_USE_MOCK === "true" is explicitly set.
// ---------------------------------------------------------------------------
export async function fetchPriceRecommendation(payload: PricingRequest): Promise<WeekResponse> {
  const useMock = import.meta.env.VITE_USE_MOCK === "true";

  if (useMock) {
    console.warn("[SmartRent] VITE_USE_MOCK=true – verwende lokale Mock-Daten statt Make-Webhook.");
    await new Promise((res) => setTimeout(res, 600));
    return withDataSource(buildMockResponse(payload.aktueller_preis || 90, new Date(payload.woche_start)), "mock");
  }

  console.log("[SmartRent] Price recommendation request", { body: payload });

  try {
    const { data, error } = await supabase.functions.invoke("price-recommendation", {
      body: payload,
    });

    if (error) {
      console.error("[SmartRent] Price recommendation function returned an error.", error);
      throw new Error(WEBHOOK_CONNECTION_ERROR);
    }

    const rawText = typeof data === "string" ? data : JSON.stringify(data);
    console.log("[SmartRent] Price recommendation raw response", { body: rawText });

    let parsed: WeekResponse;
    try {
      parsed = parseWebhookJson(rawText);
    } catch (parseError) {
      console.error("[SmartRent] Price recommendation response is not valid JSON or does not contain days[]. Raw response:", rawText, parseError);
      throw new Error(WEBHOOK_CONNECTION_ERROR);
    }

    if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      console.error("[SmartRent] Price recommendation response is missing a valid days[] array. Raw response:", rawText);
      throw new Error(WEBHOOK_CONNECTION_ERROR);
    }

    return withDataSource(parsed, "live");
  } catch (error) {
    console.error("[SmartRent] Price recommendation failed. Raw response or request could not be used.", error);
    if (error instanceof Error && error.message === WEBHOOK_CONNECTION_ERROR) throw error;
    throw new Error(WEBHOOK_CONNECTION_ERROR);
  }
}
