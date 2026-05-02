import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Home, Bath, Maximize2, Hammer, TreePine } from "lucide-react";
import { Reveal } from "./Reveal";

const services = [
  { icon: null, title: "Team", body: "Wir sind Levin, Alex, Elias und Kerstin – vier Studierenden der Digital- und Medienwirtschaft. Und wir stecken hinter SmartRent. Alles fing mit einem kleinen Brainstorming an. Und jetzt? Jetzt machen wir Dynamic Pricing für private Vermieter:innen in Deutschland einfach zugänglich: plattformübergreifend und verständlich. Unsere KI erklärt euch unsere Preisgestaltung." },
  
  { icon: Bath, title: "Bäder", body: "Vom Spa-Refugium bis zum kompakten Familienbad – wir gestalten Bäder, die Ästhetik und Funktion vereinen." },
  { icon: Maximize2, title: "Anbauten", body: "Mehr Raum zum Leben – maßgeschneiderte Anbauten, die Ihr Zuhause harmonisch erweitern." },
  { icon: Hammer, title: "Restaurierungen", body: "Wir bewahren den Charakter historischer Räume und bringen sie behutsam in die Moderne." },
  { icon: TreePine, title: "Außenarbeiten", body: "Terrassen, Wege und Außenanlagen – langlebig gebaut und stilvoll gestaltet." },
];

export const Services = () => {
  const [open, setOpen] = useState(0);
  return (
    <section id="services" className="px-3 sm:px-5 pb-16 sm:pb-24">
      <div className="section-card max-w-7xl mx-auto p-6 sm:p-12 lg:p-16">
        <Reveal className="text-center flex flex-col items-center">
          <span className="pill">Leistungen</span>
          <h2 className="display mt-6 text-4xl sm:text-5xl lg:text-6xl max-w-3xl">Unsere Preisempfehlungen </h2>
          <p className="mt-5 text-muted-foreground max-w-xl">BLOCKER</p>
        </Reveal>

        <div className="mt-14">
          <Reveal delay={0.15} className="flex flex-col max-w-3xl mx-auto">
            {services.map((s, i) => {
              const isOpen = open === i;
              const Icon = s.icon;
              return (
                <div key={s.title} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="w-full flex items-center gap-4 py-5 text-left group"
                  >
                    <Icon className="h-6 w-6 text-foreground/70 shrink-0" strokeWidth={1.4} />
                    <span className="flex-1 text-lg font-medium">{s.title}</span>
                    {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
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
                        <p className="pl-10 pr-4 pb-6 text-muted-foreground leading-relaxed text-xs">{s.body}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Reveal>
        </div>
      </div>
    </section>
  );
};
