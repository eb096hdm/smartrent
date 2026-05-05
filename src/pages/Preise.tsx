import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;
import "leaflet/dist/leaflet.css";
import { Footer } from "@/components/Footer";
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

type DayCard = {
  weekday: string;
  label: string;
  price: string;
  change_pct: number;
  dot: DotColor;
  dot_label: string;
  card_color: CardColor;
  occupancy: number;
  card_text: string;
  detail_text: string;
  active_events?: string[];
};

type Competitor = {
  type: string;
  size: number;
  price: number;
  quality: string;
  platform: string;
  distance: number;
};

type EventItem = {
  name?: string;
  date?: string;
  description?: string;
  [k: string]: unknown;
};

type WeekResponse = {
  days: DayCard[];
  summary: string;
  top_event: string | null;
  week_avg: number;
  best_day: string;
  worst_day: string;
  market_avg: number;
  market_min: number;
  market_max: number;
  competitors: Competitor[];
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
      change_pct: change,
      dot: p.dot,
      dot_label: p.dot_label,
      card_color: p.card_color,
      occupancy: p.occ,
      card_text: p.text,
      detail_text: p.detail,
      active_events: p.events,
    };
  });
  const avg = Math.round(days.reduce((s, d) => s + parseInt(d.price), 0) / days.length);
  return {
    days,
    summary: `Diese Woche zeigt eine solide Buchungslage mit Spitzen am Wochenende. Bester Tag: Freitag, schwächster Tag: Sonntag.`,
    top_event: "Konzert in der Arena (Freitag)",
    week_avg: avg,
    best_day: "Freitag",
    worst_day: "Sonntag",
    market_avg: Math.round(avg * 0.95),
    market_min: Math.round(avg * 0.7),
    market_max: Math.round(avg * 1.3),
    competitors: [
      { type: "Wohnung", size: 60, price: avg - 5, quality: "Mittel", platform: "Airbnb", distance: 0.4 },
      { type: "Wohnung", size: 72, price: avg + 8, quality: "Hochwertig", platform: "Booking.com", distance: 0.9 },
      { type: "Haus", size: 95, price: avg + 22, quality: "Hochwertig", platform: "VRBO", distance: 1.5 },
    ],
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
      let data: WeekResponse;
      if (MAKE_WEBHOOK_URL) {
        const r = await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Webhook error");
        data = (await r.json()) as WeekResponse;
      } else {
        await new Promise((res) => setTimeout(res, 900));
        data = buildMockResponse(Number(aktuellerPreis) || 90, wocheDate);
      }
      setResults(data);
      setOpenDayIdx(null);
      setStep("results");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
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
    <main className="relative min-h-screen bg-ink text-ink-foreground">
      <div
        className="fixed inset-0 z-0 [filter:grayscale(0.7)_brightness(0.8)] pointer-events-none"
        aria-hidden="true"
      >
        <MapContainer
          center={DE_CENTER}
          zoom={DE_ZOOM}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%", background: "hsl(var(--ink))" }}
        >
          <StaticMapBinder onReady={(m) => { mapRef.current = m; }} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
            subdomains="abcd"
          />
          {geo && (
            <GeoJSON
              data={geo}
              style={{
                fillColor: "hsl(0 0% 100%)",
                fillOpacity: 0.06,
                color: "hsl(0 0% 100% / 0.35)",
                weight: 1,
              }}
              interactive={false}
            />
          )}
          {plzBoundary && (
            <GeoJSON
              key={plz}
              data={plzBoundary}
              style={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.6,
                fillColor: "#ffffff",
                fillOpacity: 0.07,
              }}
              interactive={false}
            />
          )}
        </MapContainer>
      </div>

      <div className="fixed inset-0 z-[1] bg-black/25 pointer-events-none" aria-hidden="true" />

      <div className="relative z-[2]">
        <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
          <a href="/" className="text-2xl font-semibold tracking-tight">SmartRent</a>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-8 px-4 sm:px-10 py-16 min-h-screen">
          {/* PLZ panel */}
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

        <Footer />
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

const STATUS_BG: Record<DayRecommendation["status"], string> = {
  good: "bg-emerald-400/15 border-emerald-400/40 hover:border-emerald-300/70",
  event: "bg-amber-400/15 border-amber-400/40 hover:border-amber-300/70",
  low: "bg-red-400/15 border-red-400/40 hover:border-red-300/70",
};
const STATUS_DOT: Record<DayRecommendation["status"], string> = {
  good: "bg-emerald-400",
  event: "bg-amber-400",
  low: "bg-red-400",
};
const STATUS_LABEL: Record<DayRecommendation["status"], string> = {
  good: "Gute Auslastung — Preis halten",
  event: "Event in der Nähe — Preis erhöhen",
  low: "Schwache Nachfrage — Preis senken",
};

