import { getCurrentSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";

/** GET /api/session — introspect the current session (used to bootstrap the client). */
export async function GET() {
  const session = await getCurrentSession();
  if (!session) return fail(401, "Not authenticated.", "SESSION_EXPIRED");
  return ok(session);
}
