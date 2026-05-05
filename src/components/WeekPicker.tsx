import * as React from "react";
import { DayPicker } from "react-day-picker";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WeekPickerProps {
  /** First day of the selected 7-day range */
  value: Date;
  onChange: (startDay: Date) => void;
  className?: string;
  /** Earliest selectable start date (default: today) */
  minDate?: Date;
}

export const WeekPicker: React.FC<WeekPickerProps> = ({ value, onChange, className, minDate }) => {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<Date | null>(null);
  const [month, setMonth] = React.useState<Date>(value);

  const selectedStart = React.useMemo(() => startOfDay(value), [value]);
  const selectedEnd = React.useMemo(() => addDays(selectedStart, 6), [selectedStart]);

  const previewStart = hovered ? startOfDay(hovered) : null;
  const previewEnd = previewStart ? addDays(previewStart, 6) : null;

  const minDay = React.useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);

  const handleSelect = (d?: Date) => {
    if (!d) return;
    const start = startOfDay(d);
    if (start < minDay) return;
    onChange(start);
    setOpen(false);
  };

  const label = `${format(selectedStart, "d. MMM", { locale: de })} – ${format(selectedEnd, "d. MMM yyyy", { locale: de })}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "mt-2 flex w-full items-center justify-between rounded-full bg-white/10 border border-white/15 px-5 py-3 text-base text-white hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40",
            className,
          )}
        >
          <span className="flex items-center gap-3">
            <CalendarIcon className="h-4 w-4 text-white/70" />
            <span>{label}</span>
          </span>
          <span className="text-xs text-white/50">7 Tage</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-2xl border border-white/10 bg-[hsl(var(--ink))]/95 p-3 text-white shadow-2xl [backdrop-filter:blur(10px)]"
      >
        <DayPicker
          mode="single"
          locale={de}
          weekStartsOn={1}
          showOutsideDays
          month={month}
          onMonthChange={setMonth}
          selected={selectedStart}
          onSelect={handleSelect}
          onDayMouseEnter={(d) => setHovered(d)}
          onDayMouseLeave={() => setHovered(null)}
          fromDate={minDay}
          modifiers={{
            selectedRange: (d) => d >= selectedStart && d <= selectedEnd,
            selectedStart: (d) => isSameDay(d, selectedStart),
            selectedEnd: (d) => isSameDay(d, selectedEnd),
            previewRange: (d) =>
              !!previewStart && !!previewEnd && d >= previewStart && d <= previewEnd,
          }}
          modifiersClassNames={{
            selectedRange: "bg-white/15 text-white",
            selectedStart: "rounded-l-full",
            selectedEnd: "rounded-r-full",
            previewRange: "bg-white/10",
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
          className="p-2 pointer-events-auto"
          classNames={{
            months: "flex flex-col",
            month: "space-y-3",
            caption: "flex justify-center pt-1 relative items-center text-white",
            caption_label: "text-sm font-medium capitalize",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-7 w-7 rounded-md inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-white/50 w-9 font-normal text-[0.7rem] uppercase tracking-wider",
            row: "flex w-full mt-1",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 p-0 font-normal text-white/85 hover:bg-white/15 hover:text-white rounded-md transition-colors inline-flex items-center justify-center cursor-pointer",
            day_today: "ring-1 ring-white/40",
            day_outside: "text-white/30",
            day_disabled: "text-white/20 cursor-not-allowed hover:bg-transparent",
            day_hidden: "invisible",
          }}
        />
        <div className="mt-2 px-2 pb-1 text-[11px] text-white/50">
          Klicke auf einen Tag — die folgenden 7 Tage werden ausgewählt.
        </div>
      </PopoverContent>
    </Popover>
  );
};
