// Stub-Seite für die Datenschutzerklärung. Inhalt vom Betreiber zu ergänzen.
const Datenschutz = () => {
  return (
    <main className="min-h-screen bg-paper px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="display text-4xl sm:text-5xl">Datenschutzerklärung</h1>
        <p className="mt-6 text-muted-foreground">
          Wir verarbeiten deine personenbezogenen Daten ausschließlich zur Erbringung unseres Dienstes
          (Preisempfehlung). Die im Registrierungsformular angegebenen Daten (Vorname, Nachname,
          Geburtsdatum, E-Mail, Telefonnummer) werden in unserer Datenbank gespeichert und nicht an
          Dritte weitergegeben.
        </p>
        <p className="mt-4 text-muted-foreground">
          Du hast jederzeit das Recht auf Auskunft, Berichtigung und Löschung deiner Daten. Wende dich
          dazu bitte an unsere Kontaktadresse.
        </p>
      </div>
    </main>
  );
};

export default Datenschutz;
