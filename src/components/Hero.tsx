import { motion } from "framer-motion";
import { ArrowUpRight, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Über uns", href: "#about" },
  { label: "Leistungen", href: "#services" },
  { label: "Referenzen", href: "#testimonials" },
  { label: "FAQs", href: "#faqs" },
  { label: "Kontakt", href: "#contact" },
];

export const Hero = () => {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Auth-Status verfolgen, um Login/Profil-Buttons anzuzeigen
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setIsAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

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
          <Link
            to={isAuthed ? "/profil" : "/auth"}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
          >
            <User className="h-4 w-4" />
            {isAuthed ? "Profil" : "Anmelden"}
          </Link>
        </div>

        <div className="px-6 sm:px-10 pt-16 pb-10">
          <div className="flex flex-col items-center justify-center min-h-[480px]">
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
                className="display mt-8 sm:text-6xl lg:text-7xl xl:text-[5.5rem] text-center text-8xl"
              >
                Dein Objekt.<br />Dein Preis.<br />Unsere Passion.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-8 max-w-md text-base text-white/70 text-center"
              >
                {"\n"}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10"
            >
              {/* Direkter Zugang zur Preise-Karte ohne Registrierungs-Gate */}
              <button
                type="button"
                onClick={() => navigate("/preise")}
                className="group inline-flex items-center gap-3 rounded-full bg-white text-ink pl-6 pr-2 py-2 text-sm font-medium transition-all duration-300 hover:gap-4 hover:bg-white/90"
              >
                Jetzt Preise festlegen
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
