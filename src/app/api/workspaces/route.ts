import { getWorkspacesForUser } from "@/lib/mock/db";
import { ok, latency, requireSession } from "@/lib/api/http";

/** GET /api/workspaces — workspaces the current user belongs to. */
export async function GET() {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const workspaces = getWorkspacesForUser(guard.session.user.id);
  return ok({ workspaces });
}
