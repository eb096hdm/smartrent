import { Reveal } from "./Reveal";
import { CountUpStat } from "./CountUpStat";

export const About = () => (
  <section id="about" className="px-3 sm:px-5 py-16 sm:py-24">
    <div className="max-w-7xl mx-auto px-3 sm:px-6">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
        <Reveal>
          <span className="pill">Über uns</span>
          <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
            Wer steckt hinter SmartRent
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-lg text-foreground/80 leading-relaxed lg:pt-12">
            Willkommen bei SmartRent, Ihren vertrauten Expert:innen für Wohnraum­modernisierung. Mit jahrelanger Erfahrung im Bau von Küchen, Bädern, Anbauten und mehr legen wir Wert auf erstklassige Handwerkskunst und ein nahtloses Kund:innen­erlebnis. Unsere Mission ist es, Ihre Vision zum Leben zu erwecken – mit klarer Kommunikation und kompetenter Beratung in jedem Schritt. Lassen Sie uns gemeinsam ein Zuhause schaffen, das Sie lieben werden.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mt-20 sm:mt-28 pt-14 border-t border-border">
        <CountUpStat end={10} suffix="+" label="Jahre Erfahrung" desc="Wir verbessern Wohnräume mit handwerklicher Präzision seit Jahren" />
        <CountUpStat end={250} suffix="+" label="Abgeschlossene Projekte" desc="Über 250 erfolgreiche Projekte mit Qualität und Sorgfalt" />
        <CountUpStat end={30} label="Erfahrene Handwerker:innen" desc="Unser Team aus 30 Expert:innen sichert Top-Qualität" />
        <CountUpStat end={98} suffix="%" label="Kund:innen­zufriedenheit" desc="Alle Kund:innen sind mit unserer Arbeit und unserem Service zufrieden" />
      </div>
    </div>
  </section>
);
