import { motion } from "framer-motion";
import { ArrowRight, Globe2, Mail } from "lucide-react";
import type { RegionInfo } from "./regionData";

interface Props {
  region: RegionInfo;
}

/** Detail panel shown after a region has been selected on the map. */
export const RegionDetails = ({ region }: Props) => {
  return (
    <motion.div
      key={region.code}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h4 className="text-lg font-medium text-foreground">{region.name}</h4>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Globe2 className="h-4 w-4" />
          <span>{region.language}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <a href={`mailto:${region.contact}`} className="hover:text-foreground">
            {region.contact}
          </a>
        </div>
      </dl>
      <a
        href={region.href}
        className="group mt-6 inline-flex items-center gap-3 rounded-full bg-foreground pl-5 pr-1.5 py-1.5 text-sm font-medium text-background transition-all duration-300 hover:gap-4"
      >
        Continue to {region.name}
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground transition-transform duration-300 group-hover:rotate-45">
          <ArrowRight className="h-4 w-4" />
        </span>
      </a>
    </motion.div>
  );
};
