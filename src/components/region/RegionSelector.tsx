import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { COUNTRY_LIST, getCountry, type CountryCode } from "./regionData";
import { RegionCard } from "./RegionCard";
import { Skeleton } from "@/components/ui/skeleton";

// Map is lazy-loaded — leaflet + GeoJSON parsing is a sizeable bundle.
const InteractiveMap = lazy(() =>
  import("./InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
);

interface Props {
  selectedCountry: CountryCode | null;
  onSelectCountry: (code: CountryCode | null) => void;
}

/** Main content of the modal: grid of country cards or expanded map. */
export const RegionSelector = ({ selectedCountry, onSelectCountry }: Props) => {
  const expanded = getCountry(selectedCountry);

  const goBack = () => onSelectCountry(null);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 border-b border-border px-8 py-6">
        <div className="flex items-center gap-4">
          {expanded && (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Zurück
            </button>
          )}
          <div>
            <h2 id="region-modal-title" className="text-2xl font-medium tracking-tight text-foreground">
              Wähle deine Region
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Stay ahead with expert insights, guides, and updates to help you maximize your CRM experience.
            </p>
          </div>
        </div>
        <a
          href="#blog"
          className="group hidden shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-all duration-300 hover:gap-3 sm:inline-flex"
        >
          Visit our blog
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!expanded && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 p-8 md:grid-cols-3"
            >
              {COUNTRY_LIST.map((c) => (
                <RegionCard key={c.code} country={c} onSelect={onSelectCountry} />
              ))}
            </motion.div>
          )}

          {expanded && (
            <motion.div
              key={`expanded-${expanded.code}`}
              layoutId={`region-card-${expanded.code}`}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="m-8 overflow-hidden rounded-2xl bg-muted p-8"
            >
              <div className="flex flex-col gap-2">
                <motion.span
                  layoutId={`region-label-${expanded.code}`}
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {expanded.label}
                </motion.span>
                <motion.h3
                  layoutId={`region-title-${expanded.code}`}
                  className="flex items-center gap-3 text-3xl font-medium tracking-tight text-foreground"
                >
                  <span aria-hidden className="text-4xl leading-none">{expanded.flag}</span>
                  {expanded.name}
                </motion.h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Wähle dein {expanded.regionTermSingular}, um lokale Pakete und Preise anzuzeigen.
                </p>
              </div>

              <div className="mt-6 h-[480px] overflow-hidden rounded-xl bg-card">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <InteractiveMap country={expanded} />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
