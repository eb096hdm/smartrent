import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, MapPin, Sparkles, X } from "lucide-react";

export type ReasonTag = {
  label: string;
  tone: "positive" | "neutral";
};

interface ListingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  date: string;
  /** Empfohlener Preis (aus Make.com-Response) */
  recommendedPrice?: number | null;
  /** Vorheriger Preis (user input) – optional, für Vergleich */
  previousPrice?: number | null;

  /** Formularwerte */
  plz?: string;
  art?: string | null;
  zimmer?: number | null;
  maxGaeste?: number | null;
  cityName?: string;

  /** Dynamisch berechnete Begründungs-Tags */
  reasonTags?: ReasonTag[];

  /** Ladezustand (kein Webhook-Response da) */
  isLoading?: boolean;
}

export function ListingPreviewModal({
  isOpen,
  onClose,
  dayName,
  date,
  recommendedPrice,
  previousPrice,
  plz,
  art,
  zimmer,
  maxGaeste,
  cityName,
  reasonTags = [],
  isLoading = false,
}: ListingPreviewModalProps) {
  const hasResponse = !isLoading && recommendedPrice != null && recommendedPrice > 0;

  const titleParts = [art, plz ? `${plz}${cityName ? ` ${cityName}` : ""}` : null, zimmer ? `${zimmer} Zimmer` : null].filter(Boolean);
  const title = titleParts.join(" · ");

  const metaParts = [
    maxGaeste ? `${maxGaeste} Gäste` : null,
    zimmer ? `${zimmer} Schlafzimmer` : null,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="relative max-w-[500px] w-full rounded-2xl bg-white overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-100 transition-colors z-10"
                aria-label="Schließen"
              >
                <X size={18} className="text-stone-500" />
              </button>

              <div className="px-4 pb-6 pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="mb-4"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-[#C4622D]">
                    <CheckCircle2 size={14} />
                    Preis festgelegt
                  </span>

                  <h2 className="mt-2 text-xl font-semibold text-stone-800">
                    So sieht dein Inserat aus
                  </h2>

                  {(dayName || date) && (
                    <p className="text-[11px] tracking-widest uppercase text-stone-400 mt-0.5">
                      {[dayName, date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.35 }}
                  className="rounded-2xl bg-white border border-stone-100 overflow-hidden"
                >
                  <div className="relative bg-stone-100 h-40 rounded-xl flex items-center justify-center">
                    <p className="text-sm text-stone-400 text-center px-6">
                      Hier könnte dein Objekt zu sehen sein
                    </p>
                  </div>

                  <div className="border-t border-stone-100 pt-4 px-4 pb-4">
                    <h3 className="text-base font-semibold text-stone-800 leading-snug">
                      {title || "Dein Objekt"}
                    </h3>

                    {(metaParts.length > 0 || plz) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={13} className="text-stone-400 flex-shrink-0" />
                        <span className="text-xs text-stone-400">
                          {[plz ? `PLZ ${plz}` : null, ...metaParts].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    )}

                    <div className="my-3 h-px bg-stone-100" />

                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                        Preis pro Nacht
                      </p>

                      {hasResponse ? (
                        <div className="flex items-baseline gap-2">
                          {previousPrice != null && previousPrice > 0 && previousPrice !== recommendedPrice && (
                            <span className="text-lg line-through text-stone-300">
                              € {previousPrice}
                            </span>
                          )}
                          <motion.span
                            initial={{ scale: 0.88 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.25, ease: "backOut" }}
                            className="text-4xl font-semibold text-stone-800"
                          >
                            € {recommendedPrice}
                          </motion.span>
                          <span className="text-sm text-stone-400 self-end pb-1">
                            / Nacht
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-400">
                          Deine Empfehlung erscheint hier nach der Analyse
                        </p>
                      )}

                      {hasResponse && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C4622D] text-[#C4622D] bg-white text-xs px-3 py-1 mt-1.5">
                          <Sparkles size={12} />
                          SmartRent-optimiert
                        </span>
                      )}
                    </div>

                    <div className="mt-3 bg-stone-50 border border-stone-100 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                        <Lightbulb size={13} />
                        Warum dieser Preis?
                      </div>
                      {isLoading ? (
                        <div className="flex gap-1.5">
                          <span className="h-5 w-24 rounded-md bg-stone-200 animate-pulse" />
                          <span className="h-5 w-20 rounded-md bg-stone-200 animate-pulse" />
                        </div>
                      ) : reasonTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {reasonTags.map((tag, i) => (
                            <span
                              key={`${tag.label}-${i}`}
                              className={
                                tag.tone === "positive"
                                  ? "text-xs rounded-md px-2 py-0.5 border bg-green-100 border-green-200 text-green-700"
                                  : "text-xs rounded-md px-2 py-0.5 border bg-stone-100 border-stone-200 text-stone-600"
                              }
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400">Keine besonderen Faktoren erkannt.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
