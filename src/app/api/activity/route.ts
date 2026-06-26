import { getActivityForBoard, getBoard, getWorkspacesForUser } from "@/lib/mock/db";
import { ensureSimulator } from "@/lib/mock/simulator";
import { ok, fail, requireSession } from "@/lib/api/http";

/**
 * GET /api/activity?boardId= — recent activity for a board. Polled by the client
 * to simulate real-time updates. No artificial latency here since it's polled
 * frequently and should feel snappy.
 */
export async function GET(req: Request) {
  ensureSimulator();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const boardId = new URL(req.url).searchParams.get("boardId");
  if (!boardId) return fail(400, "boardId is required.", "INVALID_INPUT");

  const board = getBoard(boardId);
  if (!board) return fail(404, "Board not found.", "NOT_FOUND");

  const memberWorkspaces = getWorkspacesForUser(guard.session.user.id);
  if (!memberWorkspaces.some((w) => w.id === board.workspaceId)) {
    return fail(403, "You don't have access to that board.", "FORBIDDEN");
  }

  return ok({ activities: getActivityForBoard(boardId) });
}
