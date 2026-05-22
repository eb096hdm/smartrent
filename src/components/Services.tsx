import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Reveal } from "./Reveal";

const items = [
  {
    title: "Team",
    body: "Wir sind Levin, Alex, Elias und Kerstin – vier Studierenden der Digital- und Medienwirtschaft. Und wir stecken hinter SmartRent. Alles fing mit einem kleinen Brainstorming an. Und jetzt? Jetzt machen wir Dynamic Pricing für private Vermieter:innen in Deutschland einfach zugänglich: plattformübergreifend und verständlich. Unsere KI erklärt euch unsere Preisgestaltung.",
  },
  {
    title: "Mission",
    body: "Dein Apartment. Dein Preis. Endlich erklärt. SmartRent analysiert Events, Nachfrage und Konkurrenz in deiner Umgebung — und gibt dir einen konkreten Mietpreis für heute, morgen und das Wochenende.",
  },
];

export const Services = () => {
  const [open, setOpen] = useState(-1);
  return (
    <section id="services" className="px-3 sm:px-5 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <Reveal>
          <span className="pill">Über Uns</span>
          <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">
            Wer steckt hinter SmartRent?
          </h2>
        </Reveal>

        <Reveal delay={0.15} className="mt-8 flex flex-col gap-3 max-w-3xl">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border border-border bg-card transition-all ${isOpen ? "shadow-sm" : ""}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium text-base sm:text-lg">{item.title}</span>
                  {isOpen ? <X className="h-5 w-5 shrink-0" /> : <Plus className="h-5 w-5 shrink-0" />}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
                        {item.body}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
};
