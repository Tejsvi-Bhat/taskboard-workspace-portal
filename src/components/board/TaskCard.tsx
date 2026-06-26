import { cn } from "@/lib/utils/cn";
import { PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Task, User } from "@/types/models";

/**
 * Pure, presentational task card. Intentionally free of drag/data concerns so it
 * can be reused verbatim in the authenticated board (wrapped for sorting) and in
 * the read-only public view.
 */
export function TaskCard({
  task,
  assignee,
  onClick,
  dragging,
  interactive = true,
}: {
  task: Task;
  assignee: User | null;
  onClick?: () => void;
  dragging?: boolean;
  interactive?: boolean;
}) {
  const Wrapper = interactive ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "block w-full rounded-lg border border-border bg-surface p-3 text-left shadow-sm",
        interactive && "cursor-pointer transition-shadow hover:border-border-strong hover:shadow-md",
        dragging && "opacity-50",
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <Avatar user={assignee} size={22} />
      </div>
    </Wrapper>
  );
}
