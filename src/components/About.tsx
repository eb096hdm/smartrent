import { Reveal } from "./Reveal";

const steps = [
  {
    number: "01",
    title: "Inserat verbinden",
    description:
      "Trag deine Unterkunft ein und verbinde dein Airbnb- oder Booking-Inserat in wenigen Minuten.",
  },
  {
    number: "02",
    title: "Markt analysieren lassen",
    description:
      "SmartRent analysiert Nachfrage, lokale Events und deine Konkurrenz automatisch.",
  },
  {
    number: "03",
    title: "Preisempfehlung erhalten",
    description:
      "Du bekommst einen konkreten Preis – mit einer klaren Erklärung, warum.",
  },
];

export const About = () => (
  <section id="about" className="px-3 sm:px-5 py-16 sm:py-24 text-left">
    <div className="max-w-7xl mx-auto px-3 sm:px-6">
      <Reveal>
        <span className="pill">So funktioniert's</span>
        <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
          In 3 Schritten zur smarten Preisempfehlung
        </h2>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="text-4xl font-bold text-foreground/20 leading-none">
                {step.number}
              </span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);
