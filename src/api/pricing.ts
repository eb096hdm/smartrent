import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import type { PricingRequest, WeekResponse, DayCard, DotColor, CardColor } from "./types";

// ---------------------------------------------------------------------------
// Mock fallback – used when the Express backend is unavailable (e.g. Lovable)
// ---------------------------------------------------------------------------
const buildMockResponse = (basePrice: number, startDate: Date): WeekResponse => {
  const weekdays = ["MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG", "SONNTAG"];
  const presets: {
    dot: DotColor; dot_label: string; card_color: CardColor;
    factor: number; occ: number; text: string; detail: string; events?: string[];
  }[] = [
    { dot: "green", dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.00, occ: 78, text: "Stabile Nachfrage – marktüblicher Preis empfohlen.",       detail: "Solide Marktnachfrage und stabile Buchungslage. Der empfohlene Preis liegt im Marktdurchschnitt für vergleichbare Objekte." },
    { dot: "green", dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.05, occ: 82, text: "Leicht erhöhte Nachfrage erkannt.",                        detail: "Die Buchungsrate liegt über dem Wochenmittel. Eine moderate Preiserhöhung ist möglich." },
    { dot: "yellow", dot_label: "Event in der Nähe", card_color: "orange", factor: 1.18, occ: 91, text: "Event in der Nähe – höherer Preis möglich.",                detail: "Ein lokales Event treibt die Nachfrage. Wir empfehlen einen Aufschlag, ohne die Buchungswahrscheinlichkeit zu gefährden.", events: ["Stadtfest"] },
    { dot: "green", dot_label: "Gute Auslastung",    card_color: "green",  factor: 1.02, occ: 75, text: "Marktüblicher Preis empfohlen.",                           detail: "Keine besonderen Faktoren – stabile, marktübliche Preisempfehlung." },
    { dot: "yellow", dot_label: "Event in der Nähe", card_color: "orange", factor: 1.22, occ: 94, text: "Wochenend-Peak mit Event-Bonus.",                          detail: "Freitag mit hoher Wochenendnachfrage und einem Event in der Region.", events: ["Konzert in der Arena"] },
    { dot: "green", dot_label: "Gute Auslastung",    card_color: "blue",   factor: 1.15, occ: 88, text: "Wochenende – höhere Buchungsrate.",                       detail: "Samstage zeigen die höchste Buchungsrate – Premium-Preis empfohlen." },
    { dot: "red",   dot_label: "Schwache Nachfrage", card_color: "red",    factor: 0.85, occ: 42, text: "Schwache Nachfrage – Preis senken.",                       detail: "Sonntagabend ist traditionell schwach gebucht. Eine Preissenkung erhöht die Buchungswahrscheinlichkeit." },
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

  const avg = Math.round(days.reduce((s, d) => s + parseInt(d.price), 0) / days.length);

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
        { type: "Wohnung", size_sqm: "60 m²", price: `${avg - 5} €`, quality: "Mittel",      platform: "Airbnb",      distance_km: "0.4 km" },
        { type: "Wohnung", size_sqm: "72 m²", price: `${avg + 8} €`, quality: "Hochwertig",  platform: "Booking.com", distance_km: "0.9 km" },
        { type: "Haus",    size_sqm: "95 m²", price: `${avg + 22} €`, quality: "Hochwertig", platform: "VRBO",        distance_km: "1.5 km" },
      ],
    },
    events: [
      { name: "Stadtfest",            date: format(addDays(startDate, 2), "yyyy-MM-dd"), description: "Innenstadt, ganztägig" },
      { name: "Konzert in der Arena", date: format(addDays(startDate, 4), "yyyy-MM-dd"), description: "Großevent mit überregionaler Anziehung" },
    ],
  };
};

// ---------------------------------------------------------------------------
// Main export – tries the Express backend first, falls back to mock data
// ---------------------------------------------------------------------------
export async function fetchPriceRecommendation(payload: PricingRequest): Promise<WeekResponse> {
  try {
    const res = await fetch("/api/price-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json() as WeekResponse;
      if (data && Array.isArray(data.days) && data.days.length > 0) return data;
    }
  } catch {
    // Backend not available (e.g. Lovable preview) – fall through to mock
  }

  // Small artificial delay so the loading spinner is visible
  await new Promise((res) => setTimeout(res, 600));
  return buildMockResponse(payload.aktueller_preis || 90, new Date(payload.woche_start));
}
