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
    <div className="min-h-screen bg-white text-[#142f4c] selection:bg-[#185fa5]/10">
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
