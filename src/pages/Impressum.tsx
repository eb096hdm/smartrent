import { Link } from "react-router-dom";

const Impressum = () => {
  return (
    <main className="min-h-screen bg-paper px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Zurück zur Startseite
        </Link>
        <h1 className="display text-4xl sm:text-5xl mt-6">Impressum</h1>
        <p className="mt-2 text-muted-foreground">Angaben gemäß § 5 DDG</p>

        <section className="mt-10">
          <h2 className="text-xl font-medium">1. Anbieter</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>[UNTERNEHMENSNAME]</p>
            <p>[RECHTSFORM, z. B. UG (haftungsbeschränkt)]</p>
            <p>[STRAßE & HAUSNUMMER]</p>
            <p>[PLZ ORT]</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">2. Kontakt</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>E-Mail: [EMAIL]</p>
            <p>Telefon: [TELEFONNUMMER]</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">3. Vertretungsberechtigte Person</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>[VORNAME NACHNAME]</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">4. Registereintrag</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>Handelsregister: [REGISTERGERICHT]</p>
            <p>Registernummer: [HRB-NUMMER]</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">5. Umsatzsteuer-ID</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>USt-IdNr.: [UST-ID]</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-medium">6. Verantwortlich für redaktionelle Inhalte (§ 18 Abs. 2 MStV)</h2>
          <div className="mt-3 text-muted-foreground space-y-1">
            <p>[VORNAME NACHNAME]</p>
            <p>[ANSCHRIFT]</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Impressum;
