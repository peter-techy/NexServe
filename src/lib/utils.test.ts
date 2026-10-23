import { describe, it, expect } from "vitest";
import { formatDuration, formatClock, firstName, initials, sanitizeSearch } from "./utils";
import { isValidYmd, resolveRange, todayYmd } from "./dates";

describe("Utility functions", () => {
  it("formats duration correctly in hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 00m");
    expect(formatDuration(3665)).toBe("1h 01m");
    expect(formatDuration(7200 + 300)).toBe("2h 05m");
    expect(formatDuration(0)).toBe("0h 00m");
    expect(formatDuration(null)).toBe("—");
  });

  it("formats real-time clocks correctly", () => {
    expect(formatClock(65)).toBe("00:01:05");
    expect(formatClock(3600 + 60 + 1)).toBe("01:01:01");
  });

  it("extracts first name and initials", () => {
    expect(firstName("Alexander Vance")).toBe("Alexander");
    expect(initials("Alexander Vance")).toBe("AV");
    expect(initials("Aman")).toBe("A");
  });

  it("sanitizes search input", () => {
    expect(sanitizeSearch("test%_pattern")).toBe("test\\%\\_pattern");
  });
});

describe("Date calculation logic", () => {
  it("validates YMD strings", () => {
    expect(isValidYmd("2026-10-23")).toBe(true);
    expect(isValidYmd("invalid-date")).toBe(false);
  });

  it("resolves date ranges accurately", () => {
    const tz = "Asia/Kolkata";
    const range = resolveRange({ period: "today" }, tz);
    expect(range.from).toBe(range.to);
    expect(range.period).toBe("today");
  });
});
