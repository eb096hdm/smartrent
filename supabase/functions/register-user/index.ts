// Edge Function: register-user
// Nimmt Registrierungsdaten entgegen, validiert serverseitig und schreibt mit
// Service-Role in die Tabelle "registrations". Honeypot-Feld schützt vor Bots.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  vorname?: string;
  nachname?: string;
  geburtsdatum?: string; // YYYY-MM-DD
  email?: string;
  telefon?: string;
  datenschutz_akzeptiert?: boolean;
  website?: string; // honeypot
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{7,14}$/;

function isAdult(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const eighteen = new Date(
    now.getFullYear() - 18,
    now.getMonth(),
    now.getDate(),
  );
  return d <= eighteen;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    // Honeypot: ist das Feld gefüllt → vermutlich Bot. Antworte mit ok=true,
    // ohne tatsächlich zu speichern.
    if (body.website && body.website.trim().length > 0) {
      return new Response(JSON.stringify({ ok: true, existing: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errors: Record<string, string> = {};
    if (!body.vorname || body.vorname.trim().length < 2)
      errors.vorname = "Vorname zu kurz";
    if (!body.nachname || body.nachname.trim().length < 2)
      errors.nachname = "Nachname zu kurz";
    if (!body.email || !emailRegex.test(body.email))
      errors.email = "Ungültige E-Mail";
    if (!body.telefon || !phoneRegex.test(body.telefon.replace(/\s|-/g, "")))
      errors.telefon = "Ungültige Telefonnummer (z. B. +491701234567)";
    if (!body.geburtsdatum || !isAdult(body.geburtsdatum))
      errors.geburtsdatum = "Die Nutzung ist erst ab 18 Jahren möglich.";
    if (body.datenschutz_akzeptiert !== true)
      errors.datenschutz_akzeptiert = "Bitte Datenschutz akzeptieren";

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ ok: false, errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase.from("registrations").insert({
      vorname: body.vorname!.trim(),
      nachname: body.nachname!.trim(),
      geburtsdatum: body.geburtsdatum!,
      email: body.email!.trim().toLowerCase(),
      telefon: body.telefon!.replace(/\s|-/g, ""),
      datenschutz_akzeptiert: true,
    });

    if (error) {
      // Unique violation → E-Mail bereits registriert: ok zurückgeben
      if ((error as any).code === "23505") {
        return new Response(JSON.stringify({ ok: true, existing: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true, existing: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("register-user error:", e);
    return new Response(JSON.stringify({ ok: false, error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
