import Navbar from "@/components/sections/Navbar";

import Hero from "@/components/sections/Hero";
import RiskZoneMap from "@/components/sections/RiskZoneMap";
import ModelArchitecture from "@/components/sections/ModelArchitecture";
import InteractiveDemo from "@/components/sections/InteractiveDemo";
import GradCAMSection from "@/components/sections/GradCAMSection";
import Results from "@/components/sections/Results";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f4f0] selection:bg-fire-orange selection:text-white">
      <Navbar />

      <Hero />
      <RiskZoneMap />
      <ModelArchitecture />
      <InteractiveDemo />
      <GradCAMSection />
      <Results />
      <FinalCTA />
      <Footer />
    </main>
  );
}
