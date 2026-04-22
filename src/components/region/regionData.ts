// Data definitions for the region selector modal.
// Country codes use ISO 3166-1 alpha-3 to match the geo dataset used by react-simple-maps.

export type RegionCategoryId = "marketing" | "business" | "innovation";

export interface RegionInfo {
  code: string; // ISO alpha-3
  name: string;
  language: string;
  contact: string;
  href: string;
}

export interface RegionCategory {
  id: RegionCategoryId;
  label: string;
  title: string;
  description: string;
  regions: RegionInfo[];
}

export const REGION_CATEGORIES: RegionCategory[] = [
  {
    id: "marketing",
    label: "Marketing",
    title: "Innovative Marketing-Strategien für Vermieter:innen",
    description:
      "Datengetriebene Pricing-Insights, die deine Vermarktung verbessern und Leerstand minimieren.",
    regions: [
      { code: "DEU", name: "Deutschland", language: "Deutsch", contact: "marketing.de@smartrent.com", href: "/pricing/de" },
      { code: "AUT", name: "Österreich", language: "Deutsch", contact: "marketing.at@smartrent.com", href: "/pricing/at" },
      { code: "CHE", name: "Schweiz", language: "Deutsch / Französisch", contact: "marketing.ch@smartrent.com", href: "/pricing/ch" },
      { code: "USA", name: "United States", language: "English", contact: "marketing.us@smartrent.com", href: "/pricing/us" },
      { code: "GBR", name: "United Kingdom", language: "English", contact: "marketing.uk@smartrent.com", href: "/pricing/uk" },
    ],
  },
  {
    id: "business",
    label: "Business",
    title: "Skalierbare Business-Lösungen für Portfolios",
    description:
      "Von Einzelobjekt bis Großportfolio – transparente Pricing-KI für professionelle Vermieter:innen.",
    regions: [
      { code: "DEU", name: "Deutschland", language: "Deutsch", contact: "business.de@smartrent.com", href: "/pricing/de" },
      { code: "AUT", name: "Österreich", language: "Deutsch", contact: "business.at@smartrent.com", href: "/pricing/at" },
      { code: "CHE", name: "Schweiz", language: "Deutsch / Französisch", contact: "business.ch@smartrent.com", href: "/pricing/ch" },
      { code: "FRA", name: "France", language: "Français", contact: "business.fr@smartrent.com", href: "/pricing/fr" },
      { code: "ITA", name: "Italia", language: "Italiano", contact: "business.it@smartrent.com", href: "/pricing/it" },
      { code: "ESP", name: "España", language: "Español", contact: "business.es@smartrent.com", href: "/pricing/es" },
    ],
  },
  {
    id: "innovation",
    label: "Innovation",
    title: "KI-Innovation für die Immobilienbranche",
    description:
      "Erklärbare KI-Modelle, die in den fortschrittlichsten Märkten weltweit eingesetzt werden.",
    regions: [
      { code: "USA", name: "United States", language: "English", contact: "innovation.us@smartrent.com", href: "/pricing/us" },
      { code: "GBR", name: "United Kingdom", language: "English", contact: "innovation.uk@smartrent.com", href: "/pricing/uk" },
      { code: "DEU", name: "Deutschland", language: "Deutsch", contact: "innovation.de@smartrent.com", href: "/pricing/de" },
      { code: "JPN", name: "Japan", language: "日本語", contact: "innovation.jp@smartrent.com", href: "/pricing/jp" },
      { code: "SGP", name: "Singapore", language: "English", contact: "innovation.sg@smartrent.com", href: "/pricing/sg" },
    ],
  },
];

export const getCategory = (id: RegionCategoryId | null) =>
  REGION_CATEGORIES.find((c) => c.id === id) ?? null;
