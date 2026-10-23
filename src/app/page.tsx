import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

export default async function HomePage() {
  try {
    const session = await getSession();
    if (session && session.profile.is_active) {
      redirect(homeFor(session.profile.role));
    }
  } catch (err) {
    // If auth throws (e.g., in transit or unauthenticated), safely route to login
  }
  redirect("/login");
}
