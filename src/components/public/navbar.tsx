"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowUpRight, ShieldCheck, LogIn } from "lucide-react";

export function PublicNavbar({
  workspaceHref,
  role,
}: {
  workspaceHref?: string | null;
  role?: string | null;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex min-h-[96px] items-center justify-between border-b border-white/50 bg-white/75 px-5 backdrop-blur-2xl sm:px-8 lg:px-12 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <Link href="#home" className="flex items-center gap-3">
        <div className="relative h-14 w-44 sm:h-16 sm:w-56">
          <Image
            src="/brand/logo-trimmed.png"
            alt="NexServe — One Partner. Every Possibility."
            fill
            className="object-contain"
            priority
          />
        </div>
      </Link>

      <nav className="hidden items-center gap-6 md:flex lg:gap-8">
        <Link href="#home" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          Home
        </Link>
        <Link href="#about" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          About
        </Link>
        <Link href="#services" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          Services
        </Link>
        <Link href="/#portfolio" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          Portfolio
        </Link>
        <Link href="/#careers" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          Careers & Apply
        </Link>
        <Link href="/#contact" className="text-sm font-medium text-[#334f6d] transition hover:text-[#185fa5]">
          Contact
        </Link>
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <Link
          href={workspaceHref || "/login"}
          className="flex items-center gap-1.5 rounded-full bg-[#185fa5]/10 px-4 py-2 text-xs font-semibold text-[#185fa5] transition hover:bg-[#185fa5]/20"
        >
          <ShieldCheck className="size-3.5" /> Workspace
        </Link>

        <Link
          href="#contact"
          className="flex items-center gap-1 rounded-full border border-[#185fa5] px-4 py-2 text-xs font-semibold text-[#185fa5] transition hover:bg-[#eaf3fc]"
        >
          Let's Talk <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="flex items-center justify-center rounded-lg border border-[#225789]/20 bg-[#185fa5] p-2 text-white md:hidden"
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col border-b border-white/60 bg-white/90 backdrop-blur-2xl p-6 shadow-2xl md:hidden">
          <Link
            href="#home"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>
          <Link
            href="#about"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            About
          </Link>
          <Link
            href="#services"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            Services
          </Link>
          <Link
            href="/#portfolio"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            Portfolio
          </Link>
          <Link
            href="/#careers"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            Careers & Apply
          </Link>
          <Link
            href="/#contact"
            className="border-b border-line py-3 text-sm font-medium text-[#334f6d]"
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>

          <div className="mt-4 flex flex-col gap-2.5 pt-2">
            <Link
              href={workspaceHref || "/login"}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#185fa5] py-2.5 text-xs font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              <ShieldCheck className="size-4" /> Workspace
            </Link>

            <Link
              href="#contact"
              className="flex items-center justify-center gap-1 rounded-lg border border-[#185fa5] bg-[#eaf3fc] py-2.5 text-xs font-semibold text-[#185fa5]"
              onClick={() => setMobileOpen(false)}
            >
              Let's Talk <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
