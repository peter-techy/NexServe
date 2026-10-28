import type { NextConfig } from "next";

// Bypass local Windows certificate store leaf signature issues for Supabase requests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
