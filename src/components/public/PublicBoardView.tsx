import { TaskCard } from "@/components/board/TaskCard";
import type { BoardDetail } from "@/types/models";

/**
 * Read-only, server-rendered board for public/shared pages. Reuses the same
 * TaskCard as the authenticated board (in non-interactive mode) so the public
 * view stays visually consistent without shipping any drag/mutation code.
 *
 * Intentionally NOT virtualized: the whole point of the public page is to be
 * crawlable and unfurl-friendly, so every task must be present in the SSR HTML.
 * (Client windowing renders nothing on the server.)
 */
export function PublicBoardView({ detail }: { detail: BoardDetail }) {
  const membersById = new Map(detail.members.map((m) => [m.id, m]));

  return (
    <div className="scrollbar-thin flex gap-4 overflow-x-auto px-5 pb-8">
      {detail.columns.map((column) => {
        const tasks = column.taskIds
          .map((id) => detail.tasks.find((t) => t.id === id))
          .filter((t): t is NonNullable<typeof t> => Boolean(t));

        return (
          <section key={column.id} className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-muted/60">
            <div className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-sm font-semibold text-muted-strong">{column.name}</h2>
              <span className="rounded-full bg-border px-1.5 text-xs text-muted-strong">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-2 px-2 pb-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={task.assigneeId ? membersById.get(task.assigneeId) ?? null : null}
                  interactive={false}
                />
              ))}
              {tasks.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted">No tasks</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
