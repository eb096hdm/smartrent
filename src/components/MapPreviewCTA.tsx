// Karten-Vorschau-CTA: zeigt einen abgedunkelten/unscharfen Kartenausschnitt
// mit Overlay und CTA-Button. Klick führt direkt zur interaktiven Preise-Karte.

import { useNavigate } from "react-router-dom";
import { Reveal } from "./Reveal";

export const MapPreviewCTA = () => {
  const navigate = useNavigate();
  const goToMap = () => navigate("/preise");

  return (
    <Reveal delay={0.2} className="mt-8">
      <button
        type="button"
        onClick={goToMap}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-500 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Jetzt Preisempfehlung erhalten"
      >
        {/* Unscharfe Karten-Vorschau (statisch) */}
        <div
          className="h-56 sm:h-72 lg:h-80 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage:
              "url('https://api.maptiler.com/maps/streets-v2-dark/static/10.45,51.16,4.5/1200x600.png?key=demo')",
            filter: "blur(4px) brightness(0.55)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, hsl(var(--primary)/0.35), transparent 55%), radial-gradient(circle at 70% 60%, hsl(var(--accent)/0.3), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/30" />

      </button>
    </Reveal>
  );
};
