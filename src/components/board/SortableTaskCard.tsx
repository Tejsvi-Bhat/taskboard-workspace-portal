"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { Task, User } from "@/types/models";

/**
 * Drag-enabled wrapper around the presentational TaskCard. Keeping the sortable
 * concern here means TaskCard stays reusable for the static public view.
 */
export function SortableTaskCard({
  task,
  assignee,
  onClick,
}: {
  task: Task;
  assignee: User | null;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

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
}
