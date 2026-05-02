// Karten-Vorschau-CTA: zeigt einen abgedunkelten/unscharfen Kartenausschnitt
// mit Overlay und CTA-Button. Klick öffnet das Registrierungs-Modal — oder
// leitet bereits registrierte Nutzer:innen direkt zur Karte weiter.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { RegistrationModal } from "./RegistrationModal";
import { Button } from "@/components/ui/button";
import { isRegistered } from "@/lib/registration";
import { Reveal } from "./Reveal";

export const MapPreviewCTA = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (isRegistered()) {
      navigate("/preise");
    } else {
      setOpen(true);
    }
  };

  return (
    <Reveal delay={0.2} className="mt-8">
      <button
        type="button"
        onClick={handleClick}
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
        {/* Fallback-Pattern, falls externes Bild blockiert ist */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, hsl(var(--primary)/0.35), transparent 55%), radial-gradient(circle at 70% 60%, hsl(var(--accent)/0.3), transparent 50%)",
          }}
          aria-hidden
        />
        {/* Dunkler Verlauf für Lesbarkeit */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/30" />

        {/* Overlay-Inhalt */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-10">
          <span className="pill mb-4 inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Interaktive Karte
          </span>
          <h3 className="display text-2xl sm:text-3xl lg:text-4xl max-w-xl">
            Finde die optimale Preisempfehlung für deine Region
          </h3>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md">
            Gib deine Postleitzahl ein und entdecke datenbasierte Preisempfehlungen für dein Mietobjekt — plattformübergreifend und in Sekunden.
          </p>
          <Button
            size="lg"
            className="mt-6 group-hover:translate-y-[-2px] transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Jetzt Preisempfehlung erhalten
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </button>

      <RegistrationModal open={open} onOpenChange={setOpen} />
    </Reveal>
  );
};
