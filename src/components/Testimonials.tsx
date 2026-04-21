import { Star } from "lucide-react";
import { Reveal } from "./Reveal";

const reviews = [
  { name: "Emily Carter", text: "SmartRent hat unsere Küche unglaublich verwandelt. Die Handwerkskunst war erstklassig und das Team von Anfang an professionell." },
  { name: "James Richardson", text: "Brillanter Service vom ersten Gespräch bis zur Abnahme. Mein neues Bad sieht fantastisch aus." },
  { name: "Sophie Williams", text: "Beim Dachausbau wurde jedes Detail beachtet. Der gesamte Prozess war stressfrei und sauber." },
  { name: "Daniel Foster", text: "SmartRent hat unseren Garten mit einem wunderschönen Weg verwandelt – pünktlich und sauber gearbeitet." },
  { name: "Oliver Bennett", text: "Fantastische Arbeit! Unser Bad wurde mit viel Sorgfalt und Präzision renoviert. Fühlt sich an wie ein Luxusbad." },
  { name: "Charlotte Harris", text: "Vom ersten Termin an wurde jede Zusage gehalten. Unser Anbau ist genau so geworden, wie wir es uns gewünscht haben." },
  { name: "Michael Thornton", text: "Sehr empfehlenswert. Die Kommunikation war exzellent und der Endzustand übertrifft unsere Erwartungen." },
  { name: "Laura Davies", text: "Top Team, faires Angebot, makellose Ausführung. Wir würden SmartRent jederzeit wieder beauftragen." },
];

const Card = ({ name, text }: { name: string; text: string }) => (
  <div className="shrink-0 w-[340px] sm:w-[380px] mx-3 bg-card rounded-[1.25rem] p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-border/60">
    <div className="flex gap-1 mb-4 text-gold">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
    <p className="text-foreground/80 leading-relaxed text-[15px] min-h-[110px]">{text}</p>
    <div className="flex items-center gap-3 mt-6">
      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
        {name.split(" ").map((p) => p[0]).join("")}
      </div>
      <span className="font-medium">{name}</span>
    </div>
  </div>
);

const Row = ({ reverse = false }: { reverse?: boolean }) => {
  const items = [...reviews, ...reviews];
  return (
    <div className="overflow-hidden marquee-paused">
      <div className={`flex w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}>
        {items.map((r, i) => <Card key={`${r.name}-${i}`} {...r} />)}
      </div>
    </div>
  );
};

export const Testimonials = () => (
  <section id="testimonials" className="bg-secondary/60 py-16 sm:py-24 mx-3 sm:mx-5 rounded-[2rem]">
    <Reveal className="text-center flex flex-col items-center px-6">
      <span className="pill">Referenzen</span>
      <h2 className="display mt-6 text-4xl sm:text-5xl lg:text-6xl max-w-3xl">Das sagen andere Nutzer:innen</h2>
      <p className="mt-5 text-muted-foreground max-w-xl">Hören Sie von unseren zufriedenen Kund:innen über ihre Erfahrungen mit SmartRent und die Qualität unserer Handwerkskunst.</p>
    </Reveal>

    <div className="mt-14 flex flex-col gap-6">
      <Row />
      <Row reverse />
    </div>
  </section>
);
