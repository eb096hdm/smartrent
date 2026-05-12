import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";

const faqs = [
  { q: "Was ist SmartRent und für wen ist es geeignet?", a: "SmartRent ist ein dynamisches Preisgestaltungs-Tool für private Vermieter:innen in DE. Es richtet sich vor allem diejenigen, die ihre Preise automatisch optimieren möchten." },
  { q: "Kann ich den Preisvorschlägen vertrauen?", a: "SmartRent macht Preisvorschläge und erklärt sie auf Deutsch – du entscheidest, ob du sie übernimmst oder manuell anpasst. Kein Algorithmus handelt ohne deine Zustimmung. Du behältst also die volle Kontrolle." },
  { q: "Was unterscheidet SmartRent von anderen Pricing-Tools?", a: "Andere Tools geben dir einen Preis, aber keine Erklärung. SmartRent erklärt auf Deutsch, warum ein bestimmter Preis empfohlen wird. Dazu kommt: deutschsprachige Oberfläche, Fokus auf den DE-Markt und eine einfache Bedienung für nicht-professionelle Gastgeber." },
  { q: "Welche Plattformen werden unterstützt?", a: "Das hängt von Art und Umfang der Arbeiten ab. Wir beraten Sie und begleiten Sie bei Bedarf durch den Genehmigungsprozess." },
  { q: "Geben Sie eine Garantie auf Ihre Arbeit?", a: "Selbstverständlich. Auf alle Arbeiten gewähren wir eine umfassende Garantie. Wir stehen für die Qualität jedes Projekts ein." },
  { q: "Kann ich während der Arbeiten zu Hause bleiben?", a: "In den meisten Fällen ja. Wir arbeiten effizient und sauber, um Ihren Alltag möglichst wenig zu stören." },
  { q: "Wie starte ich ein Projekt?", a: "Schreiben Sie uns über das Kontaktformular oder rufen Sie an. Wir vereinbaren einen Beratungstermin und erstellen ein passgenaues Angebot." },
];

export const Faqs = () => {
  const [open, setOpen] = useState(0);
  return (
    <section id="faqs" className="px-3 sm:px-5 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20">
        <Reveal>
          <span className="pill">FAQs</span>
          <h2 className="display mt-6 text-5xl sm:text-6xl">Noch Fragen?</h2>
          <p className="mt-5 text-muted-foreground">Hier sind die häufigsten Fragen und Antworten zusammengestellt!&nbsp;</p>
          <a href="#contact" className="group ghost-pill mt-8">
            Kontakt aufnehmen
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ink-foreground transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={`rounded-2xl border border-border bg-card transition-all ${isOpen ? "shadow-sm" : ""}`}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                  <span className="font-medium text-base sm:text-lg">{f.q}</span>
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
                      <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{f.a}</p>
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
