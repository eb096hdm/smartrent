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
import { isCountryCode, type CountryCode } from "@/components/region/regionData";

const Index = () => {
  const [params] = useSearchParams();
  const { open } = useRegionModal();

  // Support deep-links: /?pricing=open and /?pricing=open&country=de
  useEffect(() => {
    if (params.get("pricing") === "open") {
      const country = params.get("country")?.toUpperCase() as CountryCode | undefined;
      open(country && isCountryCode(country) ? country : undefined);
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
