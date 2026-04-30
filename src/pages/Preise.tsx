import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
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
const DE_BOUNDS: [[number, number], [number, number]] = [[47.27, 5.87], [55.06, 15.04]];

/** Captures the leaflet map instance for imperative control (zoom-to-PLZ). */
const MapRefBinder = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    // Disable user interaction — purely decorative background.
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
  }, [map, onReady]);
  return null;
};

/**
 * Best-effort PLZ → coordinates lookup using the open Zippopotam.us API.
 * Falls back gracefully if the request fails.
 */
const lookupPlz = async (
  plz: string,
): Promise<{ lat: number; lng: number; place: string } | null> => {
  try {
    const r = await fetch(`https://api.zippopotam.us/de/${plz}`);
    if (!r.ok) return null;
    const data = await r.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      place: place["place name"],
    };
  } catch {
    return null;
  }
};

const Preise = () => {
  const mapRef = useRef<L.Map | null>(null);
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [plz, setPlz] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Germany GeoJSON once.
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{5}$/.test(plz)) {
      setError("Bitte gib eine gültige 5-stellige Postleitzahl ein.");
      return;
    }
    setLoading(true);
    const result = await lookupPlz(plz);
    setLoading(false);
    if (!result) {
      setError("Postleitzahl nicht gefunden. Bitte überprüfe deine Eingabe.");
      return;
    }
    setInfo(`${plz} • ${result.place}`);
    if (mapRef.current) {
      mapRef.current.flyTo([result.lat, result.lng], 11, { duration: 1.2 });
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      {/* Hero shell — same dark rounded panel as homepage */}
      <section className="p-3 sm:p-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink text-ink-foreground">
          <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
            <a href="/" className="text-2xl font-semibold tracking-tight">SmartRent</a>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((n) => (
                <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
              ))}
            </nav>
          </div>

          {/* Map area with overlay panel */}
          <div className="relative mt-10 mx-3 sm:mx-6 mb-6 rounded-[1.5rem] overflow-hidden h-[70vh] min-h-[560px]">
            {/* Decorative map */}
            <div className="absolute inset-0 [filter:grayscale(0.6)_brightness(0.85)]">
              <MapContainer
                center={DE_CENTER}
                zoom={DE_ZOOM}
                minZoom={5}
                maxZoom={12}
                maxBounds={DE_BOUNDS}
                maxBoundsViscosity={1}
                zoomControl={false}
                attributionControl={false}
                style={{ width: "100%", height: "100%", background: "hsl(var(--ink))" }}
              >
                <MapRefBinder onReady={(m) => (mapRef.current = m)} />
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
                  />
                )}
              </MapContainer>
            </div>

            {/* Subtle dark vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/60" />

            {/* Overlay input panel */}
            <div className="relative z-10 flex h-full items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-black/65 backdrop-blur-md p-8 shadow-2xl"
              >
                <h1 className="display text-3xl sm:text-4xl text-white">
                  Wo befindet sich dein Objekt?
                </h1>
                <p className="mt-3 text-sm text-white/70">
                  Gib die Postleitzahl ein, um regionale Preise und Pakete für deinen Standort
                  zu sehen.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
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
                    onChange={(e) => {
                      setError(null);
                      setPlz(e.target.value.replace(/\D/g, "").slice(0, 5));
                    }}
                    placeholder="z.B. 10115"
                    className="mt-2 w-full rounded-full bg-white/10 border border-white/15 px-5 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  {error && (
                    <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>
                  )}
                  {info && !error && (
                    <p className="mt-2 text-xs text-white/70">{info}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-6 inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90 disabled:opacity-60"
                  >
                    {loading ? "Wird gesucht…" : "Region anzeigen"}
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Preise;
