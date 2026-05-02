## Ziel
Die Section „Über Uns" (Services.tsx) bekommt eine **Karten-Vorschau** mit CTA. Klick öffnet ein **Registrierungs-Modal**. Nach erfolgreicher Registrierung → Weiterleitung zu `/preise`. Bereits registrierte Nutzer:innen (per Cookie/LocalStorage) gelangen direkt zur Karte.

## 1. Datenbank (Lovable Cloud)

Neue Tabelle `public.registrations`:
- `id` (uuid, PK)
- `vorname` (text)
- `nachname` (text)
- `geburtsdatum` (date)
- `email` (text, **unique**)
- `telefon` (text)
- `datenschutz_akzeptiert` (boolean)
- `created_at` (timestamptz, default now())

RLS aktiviert. Da kein Auth-Login: 
- **INSERT**-Policy: `true` (öffentlich, jeder darf sich registrieren)
- **SELECT**-Policy: nur für Service-Role (default-deny, keine Policy für anon)

Damit ist DSGVO-konform: Daten werden gespeichert, aber nicht öffentlich lesbar.

E-Mail-Lookup („existiert die Mail schon?") läuft über eine **Edge Function** `check-registration` mit Service-Role-Key, damit anon nicht die Tabelle scannen kann.

## 2. Edge Functions

**`register-user`** (public, verify_jwt=false):
- Nimmt Formulardaten entgegen
- Server-seitige Zod-Validierung (Volljährigkeit, Email-Format, Telefon E.164)
- **Honeypot-Feld** prüfen (`website` muss leer sein → sonst silent success)
- Insert in `registrations`. Bei Unique-Conflict (E-Mail existiert) → `{ ok: true, existing: true }` zurück
- Antwort: `{ ok: true, existing: boolean }`

**`check-registration`** (public, verify_jwt=false):
- Input: `email`
- Schaut nach, ob registriert → `{ registered: boolean }`
- Wird genutzt, falls LocalStorage gelöscht wurde aber Mail bekannt (optional, wir nutzen primär LocalStorage)

## 3. Frontend-Komponenten

**`src/components/MapPreviewCTA.tsx`** (neu)
- Wird in `Services.tsx` unter dem Akkordeon eingebunden
- Vorschau-Bild/Snippet der Karte: nutzt einen statischen, abgedunkelten Leaflet-Mini-Container ODER ein gerendertes Screenshot-`div` mit Blur-Overlay (wir nehmen Variante: kleiner nicht-interaktiver Leaflet mit Deutschland, `pointer-events-none`, dunkles Gradient-Overlay)
- Overlay enthält: kurzer Erklärtext + CTA-Button „Jetzt Preisempfehlung erhalten"
- Hover: leichter Scale (`hover:scale-[1.02]`) + stärkeres Glow
- Responsive (mobile: kleinere Höhe)
- Klick auf Card oder Button → öffnet Modal (oder direkt navigate falls registriert)

**`src/components/RegistrationModal.tsx`** (neu)
- Shadcn `Dialog` (zentriert, Backdrop)
- React-Hook-Form + Zod-Schema mit Echtzeit-Validierung:
  - vorname, nachname: min 2 chars
  - geburtsdatum: Date-Picker (Shadcn Calendar in Popover) – berechnet Alter, ≥18
  - email: Email-Format
  - telefon: Regex `/^\+?[1-9]\d{7,14}$/` (E.164)
  - datenschutz: muss `true` sein
  - **honeypot `website`**: hidden, muss leer bleiben
- Schließen-Button (X) oben rechts (von Dialog default)
- Submit-Button mit Loading-State („Registrieren & Karte öffnen" / „Wird gesendet…")
- Bei Erfolg: 
  - LocalStorage setzen: `smartrent_registered = email`
  - Sonner-Toast „Registrierung erfolgreich!"
  - Modal schließen
  - `navigate("/preise")`

**`src/lib/registration.ts`** (neu)
- `isRegistered()` → liest LocalStorage
- `markRegistered(email)` → setzt LocalStorage

**`src/components/Services.tsx`** (edit)
- `<MapPreviewCTA />` unterhalb des Akkordeons einfügen

## 4. Datenschutz-Link
Der Checkbox-Text linkt auf `/datenschutz`. Da diese Seite noch nicht existiert: wir verlinken vorerst auf `#` mit einer Notiz im Code – oder erstellen einen einfachen Stub `src/pages/Datenschutz.tsx` mit Platzhalter-Inhalt + Route. **Vorschlag: Stub anlegen**, damit der Link nicht ins Leere führt.

## 5. Technische Details
- Telefon-Validierung mit `libphonenumber-js`? → Overkill. Wir nutzen einfache E.164-Regex.
- Date-Picker: Shadcn Calendar (bereits im Projekt) in Popover
- Honeypot: hidden input mit `tabIndex={-1}` und `aria-hidden`, CSS `position:absolute; left:-9999px`
- Registrierungsstatus persistiert in `localStorage` (Key: `smartrent_registered`). Cookies sind dafür nicht nötig.

## 6. Schritte
1. Migration: Tabelle `registrations` + RLS
2. Edge Function `register-user` deployen
3. Frontend: `registration.ts`, `RegistrationModal.tsx`, `MapPreviewCTA.tsx`
4. `Services.tsx` einbinden
5. `Datenschutz.tsx` Stub + Route in `App.tsx`
6. Test: Klick → Modal → Submit → Toast → Redirect zu `/preise`

## Offene Frage
Soll ich eine echte `/datenschutz`-Stub-Seite anlegen, oder reicht ein `#`-Link (TODO-Kommentar)?