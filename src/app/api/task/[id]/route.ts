import { deleteTask, getTaskBoardAccess, updateTask } from "@/lib/mock/db";
import { updateTaskSchema } from "@/lib/api/schemas";
import { ok, fail, latency, requireSession } from "@/lib/api/http";

/** PATCH /api/task/:id — edit fields and/or move/reorder a task. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const access = getTaskBoardAccess(id, guard.session.user.id);
  if (access === "not_found") return fail(404, "Task not found.", "NOT_FOUND");
  if (access === "forbidden") return fail(403, "You don't have access to that task.", "FORBIDDEN");

  const parsed = updateTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid update.", "INVALID_INPUT");

  const task = updateTask(id, parsed.data, guard.session.user.name);
  if (!task) return fail(400, "Could not update task.", "INVALID_INPUT");

  return ok({ task });
}

/** DELETE /api/task/:id — remove a task. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await latency();
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const access = getTaskBoardAccess(id, guard.session.user.id);
  if (access === "not_found") return fail(404, "Task not found.", "NOT_FOUND");
  if (access === "forbidden") return fail(403, "You don't have access to that task.", "FORBIDDEN");

  deleteTask(id, guard.session.user.name);
  return ok({ ok: true });
}
