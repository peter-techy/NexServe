import { getSession, homeFor } from "@/lib/auth";
import { LandingPage } from "@/components/public/landing-page";

export default async function HomePage() {
  const session = await getSession();
  const workspaceHref = session?.profile ? homeFor(session.profile.role) : null;
  const role = session?.profile ? session.profile.role : null;

  return <LandingPage workspaceHref={workspaceHref} role={role} />;
}
