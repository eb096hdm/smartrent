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

const PLAYFAIR: React.CSSProperties = { fontFamily: "'Playfair Display', serif" };

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

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
            style={{ background: "#F5EDE0", maxHeight: "92vh" }}
          >
            {/* Drag handle + close */}
            <div className="relative flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "rgba(196, 98, 45, 0.30)" }}
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-2.5 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Schließen"
              >
                <X size={18} style={{ color: "#C4622D" }} />
              </button>
            </div>

            <div className="px-4 pb-6">
              {/* Success header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="mt-3 mb-4"
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: "#C4622D" }}
                >
                  <CheckCircle2 size={14} />
                  Preis festgelegt
                </span>
                <h2
                  className="mt-2 text-2xl italic"
                  style={{ ...PLAYFAIR, color: "#2A1A0E" }}
                >
                  So sieht dein Inserat aus
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#6b5744" }}>
                  {dayName} · {date}
                </p>
              </motion.div>

              {/* Listing card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                className="rounded-2xl bg-white shadow-sm overflow-hidden"
              >
                {/* Image placeholder */}
                <div
                  className="relative h-44 flex items-center justify-center"
                  style={{ background: "#EDE0CC" }}
                >
                  <p className="text-sm font-medium text-center px-6" style={{ color: "#9a8070" }}>
                    Hier könnte dein Objekt zu sehen sein
                  </p>
                  <span
                    className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold"
                    style={{ color: "#2A1A0E" }}
                  >
                    ⭐ Superhost
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>4.9</span>
                    <span>·</span>
                    <span>12 Bewertungen</span>
                    <span>·</span>
                    <span>Gesamte Wohnung</span>
                  </div>

                  {/* Title */}
                  <h3
                    className="mt-1 text-lg font-bold leading-snug"
                    style={{ ...PLAYFAIR, color: "#2A1A0E" }}
                  >
                    Stadthaus am Neckar, Stuttgart
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={13} style={{ color: "#6b5744", flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: "#6b5744" }}>
                      Stuttgart-Mitte · 2 Gäste · 1 Schlafzimmer
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="my-3 h-px" style={{ background: "#f0e6d6" }} />

                  {/* Price block */}
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-widest mb-2"
                      style={{ color: "#9a8070" }}
                    >
                      Preis pro Nacht
                    </p>
                    <div className="flex items-baseline gap-2">
                      {previousPrice != null && (
                        <span className="text-lg line-through" style={{ color: "#b0988a" }}>
                          € {previousPrice}
                        </span>
                      )}
                      <motion.span
                        initial={{ scale: 0.88 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.75, duration: 0.25, ease: "backOut" }}
                        className="text-4xl font-bold"
                        style={{ ...PLAYFAIR, color: "#2A1A0E" }}
                      >
                        € {recommendedPrice}
                      </motion.span>
                      <span
                        className="text-sm self-end pb-1"
                        style={{ color: "#6b5744" }}
                      >
                        / Nacht
                      </span>
                    </div>

                    {/* SmartRent badge */}
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold mt-1.5"
                      style={{
                        background: "#FFF0E8",
                        border: "1px solid #E07A3A",
                        color: "#993C1D",
                      }}
                    >
                      <Sparkles size={12} />
                      SmartRent-optimiert
                    </span>
                  </div>

                  {/* Reasoning block */}
                  <div
                    className="mt-3 rounded-lg p-3"
                    style={{
                      background: "#FDF6EE",
                      border: "1px solid #EDD8B8",
                    }}
                  >
                    <div
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
                      style={{ color: "#8a6040" }}
                    >
                      <Lightbulb size={13} />
                      Warum dieser Preis?
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {/* Green pills */}
                      {["Bundesgartenschau +15 %", "Wochenende +8 %"].map((tag) => (
                        <span
                          key={tag}
                          className="text-xs rounded-md px-2 py-0.5 border"
                          style={{
                            background: "#EAF3DE",
                            borderColor: "#C0DD97",
                            color: "#3B6D11",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {/* Neutral pills */}
                      {["Hohe Nachfrage", "3 Mitbewerber"].map((tag) => (
                        <span
                          key={tag}
                          className="text-xs rounded-md px-2 py-0.5 border bg-white"
                          style={{ borderColor: "#E8D4BA", color: "#4a2e1a" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: "#6b5744" }}
                  >
                    Stilvolles Stadthaus mit großer Dachterrasse, direkt am Neckarufer.
                    Perfekte Lage für Kultur, Shopping und Events in der Innenstadt.
                  </p>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
