function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See .env.example and README.md.`);
  }
  return value;
}

/** Centralised, lazily-validated environment access. */
export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  resendApiKey: () => process.env.RESEND_API_KEY || "",
  contactNotifyEmail: () => process.env.CONTACT_NOTIFY_EMAIL || "",
  contactFromEmail: () => process.env.CONTACT_FROM_EMAIL || "",
};
