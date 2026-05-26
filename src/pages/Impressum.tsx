import { Link } from "react-router-dom";

const sections = [
  {
    number: "01",
    title: "Anbieter",
    content: (
      <>
        <p>SmartRent</p>
        <p>[RECHTSFORM, z. B. UG (haftungsbeschränkt)]</p>
        <p>Nobelstraße 10</p>
        <p>70569 Stuttgart</p>
        <p>Deutschland</p>
      </>
    ),
  },
  {
    number: "02",
    title: "Kontakt",
    content: (
      <>
        <p>E-Mail: [EMAIL]</p>
        <p>Telefon: [TELEFONNUMMER]</p>
      </>
    ),
  },
  {
    number: "03",
    title: "Vertretungsberechtigte Person",
    content: (
      <>
        <p>[VORNAME NACHNAME]</p>
      </>
    ),
  },
  {
    number: "04",
    title: "Registereintrag",
    content: (
      <>
        <p>Handelsregister: [REGISTERGERICHT]</p>
        <p>Registernummer: [HRB-NUMMER]</p>
      </>
    ),
  },
  {
    number: "05",
    title: "Umsatzsteuer-ID",
    content: (
      <>
        <p>USt-IdNr.: [UST-ID]</p>
      </>
    ),
  },
  {
    number: "06",
    title: "Verantwortlich für redaktionelle Inhalte (§ 18 Abs. 2 MStV)",
    content: (
      <>
        <p>[VORNAME NACHNAME]</p>
        <p>[ANSCHRIFT]</p>
      </>
    ),
  },
];

const Impressum = () => {
  return (
    <main className="min-h-screen bg-paper px-3 sm:px-5">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-16 sm:py-24">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Zurück zur Startseite
        </Link>

        <div className="mt-10">
          <span className="pill">Impressum</span>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Angaben gemäß § 5 DDG
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-12">
          {sections.map((s) => (
            <section key={s.number} className="flex flex-col gap-3">
              <span className="text-4xl font-bold text-foreground/20 leading-none">
                {s.number}
              </span>
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-1">
                {s.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Impressum;
