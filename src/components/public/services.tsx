"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, TrendingUp, Sparkles, Layout } from "lucide-react";

export interface ServiceItem {
  number: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  bullets: string[];
}

export const SERVICES: ServiceItem[] = [
  {
    number: "01",
    category: "CREATE",
    title: "Reels, Videography & Content Creation",
    description: "We turn ideas and footage into engaging visual content for brands, organizations and events.",
    icon: "▶",
    bullets: [
      "Instagram Reels and short-form videos",
      "Promotional and commercial videos",
      "Event photography and videography",
      "Video editing and post-production",
      "Social media creatives and campaign assets",
      "Content planning and production",
    ],
  },
  {
    number: "02",
    category: "GROW",
    title: "Digital Marketing & Social Media",
    description: "We help businesses strengthen their online presence and reach relevant audiences through planned marketing activities.",
    icon: "↗",
    bullets: [
      "Social media management",
      "Digital marketing strategy",
      "Content calendars and campaign planning",
      "Brand communication and positioning",
      "Marketing strategy for startups",
      "Campaign execution and performance reporting",
    ],
  },
  {
    number: "03",
    category: "DESIGN",
    title: "Branding & Graphic Design",
    description: "We help businesses create a consistent and recognizable visual identity.",
    icon: "✳",
    bullets: [
      "Logo and visual identity design",
      "Posters, brochures and promotional graphics",
      "Brand guidelines and visual communication",
      "Campaign design and marketing collateral",
      "Business presentations and creative assets",
    ],
  },
  {
    number: "04",
    category: "BUILD",
    title: "Website & Digital Presence",
    description: "We help clients establish or improve their online presence with professional digital experiences.",
    icon: "⌘",
    bullets: [
      "Business websites and landing pages",
      "Website design and development",
      "Service and portfolio websites",
      "Website content and brand integration",
      "Digital presence for startups and local businesses",
    ],
  },
];

export function ServicesSection({ onSelectService }: { onSelectService?: (serviceName: string) => void }) {
  const handleServiceClick = (serviceTitle: string) => {
    if (onSelectService) {
      onSelectService(serviceTitle);
    }
    // Also update form select if present
    const select = document.querySelector("#service") as HTMLSelectElement | null;
    if (select) {
      select.value = serviceTitle;
    }
  };

  return (
    <section id="services" className="border-t border-white/50 bg-gradient-to-b from-transparent to-white/40 px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
              WHAT NEXSERVE DOES
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
              Creative solutions.
              <br />
              <span className="gradient-text">Every possibility.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#52677e]">
            From the first creative idea to your complete digital presence, we help bring your brand to life.
          </p>
        </div>

        {/* 4 Service Cards with glassmorphism */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {SERVICES.map((srv) => (
            <article
              key={srv.number}
              className="group flex flex-col rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:border-[#185fa5]/40 hover:shadow-[0_16px_40px_rgba(24,120,144,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-full border border-[#c3d7eb] bg-[#eaf3fc] text-base font-bold text-[#185fa5]">
                  {srv.icon}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-[#185fa5]">
                  {srv.number} / {srv.category}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold text-[#142f4c]">
                {srv.title}
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[#52677e]">
                {srv.description}
              </p>

              <ul className="my-6 space-y-2 border-t border-line/60 pt-4 text-xs text-[#52677e]">
                {srv.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#1769b2]">↗</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                <Link
                  href="#contact"
                  onClick={() => handleServiceClick(srv.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#185fa5] transition hover:text-[#103f70] hover:underline"
                >
                  Enquire about this service <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
