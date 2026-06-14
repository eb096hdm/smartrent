import { ChevronRight, Home, MapPin, Star } from "lucide-react";
import { useState } from "react";
import ComparableCardModal, { type ComparableDetail } from "./ComparableCardModal";

export interface ComparableProperty extends ComparableDetail {
  badge?: "cheapest" | "priciest";
  imageUrl?: string;
}

interface ComparableCardsProps {
  comparables: ComparableProperty[];
  totalCount: number;
}

export default function ComparableCards({
  comparables,
  totalCount,
}: ComparableCardsProps) {
  const [selectedCard, setSelectedCard] = useState<ComparableDetail | null>(null);

  return (
    <div>
      {/* Header row */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-base font-medium text-stone-800">
          Vergleichsobjekte
        </span>
        <span className="text-xs text-stone-400 border border-stone-200 rounded-full px-2.5 py-0.5">
          {comparables.length} von {totalCount} Objekten
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-2">
        {comparables.map((prop) => (
          <div
            key={prop.id}
            className={`group relative rounded-xl border overflow-hidden bg-white cursor-pointer hover:shadow-md hover:shadow-stone-200 hover:scale-[1.01] transition-all duration-150 ${
              prop.badge === "cheapest"
                ? "border-green-300"
                : "border-stone-200"
            }`}
            onClick={() => setSelectedCard(prop)}
          >
            {/* Image area */}
            <div className="h-[88px] bg-stone-100 flex items-center justify-center relative">
              {prop.imageUrl ? (
                <img
                  src={prop.imageUrl}
                  alt={prop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Home className="w-7 h-7 text-stone-300" />
              )}
              {prop.badge === "cheapest" && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-md px-1.5 py-0.5">
                  Günstigster
                </span>
              )}
              {prop.badge === "priciest" && (
                <span className="absolute top-1.5 left-1.5 text-[10px] font-medium bg-red-100 text-red-700 rounded-md px-1.5 py-0.5">
                  Teuerster
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-2.5">
              <p className="text-xs font-medium text-stone-700 truncate mb-0.5">
                {prop.name}
              </p>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span className="text-xs text-stone-400">{prop.district}</span>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <span>
                  <span className="text-sm font-medium text-stone-800">
                    €{prop.pricePerNight}
                  </span>
                  <span className="text-xs text-stone-400">/N.</span>
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-stone-400" />
                  <span className="text-xs text-stone-400">{prop.rating}</span>
                </div>
              </div>
            </div>

            {/* Hover chevron */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Show all link */}
      <p className="text-right mb-0">
        <span className="text-xs text-stone-400 underline underline-offset-2 cursor-pointer hover:text-stone-600">
          Alle {totalCount} Objekte anzeigen →
        </span>
      </p>

      {/* Detail modal */}
      {selectedCard && (
        <ComparableCardModal
          comparable={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
