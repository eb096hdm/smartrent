import { MapPin, Star, CheckCircle2, ExternalLink } from "lucide-react";
import type { ComparisonItem } from "@/api/types";

interface Props {
  items: ComparisonItem[];
}

const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const m = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
};

const fmtPrice = (v: unknown): string => {
  const n = toNum(v);
  return Number.isFinite(n) ? `${Math.round(n)} €` : "–";
};

export default function ComparisonsRich({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "#1A1714" }}>
            Vergleichsobjekte
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#7A7068" }}>
            {items.length} reale Objekte im Umkreis – Wochendurchschnitt vs. deine Empfehlung
          </p>
        </div>
        <span
          className="text-xs rounded-full px-2.5 py-0.5"
          style={{ border: "0.5px solid #E8E4DE", color: "#7A7068" }}
        >
          {items.length} Objekte
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((c, i) => {
          const diff = toNum(c.diff_to_main_avg_pct);
          const diffColor = !Number.isFinite(diff)
            ? "#7A7068"
            : diff > 5
              ? "#C62828"
              : diff < -5
                ? "#2E7D32"
                : "#7A7068";
          const diffLabel = !Number.isFinite(diff)
            ? "–"
            : `${diff > 0 ? "+" : ""}${Math.round(diff)}%`;
          const rating = toNum(c.bewertung);
          const dist = toNum(c.entfernung_km);
          const sqm = toNum(c.flaeche_qm);

          return (
            <div
              key={i}
              className="rounded-xl bg-white p-4 flex flex-col"
              style={{ border: "0.5px solid #E8E4DE" }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#1A1714" }}>
                    {c.art || "Objekt"}
                    {Number.isFinite(sqm) ? ` · ${sqm} m²` : ""}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#7A7068" }}>
                    {c.platform || "–"}
                  </p>
                </div>
                {c.echt_verifiziert && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
                    style={{ background: "rgba(46,125,50,0.10)", color: "#2E7D32" }}
                    title="Echt verifiziertes Vergleichsobjekt"
                  >
                    <CheckCircle2 size={10} /> Verifiziert
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#7A7068" }}>
                {Number.isFinite(dist) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {dist} km
                  </span>
                )}
                {Number.isFinite(rating) && rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={11} /> {rating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Prices */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg p-2" style={{ background: "#FAF8F5" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9A8F85", letterSpacing: "0.07em" }}>
                    Basispreis
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#1A1714" }}>
                    {fmtPrice(c.basispreis)}
                  </p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "#FAF8F5" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9A8F85", letterSpacing: "0.07em" }}>
                    Ø Woche
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#1A1714" }}>
                    {fmtPrice(c.week_avg)}
                  </p>
                </div>
              </div>

              {/* Diff vs main */}
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs" style={{ color: "#7A7068" }}>
                  vs. deine Empfehlung
                </span>
                <span className="text-sm font-semibold" style={{ color: diffColor }}>
                  {diffLabel}
                </span>
              </div>

              {/* 7-day mini grid */}
              {c.days && c.days.length > 0 && (
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {c.days.slice(0, 7).map((d, j) => (
                    <div
                      key={j}
                      className="rounded text-center py-1"
                      style={{ background: "#FAF8F5", border: "0.5px solid #E8E4DE" }}
                      title={`${d.weekday ?? ""} ${d.label ?? d.date ?? ""}`}
                    >
                      <div className="text-[9px] uppercase" style={{ color: "#9A8F85", letterSpacing: "0.05em" }}>
                        {(d.weekday ?? "").slice(0, 2)}
                      </div>
                      <div className="text-[11px] font-medium" style={{ color: "#1A1714" }}>
                        {fmtPrice(d.price).replace(" €", "")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rationale */}
              {c.faktor_begruendung && (
                <p className="mt-3 text-xs leading-relaxed" style={{ color: "#7A7068" }}>
                  {c.faktor_begruendung}
                </p>
              )}

              {/* Source */}
              {c.quelle && (
                <div className="mt-3 pt-2 flex items-center gap-1 text-[11px]" style={{ borderTop: "0.5px solid #E8E4DE", color: "#9A8F85" }}>
                  <ExternalLink size={10} />
                  <span className="truncate">{c.quelle}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
