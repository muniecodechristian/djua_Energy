import React, { useState } from 'react';
import Header from './vitrine/Header.jsx';
import Hero from './vitrine/Hero.jsx';
import TrustMetrics from './vitrine/TrustMetrics.jsx';
import PartnersMarquee from './vitrine/PartnersMarquee.jsx';
import EcosystemTabs from './vitrine/EcosystemTabs.jsx';
import SupervisionSuite from './vitrine/SupervisionSuite.jsx';
import Solutions from './vitrine/Solutions.jsx';
import Pricing from './vitrine/Pricing.jsx';
import Testimonials from './vitrine/Testimonials.jsx';
import ControlFeatures from './vitrine/ControlFeatures.jsx';
import Faq from './vitrine/Faq.jsx';
import Footer from './vitrine/Footer.jsx';
import PilotModal from './vitrine/PilotModal.jsx';
import './vitrine/SiteVitrine.css';

export default function SiteVitrine() {
  const [isPilotOpen, setIsPilotOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Entreprises & Médical');

  const handleOpenPilot = (plan) => {
    if (plan) setSelectedPlan(plan);
    setIsPilotOpen(true);
  };

  return (
    <div className="site-vitrine-root min-h-screen bg-white text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Header */}
      <Header onOpenPilot={() => handleOpenPilot()} />

      {/* Main Showcase Content */}
      <main>
        {/* Hero Section */}
        <Hero onOpenPilot={() => handleOpenPilot()} />

        {/* Operational Trust Metrics */}
        <TrustMetrics />

        {/* Partners & Leaders Marquee */}
        <PartnersMarquee />

        {/* Ecosystem & Hardware Tabs Carousel */}
        <EcosystemTabs />

        {/* Full-featured Supervision & AI Suite */}
        <SupervisionSuite />

        {/* Use Cases & Target Verticals */}
        <Solutions onSelectSolution={(s) => handleOpenPilot(s)} />

        {/* Transparent Pricing & Tiers */}
        <Pricing onSelectTier={(t) => handleOpenPilot(t)} />

        {/* Social Proof & Testimonials */}
        <Testimonials />

        {/* Total Control Features Grid */}
        <ControlFeatures onOpenPilot={() => handleOpenPilot()} />

        {/* Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Pilot Trial Modal */}
      <PilotModal
        isOpen={isPilotOpen}
        onClose={() => setIsPilotOpen(false)}
        preselectedPlan={selectedPlan}
      />
    </div>
  );
}
