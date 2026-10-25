import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left: Logo Showcase Card */}
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-[#225789]/20 bg-radial from-white via-[#edf5fd] to-[#f0f6fc] p-10 shadow-xs">
          <div className="relative h-28 w-72 sm:h-32 sm:w-80">
            <Image
              src="/brand/logo-trimmed.png"
              alt="NexServe Logo"
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-6 text-[10px] font-bold tracking-[0.2em] text-[#52677e]">
            ONE PARTNER. EVERY POSSIBILITY.
          </p>
        </div>

        {/* Right: Narrative */}
        <div>
          <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
            MEET NEXSERVE
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
            More than a service.
            <br />
            <span className="gradient-text">A creative partner.</span>
          </h2>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#52677e]">
            <p>
              NexServe brings content creation, digital marketing, branding and website development together under one creative partnership.
            </p>
            <p>
              We work with brands, businesses, startups, organizations and events to turn ideas into clear communication and engaging digital experiences.
            </p>
            <p>
              Whether you need a compelling reel, a stronger social presence, a recognizable brand identity or a professional website, our goal is to help your vision move forward.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#246fb3] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#185fa5]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Let's Build Together <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
