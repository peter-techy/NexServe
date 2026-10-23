import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a duration in seconds as "Hh MMm" (e.g. 7h 05m). */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "—";
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Formats seconds as HH:MM:SS for live timers. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Decimal hours rounded to 2 places (used for Excel numeric duration). */
export function secondsToHours(totalSeconds: number | null | undefined): number {
  if (!totalSeconds) return 0;
  return Math.round((totalSeconds / 3600) * 100) / 100;
}

export function firstName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "User";
  return fullName.trim().split(/\s+/)[0] || "User";
}

export function initials(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "NS";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NS";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "NS";
}

/** Escapes characters with special meaning in PostgREST `ilike` / `or` filters. */
export function sanitizeSearch(term: string): string {
  return term
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .replace(/[,()*:"']/g, " ")
    .trim()
    .slice(0, 80);
}

export function toInt(value: string | string[] | undefined, fallback: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function str(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}
