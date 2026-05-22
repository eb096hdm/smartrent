import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Faqs } from "@/components/Faqs";

import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-paper">
      <Hero />
      <About />
      <Services />
      <Faqs />
      
      <Footer />
    </main>
  );
};

export default Index;
