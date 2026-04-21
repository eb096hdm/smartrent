export const Footer = () => (
  <footer className="px-3 sm:px-5 pb-5">
    <div className="rounded-[2rem] bg-ink text-ink-foreground p-8 sm:p-12">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <a href="#" className="text-5xl sm:text-6xl font-semibold tracking-tight">SmartRent</a>
        </div>
        <div>
          <h4 className="text-lg font-medium mb-6">Schnellzugriff</h4>
          <div className="grid grid-cols-2 gap-y-3 text-sm text-white/80">
            <a href="#about" className="hover:text-white transition">Über uns</a>
            <a href="#testimonials" className="hover:text-white transition">Referenzen</a>
            <a href="#services" className="hover:text-white transition">Unsere Arbeit</a>
            <a href="#faqs" className="hover:text-white transition">FAQs</a>
            <a href="#services" className="hover:text-white transition">Leistungen</a>
            <a href="#contact" className="hover:text-white transition">Kontakt</a>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/60">
        <span>© 2025 SmartRent. Alle Rechte vorbehalten.</span>
        <span>Website-Design vom SmartRent Team</span>
      </div>
    </div>
  </footer>
);
