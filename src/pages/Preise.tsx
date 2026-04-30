import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;
import "leaflet/dist/leaflet.css";
import { Footer } from "@/components/Footer";

const navItems = [
  { label: "Über uns", href: "/#about" },
  { label: "Leistungen", href: "/#services" },
  { label: "Referenzen", href: "/#testimonials" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Kontakt", href: "/#contact" },
];

const DE_CENTER: [number, number] = [51.1657, 10.4515];
const DE_ZOOM = 6;

// Replace this with the real Make.com webhook URL when ready.
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

/** Fully disables all user interaction on the leaflet map (decorative only). */
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

  const [plz, setPlz] = useState("");
  const [plzError, setPlzError] = useState<string | null>(null);

  const [zimmer, setZimmer] = useState(2);
  const [maxGaeste, setMaxGaeste] = useState(4);
  const [aktuellerPreis, setAktuellerPreis] = useState<number | "">("");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [results, setResults] = useState<MonthRecommendation[] | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // Load Germany GeoJSON once for the decorative map outline.
  useEffect(() => {
    let cancelled = false;
    fetch("/maps/germany-states.geojson")
      .then((r) => r.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePlzSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{5}$/.test(plz)) {
      setPlzError("Bitte gib eine gültige 5-stellige PLZ ein");
      return;
    }
    setPlzError(null);

    // Try to resolve PLZ → coordinates and fly the map to that city.
    try {
      const r = await fetch(`https://api.zippopotam.us/de/${plz}`);
      if (r.ok) {
        const data = await r.json();
        const place = data?.places?.[0];
        if (place && mapRef.current) {
          const lat = parseFloat(place.latitude);
          const lng = parseFloat(place.longitude);
          const map = mapRef.current;
          const targetZoom = 12;
          // Project the target latlng at the desired zoom, then shift it
          // horizontally so the city appears in the right-middle of the
          // viewport (left ~30% is occupied by the PLZ panel).
          const point = map.project([lat, lng], targetZoom);
          const size = map.getSize();
          const offsetX = size.x * 0.25; // shift map center left → city moves right
          const shifted = map.unproject([point.x - offsetX, point.y], targetZoom);
          map.flyTo(shifted, targetZoom, { duration: 0.8, easeLinearity: 0.25 });
        }
      }
    } catch {
      // Silent — map simply stays at the Germany overview.
    }

    setStep("details");
    setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
  };

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    if (!aktuellerPreis || Number(aktuellerPreis) < 1) {
      setDetailsError("Bitte gib einen gültigen Preis pro Nacht ein.");
      return;
    }
    setStep("loading");

    const payload = {
      plz,
      zimmer,
      max_gaeste: maxGaeste,
      aktueller_preis: Number(aktuellerPreis),
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
    setResults(null);
  };

  return (
    <main className="relative min-h-screen bg-ink text-ink-foreground">
      {/* Fixed, immersive map background — never scrolls with page content. */}
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
        </MapContainer>
      </div>

      {/* Fixed dark overlay above the map for readability. */}
      <div className="fixed inset-0 z-[1] bg-black/45 pointer-events-none" aria-hidden="true" />

      {/* Content layer — scrolls naturally above the fixed map. */}
      <div className="relative z-[2]">
        {/* Navbar */}
        <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
          <a href="/" className="text-2xl font-semibold tracking-tight">SmartRent</a>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-start gap-8 px-6 sm:px-10 lg:pl-16 py-16 min-h-screen">
          {/* PLZ panel */}
          <motion.div
            layout
            animate={{ y: step === "plz" ? 0 : -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md p-8 shadow-2xl">
              <h1 className="display text-3xl sm:text-4xl text-white">
                Wo befindet sich dein Objekt?
              </h1>
              <p className="mt-3 text-sm text-white/70">
                Gib deine Postleitzahl ein, um lokale Preisempfehlungen zu erhalten.
              </p>

              <form onSubmit={handlePlzSubmit} className="mt-6">
                <label htmlFor="plz" className="block text-xs font-medium text-white/80">
                  Postleitzahl
                </label>
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
                  className="mt-2 w-full rounded-full bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-70"
                />
                {plzError && (
                  <p role="alert" className="mt-2 text-xs text-red-300">{plzError}</p>
                )}

                {step === "plz" ? (
                  <button
                    type="submit"
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90"
                  >
                    Weiter
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </button>
                ) : (
                  <p className="mt-4 text-xs text-white/60">PLZ bestätigt: <span className="text-white">{plz}</span></p>
                )}
              </form>
            </div>
          </motion.div>

          {/* Step 2 — Listing details */}
          <AnimatePresence>
            {(step === "details" || step === "loading" || step === "error") && (
              <motion.div
                ref={detailsRef}
                key="details"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
              >
                <form
                  onSubmit={handleDetailsSubmit}
                  className="rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md p-8 shadow-2xl"
                >
                  <h2 className="display text-2xl sm:text-3xl text-white">Dein Objekt im Detail</h2>
                  <p className="mt-2 text-sm text-white/70">Ein paar Eckdaten, dann berechnen wir deine Preisempfehlung.</p>

                  <div className="mt-6 space-y-5">
                    <NumberStepper
                      label="Wie viele Zimmer hat dein Objekt?"
                      value={zimmer}
                      min={1}
                      max={10}
                      onChange={setZimmer}
                      disabled={step === "loading"}
                    />
                    <NumberStepper
                      label="Maximale Gästeanzahl"
                      value={maxGaeste}
                      min={1}
                      max={20}
                      onChange={setMaxGaeste}
                      disabled={step === "loading"}
                    />
                    <div>
                      <label htmlFor="preis" className="block text-xs font-medium text-white/80">
                        Dein aktueller Preis pro Nacht (€)
                      </label>
                      <input
                        id="preis"
                        inputMode="numeric"
                        min={1}
                        value={aktuellerPreis}
                        disabled={step === "loading"}
                        onChange={(e) => {
                          setDetailsError(null);
                          const v = e.target.value.replace(/\D/g, "");
                          setAktuellerPreis(v === "" ? "" : Number(v));
                        }}
                        placeholder="z.B. 95"
                        className="mt-2 w-full rounded-full bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-70"
                      />
                    </div>
                  </div>

                  {detailsError && (
                    <p role="alert" className="mt-3 text-xs text-red-300">{detailsError}</p>
                  )}
                  {step === "error" && (
                    <p role="alert" className="mt-3 text-xs text-red-300">
                      Preis konnte nicht berechnet werden. Bitte versuche es erneut.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={step === "loading"}
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90 disabled:opacity-60"
                  >
                    {step === "loading" ? "Wird berechnet…" : "Preisempfehlung berechnen"}
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                      {step === "loading"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3 — Loading skeleton grid */}
          {step === "loading" && (
            <div className="w-full max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md p-6 h-40 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Results */}
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
                      className="rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md p-6 transition-all duration-300 hover:border-white/25 hover:-translate-y-0.5"
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

                <div className="mt-10 rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md p-8">
                  <h3 className="text-xl font-medium text-white">Warum empfehlen wir diese Preise?</h3>
                  <p className="mt-3 text-sm text-white/70">
                    In Kürze erklärt dir unsere KI im Detail, wie Standortdaten, saisonale
                    Nachfrage und lokale Events deine Preisempfehlung beeinflussen.
                  </p>
                  <button
                    type="button"
                    onClick={resetToDetails}
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90"
                  >
                    Preise anpassen
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </button>
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
