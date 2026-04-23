// Country configuration for the region selector modal.
// Each entry represents one selectable country card and the map it loads.

export type CountryCode = "DE" | "AT" | "CH";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  label: string;
  description: string;
  // Leaflet map setup
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  geoJsonUrl: string;
  // Sub-region terminology
  regionTermSingular: string;
  regionTermPlural: string;
  // Optional accent (HSL) used for region hover highlight
  accentHsl: string;
  contact: string;
  href: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  DE: {
    code: "DE",
    name: "Deutschland",
    flag: "🇩🇪",
    label: "DACH-Region",
    description: "Entdecke unsere Lösungen und Preise für den deutschen Markt.",
    center: [51.1657, 10.4515],
    zoom: 6,
    bounds: [[47.27, 5.87], [55.06, 15.04]],
    geoJsonUrl: "/maps/germany-states.geojson",
    regionTermSingular: "Bundesland",
    regionTermPlural: "Bundesländer",
    accentHsl: "217 91% 60%",
    contact: "kontakt.de@smartrent.com",
    href: "/pricing/de",
  },
  AT: {
    code: "AT",
    name: "Österreich",
    flag: "🇦🇹",
    label: "DACH-Region",
    description: "Maßgeschneiderte Angebote für österreichische Unternehmen.",
    center: [47.5162, 14.5501],
    zoom: 7,
    bounds: [[46.37, 9.53], [49.02, 17.16]],
    geoJsonUrl: "/maps/austria-states.geojson",
    regionTermSingular: "Bundesland",
    regionTermPlural: "Bundesländer",
    accentHsl: "0 72% 55%",
    contact: "kontakt.at@smartrent.com",
    href: "/pricing/at",
  },
  CH: {
    code: "CH",
    name: "Schweiz",
    flag: "🇨🇭",
    label: "DACH-Region",
    description: "Lokale Lösungen und Preise für den Schweizer Markt.",
    center: [46.8182, 8.2275],
    zoom: 8,
    bounds: [[45.82, 5.96], [47.81, 10.49]],
    geoJsonUrl: "/maps/switzerland-cantons.geojson",
    regionTermSingular: "Kanton",
    regionTermPlural: "Kantone",
    accentHsl: "0 72% 50%",
    contact: "kontakt.ch@smartrent.com",
    href: "/pricing/ch",
  },
};

export const COUNTRY_LIST: CountryConfig[] = [COUNTRIES.DE, COUNTRIES.AT, COUNTRIES.CH];

export const isCountryCode = (v: string | null | undefined): v is CountryCode =>
  v === "DE" || v === "AT" || v === "CH";

export const getCountry = (code: CountryCode | null) => (code ? COUNTRIES[code] : null);
