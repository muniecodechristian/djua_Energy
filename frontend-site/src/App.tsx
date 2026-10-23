import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { Hero } from './components/Hero.tsx';
import { TrustMetrics } from './components/TrustMetrics.tsx';
import { PartnersMarquee } from './components/PartnersMarquee.tsx';
import { EcosystemTabs } from './components/EcosystemTabs.tsx';
import { SupervisionSuite } from './components/SupervisionSuite.tsx';
import { Solutions } from './components/Solutions.tsx';
import { Pricing } from './components/Pricing.tsx';
import { Testimonials } from './components/Testimonials.tsx';
import { ControlFeatures } from './components/ControlFeatures.tsx';
import { Faq } from './components/Faq.tsx';
import { Footer } from './components/Footer.tsx';
import { PilotModal } from './components/PilotModal.tsx';

export default function App() {
  const [isPilotOpen, setIsPilotOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Entreprises & Médical');

  const handleOpenPilot = (plan?: string) => {
    if (plan) setSelectedPlan(plan);
    setIsPilotOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Header */}
      <Header
        onOpenPilot={() => handleOpenPilot()}
        appLoginUrl="http://localhost:5173/"
      />

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