const LegendDot = ({ className, label }: { className: string; label: string }) => (
  <span className="inline-flex items-center gap-2">
    <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
    {label}
  </span>
);

const MonthGrid = ({
  days, expandedDay, onToggle,
}: {
  days: DayRecommendation[];
  expandedDay: string | null;
  onToggle: (d: string) => void;
}) => {
  const expanded = useMemo(() => days.find((d) => d.datum === expandedDay) ?? null, [days, expandedDay]);
  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-white/10 bg-black/50 p-5 sm:p-6 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
          {days.map((d) => {
            const date = new Date(d.datum);
            const active = expandedDay === d.datum;
            return (
              <button
                key={d.datum}
                type="button"
                onClick={() => onToggle(d.datum)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition-all",
                  STATUS_BG[d.status],
                  active && "ring-2 ring-white/70",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-white/70">
                    {format(date, "EE", { locale: de })}
                  </span>
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[d.status])} />
                </div>
                <div className="mt-0.5 text-sm font-medium text-white">{format(date, "dd.MM.")}</div>
                <div className="mt-1 text-sm font-semibold text-white">{d.empfohlener_preis} €</div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key={expanded.datum}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-6 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]"
          >
            <div className="flex items-center gap-3">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[expanded.status])} />
              <h4 className="text-base font-medium text-white">
                {format(new Date(expanded.datum), "EEEE, dd. MMMM yyyy", { locale: de })}
              </h4>
            </div>
            <p className="mt-2 text-sm text-white/70">{STATUS_LABEL[expanded.status]}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-white/60">Empfohlener Preis</div>
                <div className="mt-1 text-lg font-semibold text-white">{expanded.empfohlener_preis} €</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Auslastung</div>
                <div className="mt-1 text-lg font-semibold text-white">{expanded.auslastung}%</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Event</div>
                <div className="mt-1 text-sm text-white/80">{expanded.event ?? "—"}</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-white/50">
              Konkurrenzpreise und detaillierte Event-Daten folgen in Kürze.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wochenansicht: Karten sind klickbar – beim Klick erscheint inline die
// Begründung („Warum dieser Preis?") für den jeweiligen Tag.
const WeekRow = ({
  days,
  expandedDay,
  onToggle,
}: {
  days: DayRecommendation[];
  expandedDay: string | null;
  onToggle: (datum: string) => void;
}) => {
  const reasons: Record<DayRecommendation["status"], string> = {
    good: "Solide Marktnachfrage und stabile Buchungslage – wir empfehlen einen marktüblichen Preis.",
    event: "In der Nähe findet ein Event statt – die Nachfrage steigt, ein höherer Preis ist gerechtfertigt.",
    low: "Schwächere Nachfrage zu diesem Tag – ein leicht reduzierter Preis erhöht die Buchungswahrscheinlichkeit.",
  };

  return (
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {days.map((d) => {
        const date = new Date(d.datum);
        const isOpen = expandedDay === d.datum;
        return (
          <button
            type="button"
            key={d.datum}
            onClick={() => onToggle(d.datum)}
            aria-expanded={isOpen}
            className={cn(
              "text-left rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)] bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
              STATUS_BG[d.status],
              isOpen && "ring-2 ring-white/70 -translate-y-1",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-white/70">
                {format(date, "EEEE", { locale: de })}
              </span>
              <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[d.status])} />
            </div>
            <div className="mt-1 text-sm text-white/80">{format(date, "dd. MMM", { locale: de })}</div>
            <p className="mt-3 text-2xl font-semibold text-white">
              {d.empfohlener_preis} €<span className="text-sm font-normal text-white/60">/Nacht</span>
            </p>
            <p className="mt-1 text-xs text-white/60">Auslastung: {d.auslastung}%</p>
            <p className="mt-3 text-xs text-white/70 line-clamp-2">{d.reason}</p>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/15 pt-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/50">Warum dieser Preis?</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/85">
                      {reasons[d.status]}
                    </p>
                    {d.event && (
                      <p className="mt-2 text-xs text-amber-200/90">📍 {d.event}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/40">
              {isOpen ? "Schließen" : "Details ansehen"}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default Preise;
