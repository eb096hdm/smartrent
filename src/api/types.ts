export type DotColor = "green" | "yellow" | "red";
export type CardColor = "red" | "orange" | "green" | "blue";

export type Factors = {
  // Neue Keys (aktuelles Webhook-Format)
  tages?: number | string;
  konkurrenz?: number | string;
  komfort?: number | string;
  besonderheiten?: number | string;
  // Legacy-Keys (Rückwärtskompatibilität)
  saison?: number | string;
  event?: number | string;
};

export type DayCard = {
  weekday: string;
  label: string;
  /** Preis – neu: number, legacy: string ("90 €/Nacht"). */
  price: string | number;
  date?: string;
  dot: DotColor;
  dot_label: string;
  card_color: CardColor;
  /** Auslastung in Prozent – neu: number, legacy: string ("78%"). */
  occupancy: string | number;
  /** NEU: Lesbarer Auslastungstext, z. B. "ca. 7 von 10 Unterkünften ausgebucht" */
  occupancy_text?: string;
  card_text: string;
  detail_text: string;
  active_events?: string[];
  change_label?: string;
  change_pct?: number;
  factors?: Factors;
  data_confidence?: "low" | "medium" | "high";
  /** NEU: lesbare Formel-Zeile, z. B. "98 EUR x 1.35 (Tagesfaktor) x ... = 150 EUR" */
  price_breakdown?: string;
};

export type Competitor = {
  type: string;
  size_sqm: string | number;
  price: string | number;
  quality: string;
  platform: string;
  distance_km: string | number;
};

export type EventItem = {
  name?: string;
  date?: string;
  description?: string;
  impact?: string | number;
  [k: string]: unknown;
};

export type SummaryBlock = {
  week_avg?: string | number;
  top_event?: string | null;
  top_event_day?: string | null;
  text?: string;
  best_day?: string;
  worst_day?: string;
  /** NEU: 2–3 Markt-Hinweise für den Host */
  host_hinweise?: string[];
  /** NEU: Einordnung der Marktposition als Klartext */
  marktposition?: string;
  /** NEU: 2–3 Sätze, die den Wochendurchschnitt erklären */
  week_rationale?: string;
};

export type MarketBlock = {
  avg?: string | number;
  min?: string | number;
  max?: string | number;
  level?: string;
  competitors?: Competitor[];
};

export type WeekResponse = {
  days: DayCard[];
  summary: SummaryBlock;
  market: MarketBlock;
  events: EventItem[];
};

export type PricingRequest = {
  plz: string;
  art: "Wohnung" | "Haus" | "Zimmer";
  flaeche_qm: number;
  zimmer: number;
  max_gaeste: number;
  komfort: "Basic" | "Mittel" | "Hochwertig";
  aktueller_preis: number;
  ansicht: "woche" | "monat";
  woche_start: string;
  plattformen: string[];
  aktualitaetspruefung: boolean;
  besonderheiten: string[];
};
