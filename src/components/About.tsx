import { Reveal } from "./Reveal";
import { CountUpStat } from "./CountUpStat";

export const About = () => (
  <section id="about" className="px-3 sm:px-5 py-16 sm:py-24 text-left">
    <div className="max-w-7xl mx-auto px-3 sm:px-6">
      <Reveal>
        <span className="pill">Leistungen</span>
        <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
          Unsere Preisentscheidungen
        </h2>
      </Reveal>
    </div>
  </section>
);

