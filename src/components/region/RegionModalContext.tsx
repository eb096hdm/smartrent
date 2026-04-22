import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RegionCategoryId } from "./regionData";

interface RegionModalContextValue {
  isOpen: boolean;
  selectedCategory: RegionCategoryId | null;
  open: (category?: RegionCategoryId) => void;
  close: () => void;
  setCategory: (category: RegionCategoryId | null) => void;
}

const RegionModalContext = createContext<RegionModalContextValue | null>(null);

export const RegionModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RegionCategoryId | null>(null);

  const open = useCallback((category?: RegionCategoryId) => {
    if (category) setSelectedCategory(category);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset state slightly delayed so close animation can finish smoothly
    setTimeout(() => setSelectedCategory(null), 250);
  }, []);

  const value = useMemo(
    () => ({ isOpen, selectedCategory, open, close, setCategory: setSelectedCategory }),
    [isOpen, selectedCategory, open, close],
  );

  return <RegionModalContext.Provider value={value}>{children}</RegionModalContext.Provider>;
};

export const useRegionModal = () => {
  const ctx = useContext(RegionModalContext);
  if (!ctx) throw new Error("useRegionModal must be used within RegionModalProvider");
  return ctx;
};
