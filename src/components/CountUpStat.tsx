import CountUp from "react-countup";
import { useInView } from "framer-motion";
import { useRef } from "react";

export const CountUpStat = ({ end, suffix = "", label, desc }: { end: number; suffix?: string; label: string; desc: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="flex flex-col gap-4">
      <div className="text-6xl sm:text-7xl font-medium tracking-[-0.04em] leading-none">
        {inView ? <CountUp end={end} duration={2} /> : 0}{suffix}
      </div>
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">{desc}</p>
      </div>
    </div>
  );
};
