import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;
import "leaflet/dist/leaflet.css";
import { Footer } from "@/components/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
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

const MAKE_WEBHOOK_URL = "";

type MonthRecommendation = {
  monat: string;
  empfohlener_preis: number;
  auslastung: number;
  event: string;
};

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

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

const buildMockResponse = (): MonthRecommendation[] => {
  const events: Record<string, string> = {
    Februar: "Karneval",
    Mai: "Maifeiertage",
    September: "Oktoberfest",
    Oktober: "Oktoberfest",
    Dezember: "Weihnachtsmärkte",
  };
  return MONTHS.map((m, i) => {
    const base = 70 + ((i * 13) % 70);
    const occ = 55 + ((i * 7 + 3) % 38);
    return {
      monat: m,
      empfohlener_preis: base,
      auslastung: occ,
      event: events[m] ?? "Kein besonderes Event",
    };
  });
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
  const [zeitrahmen, setZeitrahmen] = useState<"einzelne_tage" | "blockbuchung" | null>(null);
  const [datumVon, setDatumVon] = useState<Date | undefined>();
  const [datumBis, setDatumBis] = useState<Date | undefined>();
  const [mindestaufenthalt, setMindestaufenthalt] = useState<number | "">("");
  const [plattformen, setPlattformen] = useState<string[]>([]);
  const [aktualitaetspruefung, setAktualitaetspruefung] = useState(true);
  const [besonderheiten, setBesonderheiten] = useState<string[]>([]);

  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const [results, setResults] = useState<MonthRecommendation[] | null>(null);
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
    if (!zeitrahmen) return setStep2Error("Bitte wähle einen Zeitrahmen.");
    if (zeitrahmen === "einzelne_tage" && (!datumVon || !datumBis)) {
      return setStep2Error("Bitte wähle Check-in und Check-out Daten.");
    }
    if (zeitrahmen === "blockbuchung" && (!mindestaufenthalt || Number(mindestaufenthalt) < 1)) {
      return setStep2Error("Bitte gib einen Mindestaufenthalt an.");
    }
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
      zeitrahmen,
      datum_von: datumVon ? format(datumVon, "yyyy-MM-dd") : null,
      datum_bis: datumBis ? format(datumBis, "yyyy-MM-dd") : null,
      mindestaufenthalt: zeitrahmen === "blockbuchung" ? Number(mindestaufenthalt) : null,
      plattformen,
      aktualitaetspruefung,
      besonderheiten,
    };

    try {
      let data: MonthRecommendation[];
      if (MAKE_WEBHOOK_URL) {
        const r = await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error("Webhook error");
        data = (await r.json()) as MonthRecommendation[];
      } else {
        await new Promise((res) => setTimeout(res, 900));
        data = buildMockResponse();
      }
      setResults(data);
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
                            {/* Zeitrahmen */}
                            <div>
                              <label className={labelCls}>Für welchen Zeitraum brauchst du Preise?</label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <PillButton active={zeitrahmen === "einzelne_tage"} onClick={() => setZeitrahmen("einzelne_tage")}>Einzelne Tage</PillButton>
                                <PillButton active={zeitrahmen === "blockbuchung"} onClick={() => setZeitrahmen("blockbuchung")}>Blockbuchung (7+ Tage)</PillButton>
                              </div>

                              {zeitrahmen === "einzelne_tage" && (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <DateField label="Check-in" value={datumVon} onChange={setDatumVon} />
                                  <DateField label="Check-out" value={datumBis} onChange={setDatumBis} disabled={(d) => !!datumVon && d < datumVon} />
                                </div>
                              )}
                              {zeitrahmen === "blockbuchung" && (
                                <div className="mt-4">
                                  <label htmlFor="mindest" className={labelCls}>Mindestaufenthalt (Nächte)</label>
                                  <input
                                    id="mindest"
                                    inputMode="numeric"
                                    min={1}
                                    value={mindestaufenthalt}
                                    onChange={(e) => {
                                      const v = e.target.value.replace(/\D/g, "");
                                      setMindestaufenthalt(v === "" ? "" : Number(v));
                                    }}
                                    placeholder="z.B. 7"
                                    className={inputCls}
                                  />
                                </div>
                              )}
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
                <h2 className="display text-3xl sm:text-4xl text-white">
                  Deine Preisempfehlung für {plz}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Monatliche Empfehlungen basierend auf Standort, Auslastung und lokalen Events.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.map((r) => (
                    <article
                      key={r.monat}
                      className="rounded-2xl border border-white/10 bg-black/50 p-6 transition-all duration-300 hover:border-white/25 hover:-translate-y-0.5 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]"
                    >
                      <h3 className="text-xl font-medium text-white">{r.monat}</h3>
                      <p className="mt-3 text-2xl font-semibold text-white">
                        {r.empfohlener_preis} €<span className="text-sm font-normal text-white/60">/Nacht</span>
                      </p>
                      <p className="mt-1 text-xs text-white/60">Auslastung: {r.auslastung}%</p>
                      {r.event && r.event !== "Kein besonderes Event" && (
                        <span className="mt-4 inline-flex items-center rounded-full bg-gold/20 text-[hsl(var(--gold))] px-3 py-1 text-xs font-medium">
                          {r.event}
                        </span>
                      )}
                    </article>
                  ))}
                </div>

                <div className="mt-10 rounded-2xl border border-white/10 bg-black/50 p-8 [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
                  <h3 className="text-xl font-medium text-white">Warum empfehlen wir diese Preise?</h3>
                  <p className="mt-3 text-sm text-white/70">
                    In Kürze erklärt dir unsere KI im Detail, wie Standortdaten, saisonale
                    Nachfrage und lokale Events deine Preisempfehlung beeinflussen.
                  </p>
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

const DateField = ({
  label, value, onChange, disabled,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  disabled?: (d: Date) => boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-white/80">{label}</label>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-2 w-full inline-flex items-center justify-between rounded-full bg-white/10 border border-white/15 px-5 py-3 text-sm text-white hover:border-white/30 transition-colors"
        >
          <span className={cn(!value && "text-white/40")}>
            {value ? format(value, "dd. MMM yyyy", { locale: de }) : "Datum wählen"}
          </span>
          <CalendarIcon className="h-4 w-4 text-white/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  </div>
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

export default Preise;
