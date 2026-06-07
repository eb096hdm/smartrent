import { CalendarDays, Lightbulb, PenLine, TrendingDown } from "lucide-react";

export type TipVariant = "price" | "content" | "season";

export interface HostTip {
  id: string;
  variant: TipVariant;
  title: string;
  body: string;
}

interface HostsTippsProps {
  tips: HostTip[];
}

const variantStyles: Record<
  TipVariant,
  { bg: string; icon: React.ReactNode }
> = {
  price: {
    bg: "bg-red-50",
    icon: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
  },
  content: {
    bg: "bg-blue-50",
    icon: <PenLine className="w-3.5 h-3.5 text-blue-400" />,
  },
  season: {
    bg: "bg-green-50",
    icon: <CalendarDays className="w-3.5 h-3.5 text-green-400" />,
  },
};

export default function HostsTipps({ tips }: HostsTippsProps) {
  return (
    <>
      {/* Divider */}
      <div className="border-t border-stone-100 my-4" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-[26px] h-[26px] rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <span className="text-sm font-medium text-stone-700">
          KI-Tipps für dein Objekt
        </span>
      </div>

      {/* Tip cards */}
      <div className="flex flex-col gap-2">
        {tips.map((tip) => {
          const { bg, icon } = variantStyles[tip.variant];
          return (
            <div
              key={tip.id}
              className="flex gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}
              >
                {icon}
              </div>
              <div>
                <p className="text-[13px] font-medium text-stone-700 mb-0.5">
                  {tip.title}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {tip.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
