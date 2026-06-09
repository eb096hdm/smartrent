const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEBHOOK_URL =
  Deno.env.get("MAKE_WEBHOOK_URL") ??
  "https://hook.eu1.make.com/i1mew6hs760cdj6jhllf9ww6677v1yea";

const parseWebhookJson = (rawText: string): unknown => {
  let cleaned = rawText.trim();
  const fence = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) cleaned = fence[1].trim();
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) cleaned = match[0];
  }

  const parsed = JSON.parse(cleaned) as unknown;
  const candidates = Array.isArray(parsed) ? parsed : [parsed];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && Array.isArray((candidate as { days?: unknown }).days)) {
      return candidate;
    }
  }

  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["data", "result", "response", "body", "output"]) {
      const value = obj[key];
      if (typeof value === "string") return parseWebhookJson(value);
      if (value && typeof value === "object" && Array.isArray((value as { days?: unknown }).days)) {
        return value;
      }
    }
  }

  throw new Error("Webhook JSON enthält kein days[]-Array.");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = (Deno.env.get("MAKE_WEBHOOK_API_KEY") ?? Deno.env.get("VITE_WEBHOOK_SECRET") ?? "")
    .trim()
    .replace(/[\r\n]/g, "");
  if (!apiKey) {
    console.error("MAKE_WEBHOOK_API_KEY is not configured.");
    return new Response(JSON.stringify({ error: "Webhook API key missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const makeResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-apikey": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await makeResponse.text();
    if (!makeResponse.ok) {
      console.error("Make webhook returned an error", makeResponse.status, rawText);
      return new Response(JSON.stringify({ error: "Make webhook failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parseWebhookJson(rawText);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Price recommendation proxy failed", error);
    return new Response(JSON.stringify({ error: "Price recommendation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});