import { Bath, BedDouble, Building2, ExternalLink, House, MapPin, Star, X } from "lucide-react";

export interface ComparableDetail {
  id: string;
  name: string;
  district: string;
  pricePerNight: number;
  rating: number;
  reviewCount?: number;
  squareMeters?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  sourceUrl?: string;
}

interface Props {
  comparable: ComparableDetail;
  onClose: () => void;
}

export default function ComparableCardModal({ comparable, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-2xl bg-white p-6 font-['DM_Sans'] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-6">
          <h2 className="text-[18px] font-bold text-stone-800 mb-1">{comparable.name}</h2>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-[14px] text-stone-500">{comparable.district}</span>
          </div>
        </div>

        {/* Price + rating */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold" style={{ color: "#C4622D" }}>
            €{comparable.pricePerNight}
            <span className="text-sm font-normal text-stone-400">/N.</span>
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-500">{comparable.rating}</span>
            {comparable.reviewCount != null && (
              <span className="text-xs text-stone-400">({comparable.reviewCount} Bewertungen)</span>
            )}
          </div>
        </div>

        <div className="border-t border-stone-100 mb-4" />

        {/* Key facts grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {comparable.squareMeters != null && (
            <div className="flex items-center gap-2">
              <House className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Fläche</p>
                <p className="text-sm text-stone-700">{comparable.squareMeters} m²</p>
              </div>
            </div>
          )}
          {comparable.propertyType && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Objekttyp</p>
                <p className="text-sm text-stone-700">{comparable.propertyType}</p>
              </div>
            </div>
          )}
          {comparable.bedrooms != null && (
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Schlafzimmer</p>
                <p className="text-sm text-stone-700">{comparable.bedrooms}</p>
              </div>
            </div>
          )}
          {comparable.bathrooms != null && (
            <div className="flex items-center gap-2">
              <Bath className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Badezimmer</p>
                <p className="text-sm text-stone-700">{comparable.bathrooms}</p>
              </div>
            </div>
          )}
        </div>

        {/* Amenities */}
        {comparable.amenities && comparable.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-wide text-stone-400 mb-2">Ausstattung</p>
            <div className="flex flex-wrap gap-2">
              {comparable.amenities.map((a) => (
                <span
                  key={a}
                  className="bg-stone-100 text-stone-700 rounded-full px-3 py-1 text-xs"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source hint */}
        <div className="mt-2">
          {comparable.sourceUrl ? (
            <a
              href={comparable.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              <span>Daten bereitgestellt via Airbtics</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <p className="flex items-center gap-1 text-xs text-stone-400">
              <span>Daten bereitgestellt via Airbtics</span>
              <ExternalLink className="w-3 h-3" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
