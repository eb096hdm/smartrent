import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { RegionCategory } from "./regionData";

interface Props {
  category: RegionCategory;
  onSelect: (id: RegionCategory["id"]) => void;
}

/** Single region category card shown in the initial grid view. */
export const RegionCard = ({ category, onSelect }: Props) => {
  return (
    <motion.button
      layoutId={`region-card-${category.id}`}
      onClick={() => onSelect(category.id)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative flex min-h-[320px] flex-col justify-between rounded-2xl bg-muted p-8 text-left shadow-sm transition-shadow duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      aria-label={`Region für ${category.label} auswählen`}
    >
      <div>
        <motion.span
          layoutId={`region-label-${category.id}`}
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {category.label}
        </motion.span>
        <motion.h3
          layoutId={`region-title-${category.id}`}
          className="mt-4 text-2xl font-medium tracking-tight text-foreground"
        >
          {category.title}
        </motion.h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
      </div>
      <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="border-b border-foreground pb-0.5">Read more</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </motion.button>
  );
};
