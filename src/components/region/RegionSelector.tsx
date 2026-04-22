import { Suspense, lazy, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { REGION_CATEGORIES, getCategory, type RegionCategoryId, type RegionInfo } from "./regionData";
import { RegionCard } from "./RegionCard";
import { RegionDetails } from "./RegionDetails";
import { Skeleton } from "@/components/ui/skeleton";

// Map is lazy-loaded — react-simple-maps + topojson is a sizeable bundle.
const InteractiveMap = lazy(() =>
  import("./InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
);

interface Props {
  selectedCategory: RegionCategoryId | null;
  onSelectCategory: (id: RegionCategoryId | null) => void;
}

/** Main content of the modal: grid of cards or expanded category with map. */
export const RegionSelector = ({ selectedCategory, onSelectCategory }: Props) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo | null>(null);
  const expanded = getCategory(selectedCategory);

  const goBack = () => {
    setSelectedRegion(null);
    onSelectCategory(null);
  };

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
              {REGION_CATEGORIES.map((cat) => (
                <RegionCard key={cat.id} category={cat} onSelect={onSelectCategory} />
              ))}
            </motion.div>
          )}

          {expanded && (
            <motion.div
              key={`expanded-${expanded.id}`}
              layoutId={`region-card-${expanded.id}`}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="m-8 overflow-hidden rounded-2xl bg-muted p-8"
            >
              <div className="flex flex-col gap-2">
                <motion.span
                  layoutId={`region-label-${expanded.id}`}
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {expanded.label}
                </motion.span>
                <motion.h3
                  layoutId={`region-title-${expanded.id}`}
                  className="text-3xl font-medium tracking-tight text-foreground"
                >
                  {expanded.title}
                </motion.h3>
                <p className="max-w-2xl text-sm text-muted-foreground">{expanded.description}</p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="h-[420px] overflow-hidden rounded-xl bg-card">
                  <Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <InteractiveMap
                      availableRegions={expanded.regions}
                      selectedRegion={selectedRegion}
                      onSelectRegion={setSelectedRegion}
                    />
                  </Suspense>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Verfügbare Regionen
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {expanded.regions.map((r) => (
                        <li key={r.code}>
                          <button
                            onClick={() => setSelectedRegion(r)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              selectedRegion?.code === r.code
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-foreground hover:bg-muted"
                            }`}
                          >
                            {r.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedRegion ? (
                      <RegionDetails region={selectedRegion} />
                    ) : (
                      <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground"
                      >
                        Wähle eine Region auf der Karte, um Details zu sehen.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
