import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/i1mew6hs760cdj6jhllf9ww6677v1yea";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("MAKE_WEBHOOK_API_KEY") ?? "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "MAKE_WEBHOOK_API_KEY ist nicht gesetzt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.text();

    const upstream = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });

    const text = await upstream.text();
    console.log("[make-pricing] upstream status", upstream.status, "len", text.length);

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[make-pricing] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
