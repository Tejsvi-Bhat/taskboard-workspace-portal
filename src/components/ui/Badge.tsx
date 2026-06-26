import { cn } from "@/lib/utils/cn";
import type { TaskPriority } from "@/types/models";

/** Generic pill. */
export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        "bg-surface-muted text-muted-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-surface-muted text-muted-strong",
  medium: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Priority-specific badge with a color scale that reads at a glance. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge className={priorityStyles[priority]}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {priorityLabels[priority]}
    </Badge>
  );
}
