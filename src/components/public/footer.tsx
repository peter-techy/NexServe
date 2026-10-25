import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#225789]/20 bg-[#eaf3fc] px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="#home" className="inline-block">
            <div className="relative h-12 w-44">
              <Image
                src="/brand/logo-trimmed.png"
                alt="NexServe"
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <p className="mt-2 text-xs font-medium text-[#52677e]">
            One Partner. Every Possibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#52677e]">
          <Link href="#about" className="transition hover:text-[#185fa5]">
            About
          </Link>
          <Link href="#services" className="transition hover:text-[#185fa5]">
            Services
          </Link>
          <Link href="#portfolio" className="transition hover:text-[#185fa5]">
            Portfolio
          </Link>
          <Link href="#contact" className="transition hover:text-[#185fa5]">
            Enquiry
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1 rounded-md bg-white/70 px-3 py-1.5 text-xs text-[#142f4c] shadow-xs transition hover:bg-white hover:text-[#185fa5]"
          >
            <LogIn className="size-3 text-[#185fa5]" /> Employee Sign In
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-[#cbddeb] pt-6 text-xs text-[#52677e]">
        © {currentYear} NexServe. All rights reserved.
      </div>
    </footer>
  );
}
