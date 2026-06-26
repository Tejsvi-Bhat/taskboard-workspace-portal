import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Authenticated layout. This is the authoritative auth gate: it validates the
 * session against the store (catching expiry the edge middleware can't see) and
 * redirects to /login when there's no valid session. The resolved user is
 * handed to the client tree via SessionProvider.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <SessionProvider user={session.user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
