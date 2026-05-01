import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Über uns", href: "#about" },
  { label: "Leistungen", href: "#services" },
  { label: "Referenzen", href: "#testimonials" },
  { label: "FAQs", href: "#faqs" },
  { label: "Kontakt", href: "#contact" },
];

export const Hero = () => {
  return (
    <section className="p-3 sm:p-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink text-ink-foreground">
        <div className="flex items-center justify-between px-6 sm:px-10 pt-8">
          <a href="#" className="text-2xl font-semibold tracking-tight">SmartRent</a>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className="nav-link">{n.label}</a>
            ))}
          </nav>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 px-6 sm:px-10 pt-16 pb-10">
          <div className="flex flex-col justify-between min-h-[480px]">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
                className="display mt-8 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
              >
                Dein Objekt.<br />Dein Preis.<br />Unsere Passion.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-8 max-w-md text-base text-white/70"
              >
                SmartRent liefert die erste erklärbare Pricing-KI für Vermieter:innen im DACH-Raum.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10"
            >
              <Link
                to="/preise"
                className="group inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90"
              >
                Jetzt Preise festlegen
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[1.5rem] overflow-hidden min-h-[420px] lg:min-h-[560px]"
          >
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80"
              alt="Moderne Luxusküche von SmartRent"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
