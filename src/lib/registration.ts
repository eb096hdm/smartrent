// Hilfsfunktionen, um den Registrierungsstatus lokal im Browser zu speichern.
// So müssen bereits registrierte Nutzer:innen das Formular nicht erneut ausfüllen.

const KEY = "smartrent_registered";

export function isRegistered(): boolean {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function markRegistered(email: string) {
  try {
    localStorage.setItem(KEY, email);
  } catch {
    /* ignore */
  }
}
