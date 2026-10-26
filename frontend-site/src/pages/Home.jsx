import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import AboutEnergy from "@/components/ui/sections/AboutEnergy";
import ApproachSections from "@/components/ui/sections/ApproachSections";
import FaqSection from "@/components/ui/sections/FaqSection";
import NosStatistiques from "@/components/ui/nos-statistiques";
import HomeSection2 from "@/components/ui/sections/HomeSection2";
import SplineSceneBasic from "@/components/ui/sections/SplineSceneBasic";
import ScrollToTop from "@/components/ui/ScrollToTop";
import TestimonialV2 from "@/components/ui/testimonial-v2";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <SplineSceneBasic />
        <NosStatistiques />
        <AboutEnergy />
        <ApproachSections />
        <HomeSection2 />
        <TestimonialV2 />
        <FaqSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
