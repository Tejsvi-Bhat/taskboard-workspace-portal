import { getBoardsForWorkspace, getWorkspacesForUser } from "@/lib/mock/db";
import { ok, fail, latency, requireSession } from "@/lib/api/http";

/** GET /api/boards?workspaceId= — boards in a workspace the user can access. */
export async function GET(req: Request) {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) return fail(400, "workspaceId is required.", "INVALID_INPUT");

  const memberWorkspaces = getWorkspacesForUser(guard.session.user.id);
  if (!memberWorkspaces.some((w) => w.id === workspaceId)) {
    return fail(403, "You don't have access to that workspace.", "FORBIDDEN");
  }

  return ok({ boards: getBoardsForWorkspace(workspaceId) });
}
