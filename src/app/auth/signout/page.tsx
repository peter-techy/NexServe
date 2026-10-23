import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SignOutPage() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout error
  }
  redirect("/login");
}
