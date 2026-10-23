import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (session && session.profile.is_active) {
    redirect(homeFor(session.profile.role));
  }
  redirect("/login");
}
