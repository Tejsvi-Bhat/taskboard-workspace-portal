import { getBoardDetail, getWorkspacesForUser } from "@/lib/mock/db";
import { ok, fail, latency, requireSession } from "@/lib/api/http";

/** GET /api/board/:id — full board (columns + tasks + members) for an authed member. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const detail = getBoardDetail(id);
  if (!detail) return fail(404, "Board not found.", "NOT_FOUND");

  const memberWorkspaces = getWorkspacesForUser(guard.session.user.id);
  if (!memberWorkspaces.some((w) => w.id === detail.board.workspaceId)) {
    return fail(403, "You don't have access to that board.", "FORBIDDEN");
  }

  return ok(detail);
}
