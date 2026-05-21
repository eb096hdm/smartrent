export type DotColor = "green" | "yellow" | "red";
export type CardColor = "red" | "orange" | "green" | "blue";

export type Factors = {
  saison?: number | string;
  event?: number | string;
  konkurrenz?: number | string;
  komfort?: number | string;
};

export type DayCard = {
  weekday: string;
  label: string;
  price: string;
  dot: DotColor;
  dot_label: string;
  card_color: CardColor;
  occupancy: string;
  card_text: string;
  detail_text: string;
  active_events?: string[];
  change_label?: string;
  factors?: Factors;
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
  impact?: string;
  [k: string]: unknown;
};

export type SummaryBlock = {
  week_avg?: string | number;
  top_event?: string | null;
  top_event_day?: string | null;
  text?: string;
  best_day?: string;
  worst_day?: string;
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
