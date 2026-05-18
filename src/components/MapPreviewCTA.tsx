// Karten-Vorschau-CTA: Klick führt zur PLZ-Eingabe und interaktiven Karte (/preise)

import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export const MapPreviewCTA = () => {
  const navigate = useNavigate();
  const goToMap = () => navigate("/preise");

  return (
    <Reveal delay={0.2} className="mt-8">
      <button
        type="button"
        onClick={goToMap}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-500 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Zur PLZ-Eingabe und interaktiven Karte"
      >
        <div className="relative h-56 sm:h-72 lg:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <MapContainer
              center={[51.1657, 10.4515]}
              zoom={6}
              zoomControl={false}
              attributionControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              keyboard={false}
              style={{ width: "100%", height: "100%", background: "#ffffff" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                subdomains="abcd"
              />
            </MapContainer>
          </div>
          <div className="absolute inset-0 bg-white/60" aria-hidden />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-10">
            <span className="pill mb-4 inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Interaktive Karte
            </span>
            <h2 className="display text-2xl sm:text-3xl lg:text-4xl max-w-xl">
              Finde die optimale Preisempfehlung für deine Region
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md">
              Gib deine Postleitzahl ein – SmartRent analysiert aktuelle Marktdaten in deiner Region und berechnet in Sekunden, welcher Preis für dein Objekt heute optimal ist.
            </p>
            <Button
              size="lg"
              className="mt-6 group-hover:translate-y-[-2px] transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                goToMap();
              }}
            >
              Jetzt Preisempfehlung berechnen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </button>
    </Reveal>
  );
};
