import { Check, X } from "lucide-react";
import { Reveal } from "./Reveal";

export interface PricingFeature {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
}

const DEFAULT_FEATURES: PricingFeature[] = [
  { label: "Mietobjekte", starter: "1", pro: "Unbegrenzt" },
  { label: "KI-Preisempfehlung", starter: "Basis", pro: "Erweitert + Erklärung" },
  { label: "Marktvergleichsdaten", starter: "Eingeschränkt", pro: "Vollständig" },
  { label: "Automatische Preisanpassung", starter: false, pro: true },
  { label: "Support", starter: "E-Mail", pro: "Priorisiert" },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)
    return <Check className="mx-auto h-5 w-5 text-green-600" strokeWidth={2.5} />;
  if (value === false)
    return <X className="mx-auto h-5 w-5 text-stone-400" strokeWidth={2} />;
  return <span>{value}</span>;
}

interface Props {
  features?: PricingFeature[];
}

export const PricingComparison = ({ features = DEFAULT_FEATURES }: Props) => (
  <section id="preise" className="px-3 sm:px-5 py-16 sm:py-24 text-left">
    <div className="max-w-7xl mx-auto px-3 sm:px-6">
      <Reveal>
        <span className="pill">Preise</span>
        <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
          Wähle deinen Plan
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed text-sm max-w-xl">
          Starte kostenlos oder schalte alle Funktionen für dein Vermietungsgeschäft frei.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {/* label column header */}
                <th className="w-1/3 pb-4 text-left font-normal text-muted-foreground" />

                {/* Starter column header */}
                <th className="w-1/3 pb-4 text-center align-bottom">
                  <div className="flex flex-col items-center mx-2">
                    <div className="mb-2 h-[22px]" aria-hidden="true" />
                    <div className="w-full rounded-2xl border border-border bg-card px-4 py-5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Starter</p>
                      <p className="text-3xl font-semibold tracking-tight text-foreground">0 €</p>
                      <p className="text-xs text-muted-foreground mt-1">/Monat</p>
                    </div>
                  </div>
                </th>

                {/* Pro column header — highlighted */}
                <th className="w-1/3 pb-4 text-center align-bottom">
                  <div className="flex flex-col items-center mx-2">
                    <span
                      className="mb-2 rounded-full px-3 py-0.5 text-xs font-bold text-white whitespace-nowrap z-10"
                      style={{ backgroundColor: "#C4622D" }}
                    >
                      Empfehlung
                    </span>
                    <div
                      className="w-full rounded-2xl border-2 px-4 py-5"
                      style={{
                        borderColor: "#C4622D",
                        backgroundColor: "#FBF3EC",
                      }}
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Pro
                      </p>
                      <p className="text-3xl font-semibold tracking-tight text-foreground">
                        12 €
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">/Monat</p>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {features.map((feat, i) => {
                const isLast = i === features.length - 1;
                const rowBorder = isLast ? "" : "border-b border-border";
                return (
                  <tr key={feat.label}>
                    <td className={`py-3.5 pr-4 font-medium text-foreground ${rowBorder}`}>
                      {feat.label}
                    </td>

                    {/* Starter cell */}
                    <td
                      className={`py-3.5 text-center text-muted-foreground mx-2 ${rowBorder}`}
                    >
                      <CellValue value={feat.starter} />
                    </td>

                    {/* Pro cell — tinted background */}
                    <td
                      className={`py-3.5 text-center font-medium ${rowBorder}`}
                      style={{ backgroundColor: "#FBF3EC" }}
                    >
                      <CellValue value={feat.pro} />
                    </td>
                  </tr>
                );
              })}

              {/* CTA row */}
              <tr>
                <td className="pt-8" />
                <td className="pt-8 text-center px-2">
                  <button className="w-full rounded-full border-2 border-foreground px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background">
                    Kostenlos starten
                  </button>
                </td>
                <td
                  className="pt-8 text-center px-2"
                  style={{ backgroundColor: "#FBF3EC" }}
                >
                  <button
                    className="w-full rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C4622D" }}
                  >
                    Pro wählen
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-stone-400 text-center">
          Alle Preise verstehen sich inkl. MwSt., jederzeit kündbar.
        </p>
      </Reveal>
    </div>
  </section>
);
