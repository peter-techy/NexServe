"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const PHRASES = [
  "Every Possibility.",
  "Every Great Story.",
  "Every Bold Idea.",
  "Every Brand Vision.",
];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState(PHRASES[0]);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentPhrase = PHRASES[phraseIndex];

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 65);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      }
    } else {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 35);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <section id="home" className="relative overflow-hidden px-6 pt-12 pb-20 sm:px-10 lg:px-16 lg:py-24">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -top-24 right-1/4 h-[500px] w-[500px] rounded-full bg-[#e4effb] opacity-60 blur-3xl -z-10" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left Column: Copy & Actions */}
        <div>
          <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
            ✦ DIGITAL MARKETING & CREATIVE SOLUTIONS
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#142f4c] sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Your Vision.
            <br />
            Our Creativity.
            <br />
            <span className="gradient-text">
              {displayText}
              <span className="cursor-blink font-light text-[#1769b2]">|</span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#52677e]">
            NexServe helps brands, businesses, organizations and events turn ideas into impactful digital
            experiences through content creation, marketing, branding and website development.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#246fb3] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#185fa5]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Send an Enquiry <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#a8c4e0] bg-white px-5 py-3.5 text-sm font-bold text-[#142f4c] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f8fbff]"
            >
              Explore Services <ArrowUpRight className="size-4 text-[#185fa5]" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#52677e]">
            One Partner. Every Possibility.
          </p>
        </div>

        {/* Right Column: Visual Laptop Illustration & Floating Badges */}
        <div className="relative flex h-[440px] items-center justify-center lg:h-[480px]">
          {/* Ambient Glow */}
          <div className="animate-pulse-glow absolute inset-10 rounded-full bg-[#b8d5ef] blur-3xl opacity-30 -z-10" />

          {/* Floating Watermark logo */}
          <div className="animate-float-watermark pointer-events-none absolute top-4 left-6 h-36 w-72 opacity-25 -z-10">
            <Image
              src="/brand/logo-trimmed.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          {/* Floating Stat Badge (Top Right) */}
          <div className="absolute top-2 right-2 z-20 w-48 rounded-xl border border-[#b3cce3] bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-transform hover:rotate-0 rotate-2">
            <small className="block text-[9px] font-semibold tracking-wider text-[#52677e] uppercase">
              CREATIVE STRATEGY
            </small>
            <b className="text-xs font-bold text-[#142f4c]">Ideas into Impact</b>
            <div className="my-2.5 flex h-9 items-end gap-1.5">
              <span className="h-[35%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
              <span className="h-[55%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
              <span className="h-[42%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
              <span className="h-[70%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
              <span className="h-[82%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
              <span className="h-[100%] flex-1 rounded-xs bg-gradient-to-t from-[#185fa5] to-[#6699ce]" />
            </div>
            <small className="block text-[9px] text-[#52677e]">Creativity meets purpose</small>
          </div>

          {/* 3D Perspective Laptop */}
          <div className="perspective-laptop relative z-10 w-full max-w-[420px] transition-transform duration-500 hover:rotate-0">
            <div className="rounded-t-2xl border border-[#9cbada] bg-gradient-to-b from-[#edf5fd] to-white p-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#225789]/20 pb-2.5 text-[11px] font-medium text-[#142f4c]">
                <span>NexServe</span>
                <span className="text-[9px] font-bold text-[#185fa5]">● CREATIVE STUDIO</span>
              </div>

              <div className="grid grid-cols-2 items-center gap-3 py-6">
                <div>
                  <small className="text-[8px] font-semibold tracking-wider text-[#52677e] uppercase">
                    YOUR NEXT BIG IDEA
                  </small>
                  <h2 className="text-xl font-extrabold text-[#142f4c]">Think Bigger.</h2>
                  <p className="text-[10px] text-[#52677e]">Build. Create. Connect.</p>
                </div>

                {/* SVG Curve */}
                <svg viewBox="0 0 220 110" aria-label="Illustrative growth line" className="w-full">
                  <path
                    d="M4 95 L40 72 L70 80 L105 42 L138 55 L178 18 L215 5"
                    fill="none"
                    stroke="#1769b2"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="border-t border-[#225789]/20 pt-2 text-[9px] font-medium tracking-wider text-[#52677e]">
                CONTENT · BRANDING · DIGITAL GROWTH
              </div>
            </div>

            {/* Laptop Base */}
            <div className="h-3 w-full rounded-b-xl bg-gradient-to-b from-[#b6cbe0] to-[#7998b8]" />
          </div>

          {/* Floating Content Badge (Bottom Left) */}
          <div className="absolute bottom-4 left-2 z-20 rounded-xl border border-[#b3cce3] bg-white/95 p-3 shadow-xl backdrop-blur-md">
            <b className="block text-xs font-bold text-[#142f4c]">✳ &nbsp; NEXSERVE STUDIO</b>
            <small className="text-[10px] text-[#52677e]">Video · Design · Digital</small>
          </div>
        </div>
      </div>
    </section>
  );
}
