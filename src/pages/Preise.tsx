import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;
import "leaflet/dist/leaflet.css";

import { Switch } from "@/components/ui/switch";
import { WeekPicker } from "@/components/WeekPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fetchPriceRecommendation } from "@/api/pricing";
import type { DotColor, CardColor, DayCard, Competitor, EventItem, SummaryBlock, MarketBlock, WeekResponse, PricingRequest } from "@/api/types";
import { PriceRecommendationHeader } from "@/components/PriceRecommendationHeader";

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
  const [cityName, setCityName] = useState("");
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
  const [navScrolled, setNavScrolled] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const [overlayText, setOverlayText] = useState("Wird geladen …");

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

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
        if (place) setCityName(place["place name"] ?? "");
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

    const payload: PricingRequest = {
      plz,
      art: art!,
      flaeche_qm: Number(flaeche),
      zimmer,
      max_gaeste: maxGaeste,
      komfort: komfort!,
      aktueller_preis: Number(aktuellerPreis),
      ansicht,
      woche_start: format(wocheDate, "yyyy-MM-dd"),
      plattformen,
      aktualitaetspruefung,
      besonderheiten,
    };

    try {
      const data = await fetchPriceRecommendation(payload);
      setResults(data);
      setOpenDayIdx(null);
      setStep("results");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    } catch {
      setStep("error");
    }
  };

  const resetToDetails = () => {
    setShowOverlay(true);
    setOverlayProgress(0);
    setOverlayText("Wird geladen …");
  };

  useEffect(() => {
    if (!showOverlay) return;

    const timeline = [
      { time: 600, progress: 18, text: "Wird geladen …" },
      { time: 1100, progress: 42, text: "Marktdaten werden abgerufen …" },
      { time: 1800, progress: 67, text: "Preise werden berechnet …" },
      { time: 2600, progress: 89, text: "Fast fertig …" },
      { time: 3200, progress: 100, text: "Weiterleitung …" },
    ];

    timeline.forEach((step) => {
      setTimeout(() => {
        setOverlayProgress(step.progress);
        setOverlayText(step.text);
      }, step.time);
    });
  }, [showOverlay]);

  const cardCls = "w-full rounded-2xl bg-white p-8 shadow-sm";
  const cardStyle = { border: "0.5px solid #E8E4DE" } as React.CSSProperties;
  const inputCls = "mt-2 w-full rounded-xl bg-white px-5 py-3.5 text-base placeholder:text-[#9A8F85] focus:outline-none disabled:opacity-70";
  const inputStyle = { border: "0.5px solid #E8E4DE", color: "#1A1714" } as React.CSSProperties;
  const inputFocusCls = "focus:border-[#D4622A] focus:ring-[3px] focus:ring-[rgba(212,98,42,0.12)]";
  const labelCls = "block text-[13px] font-medium";

  return (
    <main className="relative min-h-screen text-[#1A1714]" style={{ background: "#F9F7F4" }}>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      >
        <MapContainer
          center={DE_CENTER}
          zoom={DE_ZOOM}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%", background: "#ffffff" }}
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
                fillColor: "#ffffff",
                fillOpacity: 0,
                color: "#bbbbbb",
                weight: 1,
                opacity: 0.6,
              }}
              interactive={false}
            />
          )}
          {plzBoundary && (
            <GeoJSON
              key={plz}
              data={plzBoundary}
              style={{
                color: "#999999",
                weight: 2,
                opacity: 0.85,
                fillColor: "#ffffff",
                fillOpacity: 0,
              }}
              interactive={false}
            />
          )}
        </MapContainer>
      </div>

      

      <div className="relative z-[2]">
        <header
          className="fixed top-0 inset-x-0 z-50 transition-shadow duration-200"
          style={{
            background: "rgba(212, 98, 42, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: navScrolled ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
          }}
        >
          <div className="flex items-center justify-between px-6 sm:px-10 py-4">
            <a href="/" className="text-2xl font-semibold tracking-tight text-white">SmartRent</a>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((n) => (
                <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
              ))}
            </nav>
          </div>
        </header>

        <div className="flex flex-col items-center gap-8 px-4 sm:px-10 pt-28 pb-16 min-h-screen">



          <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: step === "plz" ? 0 : -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full min-w-0 sm:min-w-[520px] max-w-[640px] ${step === "plz" ? "min-h-[calc(100vh-12rem)] flex items-center" : ""}`}
          >
            <div className={cardCls} style={cardStyle}>
              <h1 className="display text-3xl sm:text-4xl" style={{ color: "#1A1714" }}>
                Wo befindet sich dein Objekt?
              </h1>
              <p className="mt-3 text-sm" style={{ color: "#7A7068" }}>
                Gib deine Postleitzahl ein, um lokale Preisempfehlungen zu erhalten.
              </p>

              <form onSubmit={handlePlzSubmit} className="mt-6">
                <label htmlFor="plz" className={labelCls} style={{ color: "#7A7068" }}>Postleitzahl</label>
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
                  className={cn(inputCls, inputFocusCls)}
                  style={inputStyle}
                />
                {plzError && <p role="alert" className="mt-2 text-xs text-red-500">{plzError}</p>}

                {step === "plz" ? (
                  <PrimaryButton type="submit">Weiter</PrimaryButton>
                ) : (
                  <p className="mt-4 text-xs" style={{ color: "#9A8F85" }}>PLZ bestätigt: <span style={{ color: "#1A1714" }}>{plz}</span></p>
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
                <div className={cardCls} style={cardStyle}>
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-5" aria-label={`Schritt ${detailsStep} von 2`}>
                    <span className={cn("h-2 w-2 rounded-full transition-all", detailsStep === 1 ? "bg-[#D4622A]" : "bg-transparent border border-[#E8E4DE]")} />
                    <span className={cn("h-2 w-2 rounded-full transition-all", detailsStep === 2 ? "bg-[#D4622A]" : "bg-transparent border border-[#E8E4DE]")} />
                    <span className="ml-2 text-xs" style={{ color: "#9A8F85" }}>Schritt {detailsStep} von 2</span>
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
                          <h2 className="display text-2xl sm:text-3xl" style={{ color: "#1A1714" }}>Dein Objekt im Detail</h2>
                          <p className="mt-2 text-sm" style={{ color: "#7A7068" }}>Ein paar Eckdaten zu deinem Objekt.</p>

                          <div className="mt-6 space-y-5">
                            {/* Art */}
                            <div>
                              <label className={labelCls} style={{ color: "#7A7068" }}>Art des Objekts</label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ART_OPTIONS.map((opt) => (
                                  <PillButton key={opt} active={art === opt} onClick={() => setArt(opt)}>{opt}</PillButton>
                                ))}
                              </div>
                            </div>

                            {/* Wohnfläche */}
                            <div>
                              <label htmlFor="flaeche" className={labelCls} style={{ color: "#7A7068" }}>Wohnfläche (m²)</label>
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
                                  className={cn(inputCls, inputFocusCls, "pr-14")}
                                  style={inputStyle}
                                />
                                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9A8F85" }}>m²</span>
                              </div>
                            </div>

                            <NumberStepper label="Wie viele Zimmer hat dein Objekt?" value={zimmer} min={1} max={20} onChange={setZimmer} />
                            <NumberStepper label="Maximale Gästeanzahl" value={maxGaeste} min={1} max={20} onChange={setMaxGaeste} />

                            {/* Komfort */}
                            <div>
                              <label className={labelCls} style={{ color: "#7A7068" }}>Ausstattung & Komfort</label>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {KOMFORT_OPTIONS.map((opt) => {
                                  const active = komfort === opt.value;
                                  return (
                                    <button
                                      type="button"
                                      key={opt.value}
                                      onClick={() => setKomfort(opt.value)}
                                      className="rounded-xl p-4 text-left bg-white transition-all"
                                      style={{
                                        border: active ? "1.5px solid #D4622A" : "0.5px solid #E8E4DE",
                                      }}
                                    >
                                      <div className="text-sm font-medium" style={{ color: active ? "#1A1714" : "#7A7068" }}>{opt.value}</div>
                                      <div className="mt-1 text-xs" style={{ color: "#9A8F85" }}>{opt.desc}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Preis */}
                            <div>
                              <label htmlFor="preis" className={labelCls} style={{ color: "#7A7068" }}>Dein aktueller Preis pro Nacht (€)</label>
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
                                className={cn(inputCls, inputFocusCls)}
                                style={inputStyle}
                              />
                            </div>
                          </div>

                          {step1Error && <p role="alert" className="mt-3 text-xs text-red-500">{step1Error}</p>}

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
                          <h2 className="display text-2xl sm:text-3xl" style={{ color: "#1A1714" }}>Wie soll die Analyse laufen?</h2>
                          <p className="mt-2 text-sm" style={{ color: "#7A7068" }}>Je mehr Details, desto genauer deine Preisempfehlung.</p>

                          <div className="mt-6 space-y-6">
                            {/* Woche auswählen */}
                            <div>
                              <label className={labelCls} style={{ color: "#7A7068" }}>Welche Woche möchtest du analysieren?</label>
                              <WeekPicker value={wocheDate} onChange={setWocheDate} minDate={initialMonday} />
                            </div>

                            {/* Plattformen */}
                            <div>
                              <label className={labelCls} style={{ color: "#7A7068" }}>Auf welchen Plattformen bist du aktiv?</label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {PLATTFORM_OPTIONS.map((p) => (
                                  <PillButton key={p} active={plattformen.includes(p)} onClick={() => togglePlattform(p)}>{p}</PillButton>
                                ))}
                              </div>
                            </div>

                            {/* Aktualitätsprüfung */}
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-xs font-medium" style={{ color: "#1A1714" }}>Aktuelle Marktdaten prüfen</div>
                                <p className="mt-1 text-xs" style={{ color: "#7A7068" }}>Wir gleichen Konkurrenzpreise und lokale Events in Echtzeit ab.</p>
                              </div>
                              <Switch checked={aktualitaetspruefung} onCheckedChange={setAktualitaetspruefung} />
                            </div>

                            {/* Besonderheiten */}
                            <div>
                              <label className={labelCls} style={{ color: "#7A7068" }}>Besondere Merkmale (optional)</label>
                              <p className="mt-1 text-xs" style={{ color: "#9A8F85" }}>Erhöht die Genauigkeit der Empfehlung.</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {BESONDERHEITEN_OPTIONS.map((b) => (
                                  <PillButton key={b} active={besonderheiten.includes(b)} onClick={() => toggleBesonderheit(b)}>{b}</PillButton>
                                ))}
                              </div>
                            </div>
                          </div>

                          {step2Error && <p role="alert" className="mt-3 text-xs text-red-500">{step2Error}</p>}
                          {step === "error" && (
                            <p role="alert" className="mt-3 text-xs text-red-500">
                              Preis konnte nicht berechnet werden. Bitte versuche es erneut.
                            </p>
                          )}

                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setDetailsStep(1)}
                              disabled={step === "loading"}
                              className="rounded-full px-5 py-2 text-sm transition-colors disabled:opacity-60"
                              style={{ border: "0.5px solid #E8E4DE", color: "#7A7068", background: "#FFFFFF" }}
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
                  <div key={i} className="rounded-xl bg-white p-6 h-40 animate-pulse" style={{ border: "0.5px solid #E8E4DE" }} />
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
                  cityName={cityName}
                  openDayIdx={openDayIdx}
                  setOpenDayIdx={setOpenDayIdx}
                  aktuellerPreis={aktuellerPreis}
                />

                <div className="mt-8 flex justify-center">
                  <PrimaryButton type="button" onClick={resetToDetails}>Preise übernehmen</PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Price taking overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "#F9F7F4" }}
          >
            <div className="flex flex-col items-center gap-8 px-6 text-center">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex-shrink-0"
                  style={{ background: "#D4622A" }}
                />
                <span className="text-2xl font-semibold" style={{ color: "#1A1714" }}>
                  SmartRent
                </span>
              </div>

              {/* Headline */}
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: "#1A1714" }}>
                  Preis wird übernommen.
                </h2>
                <p className="mt-2 text-base" style={{ color: "#9A8F85" }}>
                  Du wirst automatisch weitergeleitet.
                </p>
              </div>

              {/* Progress bar container */}
              <div className="w-full max-w-sm">
                <div
                  className="h-0.75 rounded-full overflow-hidden"
                  style={{ background: "rgba(154, 143, 133, 0.25)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#D4622A" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${overlayProgress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-3 text-sm" style={{ color: "#9A8F85" }}>
                  {overlayText}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    className="rounded-full px-3 py-2 text-sm transition-all"
    style={{
      paddingLeft: 14,
      paddingRight: 14,
      background: active ? "#D4622A" : "#FFFFFF",
      border: active ? "1px solid #D4622A" : "0.5px solid #E8E4DE",
      color: active ? "#FFFFFF" : "#7A7068",
      fontWeight: active ? 500 : 400,
    }}
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
      <label className="block text-[13px] font-medium" style={{ color: "#7A7068" }}>{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= min}
          className="h-10 w-10 rounded-full text-lg leading-none disabled:opacity-40 bg-white"
          style={{ border: "0.5px solid #E8E4DE", color: "#1A1714" }}
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
          className="w-20 text-center rounded-full px-3 py-2 text-base focus:outline-none disabled:opacity-70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ background: "#F9F7F4", border: "0.5px solid #E8E4DE", color: "#1A1714" }}
        />
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          className="h-10 w-10 rounded-full text-lg leading-none disabled:opacity-40 bg-white"
          style={{ border: "0.5px solid #E8E4DE", color: "#1A1714" }}
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
  cityName,
  openDayIdx,
  setOpenDayIdx,
  aktuellerPreis,
}: {
  data: WeekResponse;
  plz: string;
  cityName?: string;
  openDayIdx: number | null;
  setOpenDayIdx: (i: number | null) => void;
  aktuellerPreis?: number | "";
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
      p && p === summary.best_day ? <span key={i} className="font-medium" style={{ color: "#2E7D32" }}>{p}</span> :
      p && p === summary.worst_day ? <span key={i} className="font-medium" style={{ color: "#C62828" }}>{p}</span> :
      <span key={i}>{p}</span>
    );
  };

  return (
    <>
      <PriceRecommendationHeader
        postalCode={plz}
        city={cityName || "Berlin Mitte"}
        country="Deutschland"
      />
      <p className="mt-3 text-sm" style={{ color: "#7A7068" }}>
        7 Tage im Detail – klicke auf eine Karte für die Begründung.
      </p>

      {/* 7 Day cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {data.days.map((d, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setOpenDayIdx(i)}
            className="text-left rounded-xl overflow-hidden flex bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4622A]/40"
            style={{ border: "0.5px solid #E8E4DE" }}
          >
            <div
              className="self-stretch flex-shrink-0"
              style={{ width: 3, background: "#D4622A", borderRadius: 2, margin: "12px 0" }}
            />
            <div className="px-4 py-4 flex-1 min-w-0">
              <span
                className="uppercase font-medium"
                style={{ fontSize: 11, color: "#9A8F85", letterSpacing: "0.07em" }}
              >
                {d.weekday}
              </span>
              <div className="mt-0.5" style={{ fontSize: 13, color: "#7A7068" }}>{d.label}</div>
              <p className="mt-2 font-semibold leading-tight" style={{ fontSize: 24, color: "#1A1714" }}>{d.price}</p>
              <p
                className="mt-2 uppercase"
                style={{ fontSize: 11, color: "#D4622A", letterSpacing: "0.07em", marginTop: 4 }}
              >
                Details ansehen
              </p>
            </div>
          </button>
        ))}
      </div>


      {/* Market section */}
      <div className="mt-6 rounded-2xl bg-white p-6" style={{ border: "0.5px solid #E8E4DE" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-lg font-medium" style={{ color: "#1A1714" }}>Konkurrenz im Markt</h3>
          {market.level && (
            <span className="rounded-full px-3 py-1 text-xs" style={{ border: "0.5px solid #E8E4DE", color: "#7A7068" }}>
              {market.level}
            </span>
          )}
        </div>
        {competitors.length > 0 && (
          <div className="mt-5 space-y-2.5">
            {competitors.map((c, i) => {
              const priceNum = parseInt(c.price.match(/\d+/)?.[0] || "0");
              const minNum = market.min ? parseInt(market.min.match(/\d+/)?.[0] || "0") : 71;
              const maxNum = market.max ? parseInt(market.max.match(/\d+/)?.[0] || "0") : 131;
              const fillPct = ((priceNum - minNum) / (maxNum - minNum)) * 100;
              const isHighlight = c.platform === "Booking.com";
              const qualityBg = c.quality === "Hochwertig"
                ? "rgba(212, 98, 42, 0.12)"
                : "rgba(154, 143, 133, 0.15)";
              const qualityColor = c.quality === "Hochwertig" ? "#D4622A" : "#9A8F85";

              return (
                <div key={i}>
                  {isHighlight && (
                    <div className="text-xs font-medium mb-1.5" style={{ color: "#D4622A", background: "rgba(212,98,42,0.08)", padding: "2px 10px", display: "inline-block", borderRadius: 6 }}>
                      stärkster Mitbewerber
                    </div>
                  )}
                  <div
                    style={{
                      background: "#F9F7F4",
                      border: isHighlight ? "2px solid #D4622A" : "1px solid rgba(154, 143, 133, 0.3)",
                      borderRadius: 12,
                      padding: "16px 20px",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div style={{ color: "#1A1714", fontSize: 14, fontWeight: 500 }}>
                          {c.type} · {c.size_sqm}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div style={{ color: "#1A1714", fontSize: 20, fontWeight: 600 }}>
                          {c.price}
                        </div>
                        <div
                          className="text-xs mt-1"
                          style={{
                            background: qualityBg,
                            color: qualityColor,
                            padding: "2px 8px",
                            borderRadius: 4,
                            display: "inline-block",
                            fontWeight: 500,
                          }}
                        >
                          {c.quality}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2" style={{ fontSize: 12, color: "#9A8F85" }}>
                      <span>{c.platform}</span>
                      <span>{c.distance_km}</span>
                    </div>
                    <div className="mt-3">
                      <div style={{ background: "rgba(154, 143, 133, 0.2)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            background: "#D4622A",
                            height: "100%",
                            width: `${Math.max(0, Math.min(100, fillPct))}%`,
                            borderRadius: 3,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day modal */}
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpenDayIdx(null)}>
        <DialogContent className="max-w-lg" style={{ background: "#FFFFFF", border: "0.5px solid #E8E4DE" }}>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: "#1A1714" }}>
                  {open.weekday} · {open.label}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                {aktuellerPreis !== "" && Number(aktuellerPreis) > 0 && (
                  <p className="text-sm line-through" style={{ color: "#9A8F85" }}>{Number(aktuellerPreis)} €/Nacht</p>
                )}
                <p className="text-3xl font-semibold" style={{ color: "#1A1714" }}>{open.price}</p>
                <p className="mt-1 text-xs" style={{ color: "#7A7068" }}>{open.dot_label} · {open.occupancy}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "#1A1714" }}>{open.detail_text}</p>
              {open.active_events && open.active_events.length > 0 && (
                <div className="mt-3 rounded-lg p-3" style={{ border: "1px solid rgba(212,98,42,0.25)", background: "rgba(212,98,42,0.06)" }}>
                  <p className="text-xs uppercase tracking-wide" style={{ color: "#D4622A", letterSpacing: "0.07em" }}>Aktive Events</p>
                  <p className="mt-1 text-sm" style={{ color: "#1A1714" }}>{open.active_events.join(", ")}</p>
                </div>
              )}
              {open.change_label && (
                <p className="mt-4 text-sm font-medium" style={{ color: "#7A7068" }}>{open.change_label}</p>
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
    <div className="text-xs" style={{ color: "#9A8F85" }}>{label}</div>
    <div className="mt-1 text-lg font-semibold" style={{ color: "#1A1714" }}>{value}</div>
  </div>
);

export default Preise;
