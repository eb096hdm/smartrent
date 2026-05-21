import { MapPin } from "lucide-react";

interface Props {
  postalCode?: string;
  city?: string;
  country?: string;
}

export function PriceRecommendationHeader({
  postalCode = "10115",
  city = "Berlin Mitte",
  country = "Deutschland",
}: Props) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E8E4DE",
        borderRadius: 12,
      }}
    >
      <div style={{ width: 3, height: 44, background: "#D4622A", borderRadius: 2, flexShrink: 0 }} />

      <div className="flex flex-col gap-0.5">
        <span
          className="uppercase tracking-wider font-medium"
          style={{ fontSize: 11, color: "#9A8F85", letterSpacing: "0.07em" }}
        >
          Deine Preisempfehlung
        </span>

        <span className="font-medium" style={{ fontSize: 18, color: "#1A1714" }}>
          {postalCode}
        </span>

        <div className="flex items-center" style={{ gap: 6 }}>
          <MapPin size={12} style={{ color: "#7A7068", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#7A7068" }}>{city}</span>
          <span style={{ fontSize: 12, color: "#7A7068" }}>·</span>
          <span style={{ fontSize: 12, color: "#7A7068" }}>{country}</span>
        </div>
      </div>
    </div>
  );
}
