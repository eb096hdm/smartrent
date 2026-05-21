import Anthropic from "@anthropic-ai/sdk";
import type { DayCard, EventItem } from "../../src/api/types.js";

export async function generateDayExplanations(
  days: DayCard[],
  events: EventItem[],
  currentPrice: number
): Promise<string[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const eventLines = events.length > 0
    ? events.map((e) => {
        const parts: string[] = [e.name ?? "Event"];
        if (e.date) parts.push(`(${e.date})`);
        if (e.description) parts.push(`– ${e.description}`);
        return parts.join(" ");
      }).join("\n")
    : "Keine Events diese Woche.";

  const dayLines = days.map((d, i) =>
    `${i + 1}. ${d.weekday} ${d.label}: Empfehlung ${d.price}, Auslastung ${d.occupancy}, Status: ${d.dot_label}`
  ).join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Du bist ein Experte für dynamisches Pricing bei Kurzzeitvermietungen (Airbnb, Booking.com).

Aktueller Preis des Vermieters: ${currentPrice} €/Nacht

Events in dieser Woche:
${eventLines}

Preisempfehlungen für die 7 Tage:
${dayLines}

Erstelle für jeden der 7 Tage eine knappe Preisbegründung auf Deutsch (2–3 Sätze).
Beziehe dich bei relevanten Tagen konkret auf die Events (Name, Datum, Beschreibung).
Antworte ausschließlich mit einem JSON-Array der Form: [{"detail": "..."}, ...] mit genau 7 Einträgen in gleicher Reihenfolge.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return days.map((d) => d.detail_text);

  let raw = content.text.trim();
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) raw = fence[1].trim();

  const parsed = JSON.parse(raw) as Array<{ detail: string }>;
  return parsed.map((p, i) => p.detail ?? days[i].detail_text);
}
