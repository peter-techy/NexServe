import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { JobApplicationForm } from "@/components/careers/application-form";
import {
  Rocket,
  Users2,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers & Job Application — NexServe",
  description:
    "Join the NexServe team. Explore openings in engineering, design, marketing, and business development.",
};

const PERKS = [
  {
    icon: Rocket,
    title: "High-Impact Projects",
    desc: "Work on cutting-edge digital solutions, web applications, and enterprise products.",
  },
  {
    icon: TrendingUp,
    title: "Fast Career Trajectory",
    desc: "Direct mentorship, clear performance metrics, and rapid growth opportunities.",
  },
  {
    icon: Users2,
    title: "Supportive Culture",
    desc: "Collaborative, agile environment where thoughtful ideas and creativity thrive.",
  },
  {
    icon: Award,
    title: "Competitive Compensation",
    desc: "Attractive compensation packages, recognition, and performance bonuses.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#f4f8fd] text-[#142f4c]">
      <PublicNavbar />

      <main className="relative overflow-hidden pt-10 pb-20">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-radial from-[#185fa5]/12 to-transparent blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          {/* Hero Header */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#185fa5]/20 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#185fa5] shadow-xs backdrop-blur-md">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" /> We're Hiring
            </span>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#142f4c] sm:text-5xl lg:text-6xl">
              Build the future of digital service with <span className="gradient-text">NexServe.</span>
            </h1>

            <p className="mt-4 text-base text-[#52677e] sm:text-lg">
              One Partner. Every Possibility. We are looking for driven, innovative minds ready to make an impact.
            </p>
          </div>

          {/* Perks Grid */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="rounded-2xl border border-white/80 bg-white/70 p-6 shadow-xs backdrop-blur-md transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#185fa5]/10 text-[#185fa5]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#142f4c]">{perk.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#52677e]">{perk.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Application Form Section */}
          <div className="mt-16 mx-auto max-w-3xl" id="apply">
            <JobApplicationForm />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
