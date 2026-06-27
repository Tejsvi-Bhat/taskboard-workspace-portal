"use client";

import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { Task, User } from "@/types/models";

/**
 * Drag-enabled wrapper around the presentational TaskCard. Keeping the sortable
 * concern here means TaskCard stays reusable for the static public view.
 *
 * Memoized with a stable `onSelect(taskId)` callback (instead of an inline
 * closure) so cards in a large column don't all re-render when one card is
 * dragged or the board polls.
 */
export const SortableTaskCard = memo(function SortableTaskCard({
  task,
  assignee,
  onSelect,
}: {
  task: Task;
  assignee: User | null;
  onSelect: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const onClick = useCallback(() => onSelect(task.id), [onSelect, task.id]);

  return (
    <div
      ref={setNodeRef}
      data-testid={`task-${task.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <TaskCard task={task} assignee={assignee} onClick={onClick} dragging={isDragging} />
    </div>
  );
});
