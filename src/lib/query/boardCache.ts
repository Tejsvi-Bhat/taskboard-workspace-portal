import type { BoardDetail, Task } from "@/types/models";
import type { UpdateTaskBody } from "@/lib/api/schemas";

/**
 * Pure, immutable transforms over a cached BoardDetail. These power optimistic
 * updates: the UI applies the same transform the server will, so drag/drop,
 * edits and deletes feel instant. Keeping them pure makes them easy to reason
 * about (and to roll back — we just restore the previous snapshot).
 */

function statusForColumnName(name: string): Task["status"] {
  const n = name.toLowerCase();
  if (n.includes("done")) return "done";
  if (n.includes("progress")) return "in_progress";
  if (n.includes("block")) return "blocked";
  return "todo";
}

export function applyCreateTask(detail: BoardDetail, task: Task): BoardDetail {
  return {
    ...detail,
    tasks: [...detail.tasks, task],
    columns: detail.columns.map((c) =>
      c.id === task.columnId ? { ...c, taskIds: [...c.taskIds, task.id] } : c,
    ),
  };
}

export function applyDeleteTask(detail: BoardDetail, taskId: string): BoardDetail {
  return {
    ...detail,
    tasks: detail.tasks.filter((t) => t.id !== taskId),
    columns: detail.columns.map((c) =>
      c.taskIds.includes(taskId) ? { ...c, taskIds: c.taskIds.filter((id) => id !== taskId) } : c,
    ),
  };
}

/**
 * Apply a task update — field edits and/or a move/reorder — to the cache.
 * Mirrors the server's updateTask semantics in `lib/mock/db.ts`.
 */
export function applyUpdateTask(
  detail: BoardDetail,
  taskId: string,
  patch: UpdateTaskBody,
): BoardDetail {
  const task = detail.tasks.find((t) => t.id === taskId);
  if (!task) return detail;

  let columns = detail.columns;
  let nextColumnId = task.columnId;
  let nextStatus = task.status;

  const moving = patch.columnId !== undefined || patch.position !== undefined;
  if (moving) {
    const targetColumnId = patch.columnId ?? task.columnId;
    const targetColumn = detail.columns.find((c) => c.id === targetColumnId);
    if (targetColumn) {
      nextColumnId = targetColumnId;
      if (patch.columnId && patch.columnId !== task.columnId) {
        nextStatus = statusForColumnName(targetColumn.name);
      }
      // Remove from wherever it is, then insert at position in target.
      const stripped = detail.columns.map((c) => ({
        ...c,
        taskIds: c.taskIds.filter((id) => id !== taskId),
      }));
      columns = stripped.map((c) => {
        if (c.id !== targetColumnId) return c;
        const pos = Math.max(0, Math.min(patch.position ?? c.taskIds.length, c.taskIds.length));
        const taskIds = [...c.taskIds];
        taskIds.splice(pos, 0, taskId);
        return { ...c, taskIds };
      });
    }
  }

  const tasks = detail.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          title: patch.title ?? t.title,
          description: patch.description ?? t.description,
          priority: patch.priority ?? t.priority,
          assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : t.assigneeId,
          status: patch.status ?? nextStatus,
          columnId: nextColumnId,
          updatedAt: new Date().toISOString(),
        }
      : t,
  );

  return { ...detail, columns, tasks };
}
