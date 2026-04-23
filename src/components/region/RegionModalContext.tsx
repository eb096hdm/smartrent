import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CountryCode } from "./regionData";

interface RegionModalContextValue {
  isOpen: boolean;
  selectedCountry: CountryCode | null;
  open: (country?: CountryCode) => void;
  close: () => void;
  setCountry: (country: CountryCode | null) => void;
}

const RegionModalContext = createContext<RegionModalContextValue | null>(null);

export const RegionModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);

  const open = useCallback((country?: CountryCode) => {
    if (country) setSelectedCountry(country);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Reset slightly delayed so the close animation can finish smoothly
    setTimeout(() => setSelectedCountry(null), 250);
  }, []);

  const value = useMemo(
    () => ({ isOpen, selectedCountry, open, close, setCountry: setSelectedCountry }),
    [isOpen, selectedCountry, open, close],
  );

  return <RegionModalContext.Provider value={value}>{children}</RegionModalContext.Provider>;
};

export const useRegionModal = () => {
  const ctx = useContext(RegionModalContext);
  if (!ctx) throw new Error("useRegionModal must be used within RegionModalProvider");
  return ctx;
};
