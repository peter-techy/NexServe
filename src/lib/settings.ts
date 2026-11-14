import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE, isValidTimezone } from "@/lib/dates";
import type { AppSettings, ContactSource } from "@/lib/types";

export const DEFAULT_SETTINGS: AppSettings = {
  company_name: "NexServe",
  company_tagline: "One Partner. Every Possibility.",
  business_timezone: DEFAULT_TIMEZONE,
  deal_rule: "deal_outcome",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  company_description: "",
  mission: "",
  vision: "",
  services: [],
  what_we_provide: [],
};

let memorySettingsCache: { data: AppSettings; expiresAt: number } | null = null;
const SETTINGS_CACHE_TTL_MS = 60_000; // 60 seconds

export function invalidateSettingsCache() {
  memorySettingsCache = null;
}

export const getSettings = cache(async (): Promise<AppSettings> => {
  const now = Date.now();
  if (memorySettingsCache && memorySettingsCache.expiresAt > now) {
    return memorySettingsCache.data;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("app_settings").select("key, value");
    if (error || !data) {
      if (memorySettingsCache) return memorySettingsCache.data;
      return DEFAULT_SETTINGS;
    }
    const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const row of data) merged[row.key] = row.value;
    const settings = merged as unknown as AppSettings;
    if (!isValidTimezone(settings.business_timezone)) settings.business_timezone = DEFAULT_TIMEZONE;
    
    memorySettingsCache = {
      data: settings,
      expiresAt: now + SETTINGS_CACHE_TTL_MS,
    };
    return settings;
  } catch {
    if (memorySettingsCache) return memorySettingsCache.data;
    return DEFAULT_SETTINGS;
  }
});

export const getContactSources = cache(async (includeInactive = false): Promise<ContactSource[]> => {
  const supabase = await createClient();
  let query = supabase.from("contact_sources").select("*").order("sort_order").order("label");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data } = await query;
  return (data as ContactSource[]) ?? [];
});
