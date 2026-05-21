import type { PricingRequest, WeekResponse } from "./types";

export async function fetchPriceRecommendation(payload: PricingRequest): Promise<WeekResponse> {
  const res = await fetch("/api/price-recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json() as Promise<WeekResponse>;
}
