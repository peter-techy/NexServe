/**
 * Timezone-aware date helpers. All timestamps are stored in UTC; the business
 * timezone (app_settings.business_timezone) is used for display, "today" and
 * report day boundaries. These helpers mirror ns_day_start()/ns_day_end() in SQL.
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function isValidYmd(value: string): boolean {
  if (!YMD.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function zonedParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24, mi: get("minute"), s: get("second") };
}

/** Offset (ms) of the timezone from UTC at the given instant. */
export function tzOffsetMs(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converts a wall-clock time in `tz` to a UTC Date. */
export function zonedTimeToUtc(ymd: string, hhmm: string, tz: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = (hhmm || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh || 0, mm || 0);
  const off1 = tzOffsetMs(new Date(guess), tz);
  let t = guess - off1;
  const off2 = tzOffsetMs(new Date(t), tz);
  if (off2 !== off1) t = guess - off2;
  return new Date(t);
}

/** Inclusive start of the business day (UTC instant). */
export function dayStartUtc(ymd: string, tz: string): Date {
  return zonedTimeToUtc(ymd, "00:00", tz);
}

/** Exclusive end of the business day (start of next day, UTC instant). */
export function dayEndUtc(ymd: string, tz: string): Date {
  return zonedTimeToUtc(addDays(ymd, 1), "00:00", tz);
}

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** YYYY-MM-DD of `date` in the business timezone. */
export function businessDate(date: Date | string, tz: string): string {
  const p = zonedParts(typeof date === "string" ? new Date(date) : date, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function todayYmd(tz: string): string {
  return businessDate(new Date(), tz);
}

/** HH:MM of `date` in the business timezone (for datetime inputs). */
export function businessTime(date: Date | string, tz: string): string {
  const p = zonedParts(typeof date === "string" ? new Date(date) : date, tz);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

export function formatDate(value: string | Date | null | undefined, tz: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string | Date | null | undefined, tz: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function formatTime(value: string | Date | null | undefined, tz: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true }).format(
    new Date(value),
  );
}

/** Formats a YYYY-MM-DD business date without timezone shifting. */
export function formatYmd(ymd: string): string {
  if (!isValidYmd(ymd)) return ymd;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export type PeriodKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  custom: "Custom range",
};

export interface DateRange {
  from: string;
  to: string;
  period: PeriodKey;
  error?: string;
}

/** Resolves period/from/to search params into an inclusive business-date range. */
export function resolveRange(
  params?: { period?: string; from?: string; to?: string } | null,
  tz: string = DEFAULT_TIMEZONE,
  defaultPeriod: PeriodKey = "today",
): DateRange {
  const safeParams = params || {};
  const safeTz = tz && isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
  const today = todayYmd(safeTz);
  const period = (safeParams.period as PeriodKey) || (safeParams.from || safeParams.to ? "custom" : defaultPeriod);
  switch (period) {
    case "today":
      return { from: today, to: today, period };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y, period };
    }
    case "7d":
      return { from: addDays(today, -6), to: today, period };
    case "30d":
      return { from: addDays(today, -29), to: today, period };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today, period };
    case "custom": {
      const from = safeParams.from && isValidYmd(safeParams.from) ? safeParams.from : today;
      const to = safeParams.to && isValidYmd(safeParams.to) ? safeParams.to : from;
      if (from > to) return { from: to, to: from, period, error: "The start date was after the end date; the range has been swapped." };
      const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
      if (days > 366) return { from: addDays(to, -366), to, period, error: "Date ranges are limited to one year." };
      return { from, to, period };
    }
    default:
      return { from: today, to: today, period: "today" };
  }
}

export function rangeLabel(range: DateRange): string {
  if (range.from === range.to) return formatYmd(range.from);
  return `${formatYmd(range.from)} – ${formatYmd(range.to)}`;
}
