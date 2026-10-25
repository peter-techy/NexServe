"use client";

import * as React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { HeroSection } from "@/components/public/hero";
import { ServicesSection } from "@/components/public/services";
import { AboutSection } from "@/components/public/about";
import { PortfolioSection } from "@/components/public/portfolio";
import { ProcessSection } from "@/components/public/process";
import { ContactSection } from "@/components/public/contact";
import { PublicFooter } from "@/components/public/footer";

export function LandingPage({
  workspaceHref,
  role,
}: {
  workspaceHref?: string | null;
  role?: string | null;
}) {
  const [selectedService, setSelectedService] = React.useState<string>("");

  const handleSelectService = (serviceTitle: string) => {
    setSelectedService(serviceTitle);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]/70 text-[#142f4c] selection:bg-[#185fa5]/15 relative">
      {/* Floating ambient glow orbs for authentic public site glassmorphism */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-10 size-[550px] rounded-full bg-brand-teal/15 blur-3xl" />
        <div className="absolute top-1/4 -left-40 size-[600px] rounded-full bg-brand-navy/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 size-[550px] rounded-full bg-[#185fa5]/10 blur-3xl" />
        <div className="absolute top-3/4 -left-20 size-[600px] rounded-full bg-brand-teal/10 blur-3xl" />
      </div>

      <PublicNavbar workspaceHref={workspaceHref} role={role} />
      <main>
        <HeroSection />
        <ServicesSection onSelectService={handleSelectService} />
        <AboutSection />
        <PortfolioSection />
        <ProcessSection />
        <ContactSection selectedService={selectedService} />
      </main>
      <PublicFooter />
    </div>
  );
}
