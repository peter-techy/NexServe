import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Full NexServe logo (mark + wordmark + tagline) — the supplied asset. */
export function Logo({ className, href = "/", priority }: { className?: string; href?: string | null; priority?: boolean }) {
  const img = (
    <Image
      src="/brand/nexserve-logo.png"
      alt="NexServe — One Partner. Every Possibility."
      width={451}
      height={151}
      priority={priority}
      className={cn("h-auto w-40", className)}
    />
  );
  return href ? (
    <Link href={href} aria-label="NexServe home" className="inline-block">
      {img}
    </Link>
  ) : (
    img
  );
}

/** Compact mark + company name for headers. */
export function LogoMark({ name = "NexServe", className }: { name?: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image src="/brand/nexserve-mark.png" alt="" width={139} height={151} className="h-7 w-auto" priority />
      <span className="text-[17px] font-bold tracking-tight text-brand-navy">
        {name === "NexServe" ? (
          <>
            Nex<span className="font-normal">Serve</span>
          </>
        ) : (
          name
        )}
      </span>
    </span>
  );
}
