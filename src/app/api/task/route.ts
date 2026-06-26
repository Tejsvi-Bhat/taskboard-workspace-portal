import { createTask, getBoardDetail, getWorkspacesForUser } from "@/lib/mock/db";
import { createTaskSchema } from "@/lib/api/schemas";
import { ok, fail, latency, requireSession } from "@/lib/api/http";

/** POST /api/task — create a task in a column. */
export async function POST(req: Request) {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const parsed = createTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid task.";
    return fail(400, message, "INVALID_INPUT");
  }

  const detail = getBoardDetail(parsed.data.boardId);
  if (!detail) return fail(404, "Board not found.", "NOT_FOUND");

  const memberWorkspaces = getWorkspacesForUser(guard.session.user.id);
  if (!memberWorkspaces.some((w) => w.id === detail.board.workspaceId)) {
    return fail(403, "You don't have access to that board.", "FORBIDDEN");
  }

  const task = createTask(parsed.data, guard.session.user.name);
  if (!task) return fail(400, "Could not create task in that column.", "INVALID_INPUT");

  return ok({ task }, { status: 201 });
}
