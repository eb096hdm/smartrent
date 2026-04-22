import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { Faqs } from "@/components/Faqs";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { useRegionModal } from "@/components/region/RegionModalContext";
import type { RegionCategoryId } from "@/components/region/regionData";

const VALID_CATEGORIES: RegionCategoryId[] = ["marketing", "business", "innovation"];

const Index = () => {
  const [params] = useSearchParams();
  const { open } = useRegionModal();

  // Support deep-links: /?pricing=open and /?pricing=open&region=marketing
  useEffect(() => {
    if (params.get("pricing") === "open") {
      const region = params.get("region") as RegionCategoryId | null;
      open(region && VALID_CATEGORIES.includes(region) ? region : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <Hero />
      <About />
      <Services />
      <Testimonials />
      <Faqs />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
