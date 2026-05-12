import { Instagram, Twitter } from "lucide-react";
import { Reveal } from "./Reveal";
import { useToast } from "@/hooks/use-toast";
import { FormEvent } from "react";

export const Contact = () => {
  const { toast } = useToast();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({ title: "Nachricht gesendet", description: "Wir melden uns in Kürze bei Ihnen." });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contact" className="px-3 sm:px-5 pb-5">
      <div className="rounded-[2rem] bg-ink text-ink-foreground p-6 sm:p-12 lg:p-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm">Kontakt</span>
            <h2 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">Noch etwas unklar? Kontaktiere Uns!</h2>
            <p className="mt-6 text-white/70 max-w-md">Für Anfragen oder zur weiteren Besprechung Ihrer Vision erreichen Sie unser Team über die folgenden Kontaktdaten.</p>

            <div className="mt-12 space-y-5 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="font-medium">Büro</span>
                <span className="text-white/70">Innovationsstraße 12, 10115 Berlin</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="font-medium">E-Mail</span>
                <span className="text-white/70">hello@smartrent.de</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <span className="font-medium">Telefon</span>
                <span className="text-white/70">+49 711 123 4567</span>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-sm font-medium mb-4">Folgen Sie uns</p>
              <div className="flex gap-4 text-white/80">
                <a href="#" aria-label="Instagram"><Instagram className="h-5 w-5 hover:text-white transition" /></a>
                <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-current hover:text-white transition"><path d="M19.6 6.3a4.8 4.8 0 0 1-3.4-1.4 4.8 4.8 0 0 1-1.4-2.9h-3.2v13.1a2.4 2.4 0 1 1-2.4-2.4c.3 0 .5 0 .8.1V9.5a5.7 5.7 0 1 0 4.8 5.6V8.6a8 8 0 0 0 4.8 1.6V7c-.0 0 0-.7 0-.7Z"/></svg></a>
                <a href="#" aria-label="X"><Twitter className="h-5 w-5 hover:text-white transition" /></a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={onSubmit} className="bg-card text-foreground rounded-[1.5rem] p-6 sm:p-8 space-y-5">
              <Field label="Name" required placeholder="Max Mustermann" name="name" />
              <Field label="E-Mail" required placeholder="max@beispiel.de" type="email" name="email" />
              <Field label="Telefonnummer" placeholder="+49 123 456789" name="phone" />
              <div>
                <label className="block text-sm font-medium mb-2">Nachricht<span className="text-destructive">*</span></label>
                <textarea required name="message" placeholder="Hallo, ich möchte anfragen wegen…" rows={5} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-ink text-ink-foreground py-4 font-medium transition-all hover:opacity-90">Nachricht senden</button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const Field = ({ label, required, ...rest }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-sm font-medium mb-2">{label}{required && <span className="text-destructive">*</span>}</label>
    <input {...rest} required={required} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);
