const FALLBACK_SUPABASE_URL = "https://scloeuggygbouslegfyw.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbG9ldWdneWdib3VzbGVnZnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NzA4NjEsImV4cCI6MjEwODM0Njg2MX0.aOrj7LmmBKczdO0r93RlGl8JNNF4YTtdOOpA9PYnkNY";

/** Centralised, resilient environment access without crashing on missing non-critical vars. */
export const env = {
  supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
  supabaseAnonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY,
  serviceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || "https://nex-serve-liard.vercel.app").replace(/\/$/, ""),
  resendApiKey: () => process.env.RESEND_API_KEY || "",
  contactNotifyEmail: () => process.env.CONTACT_NOTIFY_EMAIL || "",
  contactFromEmail: () => process.env.CONTACT_FROM_EMAIL || "",
};
