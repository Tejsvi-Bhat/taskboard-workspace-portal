import { getBoardDetail, getWorkspacesForUser, setBoardVisibility } from "@/lib/mock/db";
import { shareBoardSchema } from "@/lib/api/schemas";
import { ok, fail, latency, requireSession } from "@/lib/api/http";

/** PATCH /api/board/:id/share — toggle a board's public visibility. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = shareBoardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.", "INVALID_INPUT");

  const board = setBoardVisibility(id, parsed.data.isPublic, guard.session.user.name);
  return ok({ board });
}
