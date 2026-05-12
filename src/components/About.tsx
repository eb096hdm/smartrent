import { Reveal } from "./Reveal";
import { CountUpStat } from "./CountUpStat";
// Karten-Vorschau mit Registrierungs-Gate (öffnet Modal bzw. leitet weiter)
import { MapPreviewCTA } from "./MapPreviewCTA";

export const About = () => (
  <section id="about" className="px-3 sm:px-5 py-16 sm:py-24 text-left">
    <div className="max-w-7xl mx-auto px-3 sm:px-6">
      <Reveal>
        <span className="pill">Leistungen</span>
        <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
          Unsere Preisentscheidungen
        </h2>
      </Reveal>

      {/* === Neuer Unterbereich: Interaktive Preisempfehlungs-Karte === */}
      {/* Direkt unter dem Header "Unsere Preisentscheidungen". Klick auf das */}
      {/* Snippet öffnet das Registrierungs-Modal bzw. leitet bereits */}
      {/* registrierte Nutzer:innen direkt zu /preise weiter. */}
      <div className="mt-14 sm:mt-20">
        <Reveal>
          <h3 className="display text-3xl sm:text-4xl lg:text-5xl max-w-2xl">
            {" "}
          </h3>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            Erhalte mit wenigen Klicks eine fundierte Preisempfehlung – basierend
            auf aktuellen Marktdaten in deiner Region.
          </p>
        </Reveal>
        <MapPreviewCTA />
      </div>

    </div>
  </section>
);
