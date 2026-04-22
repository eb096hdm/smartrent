import { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { RegionInfo } from "./regionData";

// Public-domain world topojson, standard fixture used by react-simple-maps docs.
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Approximate centroids for available regions (longitude, latitude).
const REGION_CENTROIDS: Record<string, [number, number]> = {
  DEU: [10.45, 51.16],
  AUT: [14.55, 47.52],
  CHE: [8.23, 46.82],
  USA: [-98.58, 39.83],
  GBR: [-1.17, 52.36],
  FRA: [2.21, 46.23],
  ITA: [12.57, 41.87],
  ESP: [-3.75, 40.46],
  JPN: [138.25, 36.2],
  SGP: [103.82, 1.35],
};

interface Props {
  availableRegions: RegionInfo[];
  selectedRegion: RegionInfo | null;
  onSelectRegion: (region: RegionInfo | null) => void;
}

interface ViewState {
  coordinates: [number, number];
  zoom: number;
}

const DEFAULT_VIEW: ViewState = { coordinates: [10, 30], zoom: 1 };

/**
 * Interactive SVG world map.
 * - Available countries are highlighted and clickable.
 * - Other countries are dimmed and disabled.
 * - Selecting a region zooms in smoothly.
 */
export const InteractiveMap = ({ availableRegions, selectedRegion, onSelectRegion }: Props) => {
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
  const [hovered, setHovered] = useState<string | null>(null);

  const availableCodes = new Set(availableRegions.map((r) => r.code));

  const handleSelect = (code: string) => {
    const region = availableRegions.find((r) => r.code === code);
    if (!region) return;
    const centroid = REGION_CENTROIDS[code];
    if (centroid) setView({ coordinates: centroid, zoom: 4 });
    onSelectRegion(region);
  };

  const reset = () => {
    setView(DEFAULT_VIEW);
    onSelectRegion(null);
  };

  const zoomIn = () => setView((v) => ({ ...v, zoom: Math.min(v.zoom * 1.5, 8) }));
  const zoomOut = () => setView((v) => ({ ...v, zoom: Math.max(v.zoom / 1.5, 1) }));

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-card">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          onMoveEnd={({ coordinates, zoom }) => setView({ coordinates, zoom })}
          maxZoom={8}
          minZoom={1}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // world-atlas uses ISO numeric ids; we match by name fallback.
                const code = (geo.properties as { "iso_a3"?: string; ISO_A3?: string }).iso_a3
                  ?? (geo.properties as { ISO_A3?: string }).ISO_A3
                  ?? geo.id;
                const a3 = isoNumericToAlpha3(String(code));
                const isAvailable = availableCodes.has(a3);
                const isSelected = selectedRegion?.code === a3;
                const isHovered = hovered === a3;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => isAvailable && setHovered(a3)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => isAvailable && handleSelect(a3)}
                    style={{
                      default: {
                        fill: isSelected
                          ? "hsl(217 91% 60%)"
                          : isAvailable
                            ? "hsl(0 0% 20%)"
                            : "hsl(0 0% 88%)",
                        stroke: "hsl(0 0% 100%)",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: isAvailable ? "pointer" : "default",
                        transition: "fill 200ms ease",
                      },
                      hover: {
                        fill: isAvailable ? "hsl(217 91% 60%)" : "hsl(0 0% 88%)",
                        outline: "none",
                        cursor: isAvailable ? "pointer" : "default",
                      },
                      pressed: { outline: "none", fill: "hsl(217 91% 50%)" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background shadow-lg"
          >
            {availableRegions.find((r) => r.code === hovered)?.name}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-full bg-card p-1 shadow-md">
        <button
          onClick={zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Hineinzoomen"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Herauszoomen"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          aria-label="Ansicht zurücksetzen"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * world-atlas topojson uses ISO numeric codes for `id`. We map the most
 * relevant codes to alpha-3 so we can match against our region data.
 */
function isoNumericToAlpha3(input: string): string {
  if (input.length === 3 && /[A-Z]/.test(input)) return input;
  const map: Record<string, string> = {
    "276": "DEU", "040": "AUT", "756": "CHE", "840": "USA", "826": "GBR",
    "250": "FRA", "380": "ITA", "724": "ESP", "392": "JPN", "702": "SGP",
  };
  const padded = input.padStart(3, "0");
  return map[padded] ?? input;
}
