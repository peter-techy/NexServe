"use client";

import * as React from "react";
import Link from "next/link";
import {
  Rocket,
  TrendingUp,
  Users2,
  Sparkles,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Award,
} from "lucide-react";

const FEATURED_ROLES = [
  {
    title: "Sales Executive",
    department: "Sales & Client Acquisition",
    type: "Full-Time",
    location: "On-site / Hybrid",
    description: "Drive corporate outreach, lead conversion, and client relationships across our digital service portfolios.",
  },
  {
    title: "Digital Marketing & Brand Strategist",
    department: "Marketing",
    type: "Full-Time",
    location: "On-site / Hybrid",
    description: "Design and implement high-converting performance marketing, SEO, and social growth campaigns for top brands.",
  },
  {
    title: "Content & Creative Solutions Lead",
    department: "Creative Studio",
    type: "Full-Time",
    location: "On-site / Hybrid",
    description: "Produce impactful multimedia content, brand narratives, and visual assets tailored for digital platforms.",
  },
];

export function CareersSection() {
  return (
    <section
      id="careers"
      className="border-t border-[#225789]/20 bg-radial from-[#e1eefb]/50 via-[#f4f8fd] to-[#f4f8fd] px-6 py-20 sm:px-10 lg:px-16 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Careers Info */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#185fa5]/20 bg-white/80 px-3.5 py-1 text-[11px] font-bold tracking-widest text-[#185fa5] uppercase shadow-xs backdrop-blur-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> WE'RE HIRING
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
              Join our team and build
              <br />
              <span className="gradient-text">what's next.</span>
            </h2>

            <p className="mt-6 text-sm leading-relaxed text-[#52677e]">
              Looking for your next challenge? NexServe connects talented engineers, designers, sales specialists, and leaders to build high-impact digital solutions.
            </p>

            {/* Culture / Value points */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <Rocket className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">High Impact & Modern Stack</p>
                  <p className="mt-0.5 text-[#52677e]">Work on Next.js, cloud systems, and real customer products.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <TrendingUp className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">Rapid Growth & Mentorship</p>
                  <p className="mt-0.5 text-[#52677e]">Clear evaluation metrics and direct promotion opportunities.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#b3cce3] bg-white/80 p-3.5 text-xs text-[#142f4c] shadow-xs backdrop-blur-sm">
                <Users2 className="size-4 shrink-0 text-[#185fa5] mt-0.5" />
                <div>
                  <p className="font-bold text-[#185fa5]">Supportive & Agile Team</p>
                  <p className="mt-0.5 text-[#52677e]">Thoughtful ideas, clear communication, and collaborative spirit.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#185fa5]/20 bg-[#185fa5]/5 p-4 text-xs text-[#185fa5]">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#185fa5]" /> Direct HR Intake
            </p>
            <p className="mt-1 text-[11px] text-[#52677e]">
              Every application submitted on our dedicated Careers page is delivered directly into the NexServe HR portal for review.
            </p>
          </div>
        </div>

        {/* Right Column: Open Positions Showcase & Dedicated Apply CTA */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-white/80 bg-white/85 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(12,36,72,0.08)] sm:p-10">
          <div>
            <div className="flex items-center justify-between border-b border-[#e2ecf5] pb-4">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-[#185fa5] uppercase">
                  CAREER OPPORTUNITIES
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-[#142f4c] sm:text-3xl">
                  Open Positions at <span className="gradient-text">NexServe.</span>
                </h3>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="size-3.5" /> Accepting Applications
              </span>
            </div>

            <p className="mt-4 text-xs text-[#52677e]">
              We are actively hiring motivated candidates. Click below to view detailed requirements and submit your application on our official Careers & Recruitment portal.
            </p>

            <div className="mt-6 space-y-3.5">
              {FEATURED_ROLES.map((role) => (
                <div
                  key={role.title}
                  className="rounded-2xl border border-[#b3cce3]/60 bg-gradient-to-br from-white to-[#f8fbff] p-4.5 shadow-xs transition hover:border-[#185fa5]/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#185fa5]/10 text-[#185fa5]">
                        <Briefcase className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#142f4c]">{role.title}</h4>
                        <p className="text-[11px] text-[#52677e]">{role.department}</p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-[#185fa5]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#185fa5]">
                      {role.type}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-[#52677e] leading-relaxed">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-[#e2ecf5] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#52677e]">
              <Award className="size-4 text-[#185fa5] shrink-0" />
              <span>Full onboarding, competitive packages & performance incentives.</span>
            </div>
            <Link
              href="/careers"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#246fb3] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#185fa5]/25 transition hover:-translate-y-0.5 hover:shadow-xl shrink-0"
            >
              Career & Apply <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
