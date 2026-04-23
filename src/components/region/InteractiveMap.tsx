import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, RotateCcw, ArrowRight, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { CountryConfig } from "./regionData";

interface Props {
  country: CountryConfig;
}

interface RegionFeatureProps {
  name?: string;
  NAME_1?: string;
  // accept any extra keys without typing them
  [k: string]: unknown;
}

const getRegionName = (props: RegionFeatureProps | null | undefined): string => {
  if (!props) return "Unbekannt";
  return (
    (props.name as string) ||
    (props.NAME_1 as string) ||
    (props["NAME"] as string) ||
    "Unbekannt"
  );
};

/**
 * Interactive country map.
 * - Locked to the selected country (bounds + minZoom).
 * - Renders sub-regions (Bundesländer / Kantone) as interactive GeoJSON.
 * - Hover highlights + tooltip; click zooms to region and shows detail panel.
 */
export const InteractiveMap = ({ country }: Props) => {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Load GeoJSON when the country changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setGeo(null);
    setSelectedRegion(null);
    fetch(country.geoJsonUrl)
      .then((r) => r.json())
      .then((data: FeatureCollection) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setGeo(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country.geoJsonUrl]);

  // Style features based on hover/selection state.
  const styleFor = useMemo(() => {
    return (feature?: Feature<Geometry, RegionFeatureProps>): PathOptions => {
      const name = getRegionName(feature?.properties);
      const isSelected = selectedRegion === name;
      const isHovered = hoveredRegion === name;
      return {
        fillColor: isSelected || isHovered ? `hsl(${country.accentHsl})` : "hsl(0 0% 80%)",
        weight: isSelected ? 2 : 1,
        color: "hsl(0 0% 100%)",
        fillOpacity: isSelected ? 0.85 : isHovered ? 0.7 : 0.45,
      };
    };
  }, [country.accentHsl, hoveredRegion, selectedRegion]);

  const onEachFeature = (feature: Feature<Geometry, RegionFeatureProps>, layer: Layer) => {
    const name = getRegionName(feature.properties);
    layer.bindTooltip(name, { sticky: true, direction: "top", className: "region-tooltip" });
    layer.on({
      mouseover: () => setHoveredRegion(name),
      mouseout: () => setHoveredRegion(null),
      click: (e: LeafletMouseEvent) => {
        setSelectedRegion(name);
        // Zoom to region bounds
        const target = e.target as L.Path & { getBounds?: () => L.LatLngBounds };
        if (mapRef.current && target.getBounds) {
          mapRef.current.flyToBounds(target.getBounds(), { duration: 0.6, padding: [20, 20] });
        }
      },
    });
  };

  const resetView = () => {
    setSelectedRegion(null);
    if (mapRef.current) {
      mapRef.current.flyTo(country.center, country.zoom, { duration: 0.6 });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-card">
      <MapContainer
        center={country.center}
        zoom={country.zoom}
        minZoom={country.zoom}
        maxZoom={12}
        maxBounds={country.bounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "hsl(var(--card))" }}
        whenCreated={(m) => {
          mapRef.current = m;
        }}
      >
        <MapRefBinder mapRef={mapRef} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
          subdomains="abcd"
        />
        {geo && (
          // key forces a remount when country changes so styles reset cleanly
          <GeoJSON
            key={country.code + (selectedRegion ?? "") + (hoveredRegion ?? "")}
            data={geo}
            style={styleFor as L.StyleFunction}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Loading skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              <span className="text-xs">Karte wird geladen…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1 rounded-full bg-card p-1 shadow-md">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Hineinzoomen"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Herauszoomen"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Ansicht zurücksetzen"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Region detail panel */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            key={selectedRegion}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4 left-4 z-[400] w-[min(320px,calc(100%-7rem))] rounded-xl border border-border bg-card/95 p-5 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider">
                  {country.regionTermSingular}
                </p>
                <h4 className="mt-0.5 text-base font-medium text-foreground">{selectedRegion}</h4>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Verfügbare Pakete in {selectedRegion}. Sprich mit unserem lokalen Team unter{" "}
              <a className="text-foreground underline" href={`mailto:${country.contact}`}>
                {country.contact}
              </a>
              .
            </p>
            <a
              href={`${country.href}?region=${encodeURIComponent(selectedRegion)}`}
              className="group mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-all duration-300 hover:gap-3"
            >
              Preise anzeigen
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Older react-leaflet versions (v4) ignored `whenCreated`; this small helper
 * captures the map instance via `useMap()` so controls work reliably.
 */
const MapRefBinder = ({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
};
