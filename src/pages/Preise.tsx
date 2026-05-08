import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Loader2, MapPin } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;
import "leaflet/dist/leaflet.css";

import { Switch } from "@/components/ui/switch";
import { WeekPicker } from "@/components/WeekPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Über uns", href: "/#about" },
  { label: "Leistungen", href: "/#services" },
  { label: "Referenzen", href: "/#testimonials" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Kontakt", href: "/#contact" },
];

const DE_CENTER: [number, number] = [51.1657, 10.4515];
const DE_ZOOM = 7;
const PLZ_ZOOM = 11;

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/i1mew6hs760cdj6jhllf9ww6677v1yea";

type DotColor = "green" | "yellow" | "red";
type CardColor = "red" | "orange" | "green" | "blue";

type Factors = {
  saison?: number | string;
  event?: number | string;
  konkurrenz?: number | string;
  komfort?: number | string;
};

type DayCard = {
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

type Competitor = {
  type: string;
  size_sqm: string | number;
  price: string | number;
  quality: string;
  platform: string;
  distance_km: string | number;
};

type EventItem = {
  name?: string;
  date?: string;
  description?: string;
  impact?: string;
  [k: string]: unknown;
};

type SummaryBlock = {
  week_avg?: string | number;
  top_event?: string | null;
  top_event_day?: string | null;
  text?: string;
  best_day?: string;
  worst_day?: string;
};

type MarketBlock = {
  avg?: string | number;
  min?: string | number;
  max?: string | number;
  level?: string;
  competitors?: Competitor[];
};

type WeekResponse = {
  days: DayCard[];
  summary: SummaryBlock;
  market: MarketBlock;
  events: EventItem[];
};

type Ansicht = "woche" | "monat";

const ART_OPTIONS = ["Wohnung", "Haus", "Zimmer"] as const;
type ArtOption = (typeof ART_OPTIONS)[number];

const KOMFORT_OPTIONS: { value: "Basic" | "Mittel" | "Hochwertig"; desc: string }[] = [
  { value: "Basic", desc: "einfache Ausstattung" },
  { value: "Mittel", desc: "gut ausgestattet, modern" },
  { value: "Hochwertig", desc: "Premium, besondere Merkmale" },
];

const PLATTFORM_OPTIONS = ["Airbnb", "Booking.com", "VRBO", "Expedia", "Direkt"] as const;
const BESONDERHEITEN_OPTIONS = [
  "Balkon / Terrasse", "Parkplatz", "Haustiere erlaubt",
  "Waschmaschine", "Klimaanlage", "Kamin",
] as const;

const buildMockResponse = (basePrice: number, startDate: Date): WeekResponse => {
  const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const presets: { dot: DotColor; dot_label: string; card_color: CardColor; factor: number; occ: number; text: string; detail: string; events?: string[] }[] = [
    { dot: "green", dot_label: "Gute Auslastung", card_color: "green", factor: 1.0, occ: 78, text: "Stabile Nachfrage – marktüblicher Preis empfohlen.", detail: "Solide Marktnachfrage und stabile Buchungslage. Der empfohlene Preis liegt im Marktdurchschnitt für vergleichbare Objekte." },
    { dot: "green", dot_label: "Gute Auslastung", card_color: "green", factor: 1.05, occ: 82, text: "Leicht erhöhte Nachfrage erkannt.", detail: "Die Buchungsrate liegt über dem Wochenmittel. Eine moderate Preiserhöhung ist möglich." },
    { dot: "yellow", dot_label: "Event in der Nähe", card_color: "orange", factor: 1.18, occ: 91, text: "Event in der Nähe – höherer Preis möglich.", detail: "Ein lokales Event treibt die Nachfrage. Wir empfehlen einen Aufschlag, ohne die Buchungswahrscheinlichkeit zu gefährden.", events: ["Stadtfest"] },
    { dot: "green", dot_label: "Gute Auslastung", card_color: "green", factor: 1.02, occ: 75, text: "Marktüblicher Preis empfohlen.", detail: "Keine besonderen Faktoren – stabile, marktübliche Preisempfehlung." },
    { dot: "yellow", dot_label: "Event in der Nähe", card_color: "orange", factor: 1.22, occ: 94, text: "Wochenend-Peak mit Event-Bonus.", detail: "Freitag mit hoher Wochenendnachfrage und einem Event in der Region.", events: ["Konzert in der Arena"] },
    { dot: "green", dot_label: "Gute Auslastung", card_color: "blue", factor: 1.15, occ: 88, text: "Wochenende – höhere Buchungsrate.", detail: "Samstage zeigen die höchste Buchungsrate – Premium-Preis empfohlen." },
    { dot: "red", dot_label: "Schwache Nachfrage", card_color: "red", factor: 0.85, occ: 42, text: "Schwache Nachfrage – Preis senken.", detail: "Sonntagabend ist traditionell schwach gebucht. Eine Preissenkung erhöht die Buchungswahrscheinlichkeit." },
  ];
  const days: DayCard[] = presets.map((p, i) => {
    const d = addDays(startDate, i);
    const price = Math.round((basePrice || 90) * p.factor);
    const change = Math.round(((price / (basePrice || 90)) - 1) * 100);
    return {
      weekday: weekdays[i].toUpperCase(),
      label: format(d, "dd. MMM", { locale: de }),
      price: `${price} €/Nacht`,
      change_label: `${change > 0 ? "+" : ""}${change}% ${change >= 0 ? "über" : "unter"} deinem aktuellen Preis`,
      dot: p.dot,
      dot_label: p.dot_label,
      card_color: p.card_color,
      occupancy: `Auslastung: ${p.occ}%`,
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
        { type: "Wohnung", size_sqm: "60 m²", price: `${avg - 5} €`, quality: "Mittel", platform: "Airbnb", distance_km: "0.4 km" },
        { type: "Wohnung", size_sqm: "72 m²", price: `${avg + 8} €`, quality: "Hochwertig", platform: "Booking.com", distance_km: "0.9 km" },
        { type: "Haus", size_sqm: "95 m²", price: `${avg + 22} €`, quality: "Hochwertig", platform: "VRBO", distance_km: "1.5 km" },
      ],
    },
    events: [
      { name: "Stadtfest", date: format(addDays(startDate, 2), "yyyy-MM-dd"), description: "Innenstadt, ganztägig" },
      { name: "Konzert in der Arena", date: format(addDays(startDate, 4), "yyyy-MM-dd"), description: "Großevent mit überregionaler Anziehung" },
    ],
  };
};

const StaticMapBinder = ({ onReady }: { onReady: (m: LeafletMap) => void }) => {
  const map = useMap();
  useEffect(() => {
    const lock = () => {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tap = (map as any).tap;
      if (tap) tap.disable();
    };
    lock();
    onReady(map);
  }, [map, onReady]);
  return null;
};

type Step = "plz" | "details" | "loading" | "results" | "error";

const Preise = () => {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [step, setStep] = useState<Step>("plz");
  const [showTool, setShowTool] = useState(false);
  const [detailsStep, setDetailsStep] = useState<1 | 2>(1);

  const [plz, setPlz] = useState("");
  const [plzError, setPlzError] = useState<string | null>(null);

  // Step 1 fields
  const [art, setArt] = useState<ArtOption | null>(null);
  const [flaeche, setFlaeche] = useState<number | "">("");
  const [zimmer, setZimmer] = useState(2);
  const [maxGaeste, setMaxGaeste] = useState(4);
  const [komfort, setKomfort] = useState<"Basic" | "Mittel" | "Hochwertig" | null>(null);
  const [aktuellerPreis, setAktuellerPreis] = useState<number | "">("");

  // Step 2 fields
  const [ansicht] = useState<Ansicht>("woche");
  const initialMonday = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const offset = (dow + 6) % 7;
    const m = new Date(today);
    m.setDate(today.getDate() - offset);
    m.setHours(0, 0, 0, 0);
    return m;
  }, []);
  const [wocheDate, setWocheDate] = useState<Date>(initialMonday);
  const [plattformen, setPlattformen] = useState<string[]>([]);
  const [aktualitaetspruefung, setAktualitaetspruefung] = useState(true);
  const [besonderheiten, setBesonderheiten] = useState<string[]>([]);

  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const [results, setResults] = useState<WeekResponse | null>(null);
  const [openDayIdx, setOpenDayIdx] = useState<number | null>(null);
  const [plzBoundary, setPlzBoundary] = useState<FeatureCollection | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/maps/germany-states.geojson")
      .then((r) => r.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handlePlzSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(plz)) {
      setPlzError("Bitte gib eine gültige 5-stellige PLZ ein");
      return;
    }
    setPlzError(null);
    setPlzBoundary(null);

    try {
      const r = await fetch(`https://api.zippopotam.us/de/${plz}`);
      if (r.ok) {
        const data = await r.json();
        const place = data?.places?.[0];
        if (place && mapRef.current) {
          const lat = parseFloat(place.latitude);
          const lng = parseFloat(place.longitude);
          mapRef.current.flyTo([lat, lng], PLZ_ZOOM, { duration: 0.8, easeLinearity: 0.25 });
        }
      }
    } catch { /* silent */ }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&postalcode=${plz}&polygon_geojson=1&limit=1`;
      const r = await fetch(url, { headers: { "Accept-Language": "de" } });
      if (r.ok) {
        const arr = await r.json();
        const hit = Array.isArray(arr) ? arr[0] : null;
        if (hit?.geojson) {
          setPlzBoundary({
            type: "FeatureCollection",
            features: [{ type: "Feature", properties: { plz }, geometry: hit.geojson }],
          });
        }
      }
    } catch { /* silent */ }

    setStep("details");
    setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    setStep1Error(null);
    if (!art) return setStep1Error("Bitte wähle die Art des Objekts.");
    if (!flaeche || Number(flaeche) < 10 || Number(flaeche) > 500) {
      return setStep1Error("Bitte gib eine gültige Wohnfläche (10–500 m²) an.");
    }
    if (!komfort) return setStep1Error("Bitte wähle ein Komfortniveau.");
    if (!aktuellerPreis || Number(aktuellerPreis) < 1) {
      return setStep1Error("Bitte gib einen gültigen Preis pro Nacht ein.");
    }
    setDetailsStep(2);
  };

  const togglePlattform = (p: string) => {
    setPlattformen((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };
  const toggleBesonderheit = (b: string) => {
    setBesonderheiten((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStep2Error(null);
    if (plattformen.length === 0) return setStep2Error("Bitte wähle mindestens eine Plattform.");

    setStep("loading");

    const payload = {
      plz,
      art,
      flaeche_qm: Number(flaeche),
      zimmer,
      max_gaeste: maxGaeste,
      komfort,
      aktueller_preis: Number(aktuellerPreis),
      ansicht,
      woche_start: format(wocheDate, "yyyy-MM-dd"),
      plattformen,
      aktualitaetspruefung,
      besonderheiten,
    };

    try {
      let data: WeekResponse | null = null;
      if (MAKE_WEBHOOK_URL) {
        const r = await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Webhook error");
        const text = await r.text();
        // Strip ```json ... ``` fences if Make.com wrapped the body in markdown
        let cleaned = text.trim();
        const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (fence) cleaned = fence[1].trim();
        // Fallback: extract first {...} block
        if (!cleaned.startsWith("{")) {
          const m = cleaned.match(/\{[\s\S]*\}/);
          if (m) cleaned = m[0];
        }
        try {
          const parsed = JSON.parse(cleaned) as WeekResponse;
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            data = parsed;
          } else {
            console.warn("Webhook returned empty/invalid data, using mock fallback", text);
          }
        } catch (err) {
          console.warn("Webhook returned non-JSON, using mock fallback", text, err);
        }
      }
      if (!data) {
        await new Promise((res) => setTimeout(res, 400));
        data = buildMockResponse(Number(aktuellerPreis) || 90, wocheDate);
      }
      setResults(data);
      setOpenDayIdx(null);
      setStep("results");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    } catch {
      setStep("error");
    }
  };

  const resetToDetails = () => {
    setStep("details");
    setDetailsStep(1);
    setResults(null);
  };

  const cardCls = "w-full rounded-2xl border border-white/10 bg-black/50 p-8 shadow-2xl [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]";
  const inputCls = "mt-2 w-full rounded-full bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-70";
  const labelCls = "block text-xs font-medium text-white/80";

  return (
    <main className="relative min-h-screen bg-[#3a2418] text-ink-foreground">
      <div
        className="fixed inset-0 z-0 [filter:sepia(1)_saturate(1.6)_hue-rotate(-18deg)_brightness(0.95)] pointer-events-none"
        aria-hidden="true"
      >
        <MapContainer
          center={DE_CENTER}
          zoom={DE_ZOOM}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%", background: "#c98a55" }}
        >
          <StaticMapBinder onReady={(m) => { mapRef.current = m; }} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
            subdomains="abcd"
          />
          {geo && (
            <GeoJSON
              data={geo}
              style={{
                fillColor: "#fff1d6",
                fillOpacity: 0.18,
                color: "#fff1d6",
                weight: 1,
                opacity: 0.5,
              }}
              interactive={false}
            />
          )}
          {plzBoundary && (
            <GeoJSON
              key={plz}
              data={plzBoundary}
              style={{
                color: "#fff1d6",
                weight: 2,
                opacity: 0.85,
                fillColor: "#fff1d6",
                fillOpacity: 0.18,
              }}
              interactive={false}
            />
          )}
        </MapContainer>
      </div>

      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-[#3a2418]/55 via-[#5a2e15]/40 to-[#3a2418]/65 pointer-events-none" aria-hidden="true" />

      <div className="relative z-[2]">
        <header className="fixed top-0 inset-x-0 z-50 bg-black/40 [backdrop-filter:blur(10px)] [-webkit-backdrop-filter:blur(10px)] border-b border-white/10 shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between px-6 sm:px-10 py-4">
            <a href="/" className="text-2xl font-semibold tracking-tight">SmartRent</a>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((n) => (
                <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
              ))}
            </nav>
          </div>
        </header>

        <div className="flex flex-col items-center gap-8 px-4 sm:px-10 pt-28 pb-16 min-h-screen">
          {/* Hero */}
          {step === "plz" && !showTool && (
            <section className="relative w-full max-w-[720px] mx-auto overflow-hidden rounded-[2rem] border border-[#E8D5B0]/30 shadow-2xl">
              {/* Warm gradient + bokeh */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#B94F0F_0%,#C05C1A_25%,#D4623A_50%,#E8A44A_75%,#E8D5B0_100%)]" aria-hidden="true" />
              <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-[#E8A44A]/50 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-[#D4623A]/50 blur-3xl" aria-hidden="true" />
              <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-[#F2E6D0]/40 blur-2xl" aria-hidden="true" />
              {/* Grain */}
              <div
                className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
              />

              <div className="relative flex flex-col items-center text-center px-6 sm:px-10 py-20 sm:py-24">
                <motion.span
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F5EDD8]/20 bg-[#2A1F14] px-3.5 py-1.5 text-xs font-medium text-[#F5EDD8]"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Interaktive Karte
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
                  className="mt-6 font-bold tracking-tight text-[#1A1108] text-4xl sm:text-5xl leading-[1.05]"
                  style={{ fontFamily: "'Fraunces', 'DM Sans', serif" }}
                >
                  Finde die optimale Preisempfehlung für deine Region
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-5 max-w-xl text-base sm:text-lg text-[#4A3520]/90"
                >
                  Gib deine Postleitzahl ein und entdecke datenbasierte Preisempfehlungen für dein Mietobjekt — plattformübergreifend und in Sekunden.
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("plz");
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => el?.focus(), 400);
                  }}
                  className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-[#2A1F14] px-7 py-3.5 text-sm sm:text-base font-medium text-[#F5EDD8] shadow-[0_10px_30px_-10px_rgba(192,92,26,0.6)] transition-all duration-300 hover:shadow-[0_18px_40px_-10px_rgba(232,164,74,0.75)] hover:-translate-y-0.5"
                >
                  Jetzt Preisempfehlung erhalten
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.button>
              </div>
            </section>
          )}


          <motion.div
            layout
            animate={{ y: step === "plz" ? 0 : -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full min-w-0 sm:min-w-[520px] max-w-[640px] ${step === "plz" ? "min-h-[calc(100vh-12rem)] flex items-center" : ""}`}
          >
            <div className={cardCls}>
              <h1 className="display text-3xl sm:text-4xl text-white">
                Wo befindet sich dein Objekt?
              </h1>
              <p className="mt-3 text-sm text-white/70">
                Gib deine Postleitzahl ein, um lokale Preisempfehlungen zu erhalten.
              </p>

              <form onSubmit={handlePlzSubmit} className="mt-6">
                <label htmlFor="plz" className={labelCls}>Postleitzahl</label>
                <input
                  id="plz"
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  autoComplete="postal-code"
                  value={plz}
                  disabled={step !== "plz"}
                  onChange={(e) => {
                    setPlzError(null);
                    setPlz(e.target.value.replace(/\D/g, "").slice(0, 5));
                  }}
                  placeholder="z.B. 10115"
                  className={inputCls}
                />
                {plzError && <p role="alert" className="mt-2 text-xs text-red-300">{plzError}</p>}

                {step === "plz" ? (
                  <PrimaryButton type="submit">Weiter</PrimaryButton>
                ) : (
                  <p className="mt-4 text-xs text-white/60">PLZ bestätigt: <span className="text-white">{plz}</span></p>
                )}
              </form>
            </div>
          </motion.div>

          {/* Details — 2-step form */}
          <AnimatePresence>
            {(step === "details" || step === "loading" || step === "error") && (
              <motion.div
                ref={detailsRef}
                key="details"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full min-w-0 sm:min-w-[520px] max-w-[640px]"
              >
                <div className={cardCls}>
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-5" aria-label={`Schritt ${detailsStep} von 2`}>
                    <span className={cn("h-2 w-2 rounded-full transition-all", detailsStep === 1 ? "bg-white" : "bg-transparent border border-white/50")} />
                    <span className={cn("h-2 w-2 rounded-full transition-all", detailsStep === 2 ? "bg-white" : "bg-transparent border border-white/50")} />
                    <span className="ml-2 text-xs text-white/60">Schritt {detailsStep} von 2</span>
                  </div>

                  <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      {detailsStep === 1 && (
                        <motion.form
                          key="step1"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          onSubmit={handleStep1Next}
                        >
                          <h2 className="display text-2xl sm:text-3xl text-white">Dein Objekt im Detail</h2>
                          <p className="mt-2 text-sm text-white/70">Ein paar Eckdaten zu deinem Objekt.</p>

                          <div className="mt-6 space-y-5">
                            {/* Art */}
                            <div>
                              <label className={labelCls}>Art des Objekts</label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ART_OPTIONS.map((opt) => (
                                  <PillButton key={opt} active={art === opt} onClick={() => setArt(opt)}>{opt}</PillButton>
                                ))}
                              </div>
                            </div>

                            {/* Wohnfläche */}
                            <div>
                              <label htmlFor="flaeche" className={labelCls}>Wohnfläche (m²)</label>
                              <div className="relative">
                                <input
                                  id="flaeche"
                                  inputMode="numeric"
                                  min={10}
                                  max={500}
                                  value={flaeche}
                                  onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "");
                                    setFlaeche(v === "" ? "" : Number(v));
                                  }}
                                  placeholder="z.B. 65"
                                  className={cn(inputCls, "pr-14")}
                                />
                                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-white/60">m²</span>
                              </div>
                            </div>

                            <NumberStepper label="Wie viele Zimmer hat dein Objekt?" value={zimmer} min={1} max={20} onChange={setZimmer} />
                            <NumberStepper label="Maximale Gästeanzahl" value={maxGaeste} min={1} max={20} onChange={setMaxGaeste} />

                            {/* Komfort */}
                            <div>
                              <label className={labelCls}>Ausstattung & Komfort</label>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {KOMFORT_OPTIONS.map((opt) => {
                                  const active = komfort === opt.value;
                                  return (
                                    <button
                                      type="button"
                                      key={opt.value}
                                      onClick={() => setKomfort(opt.value)}
                                      className={cn(
                                        "rounded-lg p-4 text-left transition-all",
                                        active
                                          ? "border border-white bg-white/[0.08]"
                                          : "border border-white/20 hover:border-white/40",
                                      )}
                                    >
                                      <div className="text-sm font-medium text-white">{opt.value}</div>
                                      <div className="mt-1 text-xs text-white/60">{opt.desc}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Preis */}
                            <div>
                              <label htmlFor="preis" className={labelCls}>Dein aktueller Preis pro Nacht (€)</label>
                              <input
                                id="preis"
                                inputMode="numeric"
                                min={1}
                                value={aktuellerPreis}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "");
                                  setAktuellerPreis(v === "" ? "" : Number(v));
                                }}
                                placeholder="z.B. 95"
                                className={inputCls}
                              />
                            </div>
                          </div>

                          {step1Error && <p role="alert" className="mt-3 text-xs text-red-300">{step1Error}</p>}

                          <PrimaryButton type="submit">Weiter</PrimaryButton>
                        </motion.form>
                      )}

                      {detailsStep === 2 && (
                        <motion.form
                          key="step2"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -30 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          onSubmit={handleFinalSubmit}
                        >
                          <h2 className="display text-2xl sm:text-3xl text-white">Wie soll die Analyse laufen?</h2>
                          <p className="mt-2 text-sm text-white/70">Je mehr Details, desto genauer deine Preisempfehlung.</p>

                          <div className="mt-6 space-y-6">
                            {/* Woche auswählen */}
                            <div>
                              <label className={labelCls}>Welche Woche möchtest du analysieren?</label>
                              <WeekPicker value={wocheDate} onChange={setWocheDate} minDate={initialMonday} />
                            </div>

                            {/* Plattformen */}
                            <div>
                              <label className={labelCls}>Auf welchen Plattformen bist du aktiv?</label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {PLATTFORM_OPTIONS.map((p) => (
                                  <PillButton key={p} active={plattformen.includes(p)} onClick={() => togglePlattform(p)}>{p}</PillButton>
                                ))}
                              </div>
                            </div>

                            {/* Aktualitätsprüfung */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-xs font-medium text-white/80">Aktuelle Marktdaten prüfen</div>
                                <p className="mt-1 text-xs text-white/60">Wir gleichen Konkurrenzpreise und lokale Events in Echtzeit ab.</p>
                              </div>
                              <Switch checked={aktualitaetspruefung} onCheckedChange={setAktualitaetspruefung} />
                            </div>

                            {/* Besonderheiten */}
                            <div>
                              <label className={labelCls}>Besondere Merkmale (optional)</label>
                              <p className="mt-1 text-xs text-white/60">Erhöht die Genauigkeit der Empfehlung.</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {BESONDERHEITEN_OPTIONS.map((b) => (
                                  <PillButton key={b} active={besonderheiten.includes(b)} onClick={() => toggleBesonderheit(b)}>{b}</PillButton>
                                ))}
                              </div>
                            </div>
                          </div>

                          {step2Error && <p role="alert" className="mt-3 text-xs text-red-300">{step2Error}</p>}
                          {step === "error" && (
                            <p role="alert" className="mt-3 text-xs text-red-300">
                              Preis konnte nicht berechnet werden. Bitte versuche es erneut.
                            </p>
                          )}

                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setDetailsStep(1)}
                              disabled={step === "loading"}
                              className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 hover:border-white/40 hover:text-white transition-colors disabled:opacity-60"
                            >
                              Zurück
                            </button>
                            <PrimaryButton type="submit" disabled={step === "loading"}>
                              {step === "loading" ? "Wird berechnet…" : "Preisempfehlung berechnen"}
                              {step === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            </PrimaryButton>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeleton */}
          {step === "loading" && (
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-black/50 p-6 h-40 animate-pulse [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]" />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {step === "results" && results && (
              <motion.div
                ref={resultsRef}
                key="results"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-6xl"
              >
                <WeekResults
                  data={results}
                  plz={plz}
                  openDayIdx={openDayIdx}
                  setOpenDayIdx={setOpenDayIdx}
                />

                <div className="mt-8 flex justify-center">
                  <PrimaryButton type="button" onClick={resetToDetails}>Preise anpassen</PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
};

const PrimaryButton = ({
  children, type = "button", onClick, disabled,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90 disabled:opacity-60"
  >
    {children}
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
      <ArrowUpRight className="h-4 w-4" />
    </span>
  </button>
);

const PillButton = ({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full px-3 py-2 text-sm transition-colors",
      active
        ? "bg-white text-ink border border-white"
        : "bg-transparent text-white border border-white/30 hover:border-white/60",
    )}
    style={{ paddingLeft: 12, paddingRight: 12 }}
  >
    {children}
  </button>
);

const NumberStepper = ({
  label, value, min, max, onChange, disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) => {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div>
      <label className="block text-xs font-medium text-white/80">{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= min}
          className="h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white text-lg leading-none disabled:opacity-40"
          aria-label="verringern"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="w-20 text-center rounded-full bg-white/10 border border-white/15 px-3 py-2 text-base text-white focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          className="h-10 w-10 rounded-full bg-white/10 border border-white/15 text-white text-lg leading-none disabled:opacity-40"
          aria-label="erhöhen"
        >
          +
        </button>
      </div>
    </div>
  );
};

const CARD_BORDER: Record<CardColor, string> = {
  red: "#7F1D1D",
  orange: "#78350F",
  green: "#14532D",
  blue: "#1E3A5F",
};
const DOT_BG: Record<DotColor, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  red: "#EF4444",
};

const WeekResults = ({
  data,
  plz,
  openDayIdx,
  setOpenDayIdx,
}: {
  data: WeekResponse;
  plz: string;
  openDayIdx: number | null;
  setOpenDayIdx: (i: number | null) => void;
}) => {
  const open = openDayIdx !== null ? data.days[openDayIdx] : null;
  const summary = data.summary ?? {};
  const market = data.market ?? {};
  const competitors = market.competitors ?? [];
  const events = data.events ?? [];

  const highlight = (text?: string) => {
    if (!text) return null;
    const tokens = [summary.best_day, summary.worst_day].filter(Boolean) as string[];
    if (tokens.length === 0) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${tokens.join("|")})`, "g"));
    return parts.map((p, i) =>
      p && p === summary.best_day ? <span key={i} className="text-emerald-300 font-medium">{p}</span> :
      p && p === summary.worst_day ? <span key={i} className="text-red-300 font-medium">{p}</span> :
      <span key={i}>{p}</span>
    );
  };

  return (
    <>
      <h2 className="display text-3xl sm:text-4xl text-white">
        Deine Preisempfehlung für {plz}
      </h2>
      <p className="mt-2 text-sm text-white/70">
        7 Tage im Detail – klicke auf eine Karte für die Begründung.
      </p>

      {/* 7 Day cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {data.days.map((d, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setOpenDayIdx(i)}
            className="text-left rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-0.5 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ borderColor: CARD_BORDER[d.card_color] }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-white/70">{d.weekday}</span>
              <span
                className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: DOT_BG[d.dot] }}
                title={d.dot_label}
              />
            </div>
            <div className="mt-1 text-sm text-white/80">{d.label}</div>
            <p className="mt-3 text-2xl font-semibold text-white leading-tight">{d.price}</p>
            <p className="mt-1 text-xs text-white/60">{d.occupancy}</p>
            <p className="mt-3 text-xs text-white/70 line-clamp-2">{d.card_text}</p>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/40">Details ansehen</p>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-6 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          {summary.week_avg != null && (
            <div>
              <div className="text-2xl font-semibold text-white">{summary.week_avg}</div>
            </div>
          )}
          {summary.top_event && (
            <div className="rounded-full bg-amber-400/15 border border-amber-400/40 px-4 py-1.5 text-xs text-amber-200">
              📍 {summary.top_event}{summary.top_event_day ? ` (${summary.top_event_day})` : ""}
            </div>
          )}
        </div>
        {summary.text && (
          <p className="mt-4 text-sm text-white/80 leading-relaxed">{highlight(summary.text)}</p>
        )}
      </div>

      {/* Market section */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-6 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-medium text-white">Konkurrenz im Markt</h3>
          {market.level && (
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
              {market.level}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {market.avg != null && <Stat label="Ø Markt" value={String(market.avg)} />}
          {market.min != null && <Stat label="Min" value={String(market.min)} />}
          {market.max != null && <Stat label="Max" value={String(market.max)} />}
        </div>
        {competitors.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/50 border-b border-white/10">
                  <th className="py-2 pr-3 font-normal">Typ</th>
                  <th className="py-2 pr-3 font-normal">Größe</th>
                  <th className="py-2 pr-3 font-normal">Preis</th>
                  <th className="py-2 pr-3 font-normal">Qualität</th>
                  <th className="py-2 pr-3 font-normal">Plattform</th>
                  <th className="py-2 pr-3 font-normal">Distanz</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 text-white/85">
                    <td className="py-2 pr-3">{c.type}</td>
                    <td className="py-2 pr-3">{c.size_sqm}</td>
                    <td className="py-2 pr-3">{c.price}</td>
                    <td className="py-2 pr-3">{c.quality}</td>
                    <td className="py-2 pr-3">{c.platform}</td>
                    <td className="py-2 pr-3">{c.distance_km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Events */}
      {events.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-6 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
          <h3 className="text-lg font-medium text-white">Events diese Woche</h3>
          <ul className="mt-3 space-y-2">
            {events.map((e, i) => (
              <li key={i} className="text-sm text-white/80 flex flex-wrap items-baseline gap-x-2">
                <span className="text-white font-medium">{e.name ?? "Event"}</span>
                {e.date && <span className="text-white/50"> · {e.date}</span>}
                {e.description && <span className="text-white/60"> – {e.description}</span>}
                {e.impact && (
                  <span className="ml-1 rounded-full bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-200">
                    {e.impact}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Day modal */}
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpenDayIdx(null)}>
        <DialogContent className="bg-black/90 border-white/10 text-white max-w-lg [backdrop-filter:blur(12px)] [-webkit-backdrop-filter:blur(12px)]">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: DOT_BG[open.dot] }}
                  />
                  {open.weekday} · {open.label}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <p className="text-3xl font-semibold text-white">{open.price}</p>
                <p className="mt-1 text-xs text-white/60">{open.dot_label} · {open.occupancy}</p>
              </div>
              <p className="mt-3 text-sm text-white/85 leading-relaxed">{open.detail_text}</p>
              {open.active_events && open.active_events.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-amber-200/80">Aktive Events</p>
                  <p className="mt-1 text-sm text-amber-100">{open.active_events.join(", ")}</p>
                </div>
              )}
              {open.change_label && (
                <p className="mt-4 text-sm font-medium text-white/85">{open.change_label}</p>
              )}
              {open.factors && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ["Saison", open.factors.saison],
                    ["Event", open.factors.event],
                    ["Konkurrenz", open.factors.konkurrenz],
                    ["Komfort", open.factors.komfort],
                  ] as const).map(([label, val]) =>
                    val != null ? (
                      <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                        <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
                        <div className="mt-0.5 text-sm font-medium text-white">{val}</div>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-white/60">{label}</div>
    <div className="mt-1 text-lg font-semibold text-white">{value}</div>
  </div>
);

export default Preise;
