import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, MapPin, Sparkles, X } from "lucide-react";

interface ListingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  date: string;
  recommendedPrice: number;
  previousPrice?: number;
}

export function ListingPreviewModal({
  isOpen,
  onClose,
  dayName,
  date,
  recommendedPrice,
  previousPrice,
}: ListingPreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Panel — compact centered modal */}
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
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-100 transition-colors z-10"
                aria-label="Schließen"
              >
                <X size={18} className="text-stone-500" />
              </button>

              <div className="px-4 pb-6 pt-4">
                {/* Success header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="mb-4"
                >
                  {/* 1. Brand-color status badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white bg-[#C4622D]">
                    <CheckCircle2 size={14} />
                    Preis festgelegt
                  </span>

                  {/* 2. Modal heading — DM Sans */}
                  <h2 className="mt-2 text-xl font-semibold text-stone-800">
                    So sieht dein Inserat aus
                  </h2>

                  {/* 3. Date line */}
                  <p className="text-[11px] tracking-widest uppercase text-stone-400 mt-0.5">
                    {dayName} · {date}
                  </p>
                </motion.div>

                {/* Listing card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.35 }}
                  className="rounded-2xl bg-white border border-stone-100 overflow-hidden"
                >
                  {/* Image placeholder */}
                  <div className="relative bg-stone-100 h-40 rounded-xl flex items-center justify-center">
                    <p className="text-sm text-stone-400 text-center px-6">
                      Hier könnte dein Objekt zu sehen sein
                    </p>
                    {/* Superhost badge */}
                    <span className="absolute top-3 left-3 bg-white border border-stone-200 text-stone-700 text-xs rounded-full px-2.5 py-1">
                      ⭐ Superhost
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="border-t border-stone-100 pt-4 px-4 pb-4">
                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 text-sm text-stone-500">
                      <span>4.9</span>
                      <span>·</span>
                      <span>12 Bewertungen</span>
                      <span>·</span>
                      <span>Gesamte Wohnung</span>
                    </div>

                    {/* Title — DM Sans */}
                    <h3 className="mt-1 text-base font-semibold text-stone-800 leading-snug">
                      Stadthaus am Neckar, Stuttgart
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="text-stone-400 flex-shrink-0" />
                      <span className="text-xs text-stone-400">
                        Stuttgart-Mitte · 2 Gäste · 1 Schlafzimmer
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="my-3 h-px bg-stone-100" />

                    {/* Price block */}
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                        Preis pro Nacht
                      </p>
                      <div className="flex items-baseline gap-2">
                        {previousPrice != null && (
                          <span className="text-lg line-through text-stone-300">
                            € {previousPrice}
                          </span>
                        )}
                        <motion.span
                          initial={{ scale: 0.88 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.75, duration: 0.25, ease: "backOut" }}
                          className="text-4xl font-semibold text-stone-800"
                        >
                          € {recommendedPrice}
                        </motion.span>
                        <span className="text-sm text-stone-400 self-end pb-1">
                          / Nacht
                        </span>
                      </div>

                      {/* SmartRent badge — outline style */}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#C4622D] text-[#C4622D] bg-white text-xs px-3 py-1 mt-1.5">
                        <Sparkles size={12} />
                        SmartRent-optimiert
                      </span>
                    </div>

                    {/* Reasoning block */}
                    <div className="mt-3 bg-stone-50 border border-stone-100 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                        <Lightbulb size={13} />
                        Warum dieser Preis?
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Green pills */}
                        {["Bundesgartenschau +15 %", "Wochenende +8 %"].map((tag) => (
                          <span
                            key={tag}
                            className="text-xs rounded-md px-2 py-0.5 border bg-green-100 border-green-200 text-green-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {/* Neutral pills */}
                        {["Hohe Nachfrage", "3 Mitbewerber"].map((tag) => (
                          <span
                            key={tag}
                            className="text-xs rounded-md px-2 py-0.5 border bg-stone-100 border-stone-200 text-stone-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-stone-500 leading-relaxed pt-3 border-t border-stone-100 mt-3">
                      Stilvolles Stadthaus mit großer Dachterrasse, direkt am Neckarufer.
                      Perfekte Lage für Kultur, Shopping und Events in der Innenstadt.
                    </p>
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
