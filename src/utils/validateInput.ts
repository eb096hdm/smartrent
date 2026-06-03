const INJECTION_KEYWORDS = [
  "ignore", "repeat", "system", "assistant", "instruction",
  "jailbreak", "prompt", "override", "vergiss", "ignoriere",
];

function stripDangerousChars(value: string): string {
  return value.replace(/[<>"';\\]/g, "").trim();
}

function hasInjectionKeyword(value: string): boolean {
  const lower = value.toLowerCase();
  return INJECTION_KEYWORDS.some((kw) => lower.includes(kw));
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, unknown>;
}

export function validateSmartRentInput(
  raw: Record<string, unknown>
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  // PLZ: exakt 5 Ziffern
  const plz = String(raw.plz ?? "").trim();
  if (!/^\d{5}$/.test(plz)) {
    errors.plz = "Ungültige Postleitzahl (5 Ziffern erforderlich).";
  } else {
    sanitized.plz = plz;
  }

  // Numerische Felder
  for (const field of ["flaeche_qm", "zimmer", "max_gaeste", "aktueller_preis"]) {
    const val = Number(raw[field]);
    if (isNaN(val) || val < 0 || val > 100_000) {
      errors[field] = `Ungültiger Wert für ${field}.`;
    } else {
      sanitized[field] = val;
    }
  }

  // Freitextfelder: max 80 Zeichen, keine gefährlichen Zeichen, kein Injection-Versuch
  for (const field of ["besonderheiten", "art", "komfort", "ansicht"]) {
    if (raw[field] === undefined) {
      sanitized[field] = raw[field];
      continue;
    }
    if (Array.isArray(raw[field])) {
      sanitized[field] = raw[field];
      continue;
    }
    const val = stripDangerousChars(String(raw[field] ?? "")).slice(0, 80);
    if (hasInjectionKeyword(val)) {
      errors[field] = "Ungültige Eingabe.";
    } else {
      sanitized[field] = val;
    }
  }

  // Datum: woche_start als ISO-Datum (YYYY-MM-DD)
  const ws = String(raw.woche_start ?? "");
  if (ws && !/^\d{4}-\d{2}-\d{2}$/.test(ws)) {
    errors.woche_start = "Ungültiges Datumsformat.";
  } else {
    sanitized.woche_start = ws;
  }

  // Arrays (plattformen, besonderheiten als Array)
  if (Array.isArray(raw.plattformen)) {
    sanitized.plattformen = (raw.plattformen as string[])
      .map((p) => stripDangerousChars(p).slice(0, 40))
      .filter((p) => p.length > 0)
      .slice(0, 10);
  }
  if (Array.isArray(raw.besonderheiten)) {
    sanitized.besonderheiten = (raw.besonderheiten as string[])
      .map((p) => stripDangerousChars(p).slice(0, 40))
      .filter((p) => p.length > 0)
      .slice(0, 20);
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}
