"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";
import type { Task, User } from "@/types/models";

/**
 * A single board column. It's a droppable container wrapping a vertical
 * SortableContext, so tasks can be reordered within it and dropped into it from
 * other columns. Empty columns stay droppable via the container ref.
 */
export function Column({
  id,
  name,
  taskIds,
  tasksById,
  membersById,
  filtering = false,
  onAddTask,
  onTaskClick,
}: {
  id: string;
  name: string;
  taskIds: string[];
  tasksById: Map<string, Task>;
  membersById: Map<string, User>;
  filtering?: boolean;
  onAddTask: (columnId: string) => void;
  onTaskClick: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div data-testid={`column-${id}`} className="flex w-72 shrink-0 flex-col rounded-xl bg-surface-muted/60">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-strong">{name}</h3>
          <span className="rounded-full bg-border px-1.5 text-xs text-muted-strong">
            {taskIds.length}
          </span>
        </div>
        <button
          data-testid={`add-task-${id}`}
          onClick={() => onAddTask(id)}
          className="rounded-md p-1 text-muted hover:bg-border hover:text-foreground"
          aria-label={`Add task to ${name}`}
          title="Add task"
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`scrollbar-thin flex-1 space-y-2 overflow-y-auto rounded-lg px-2 pb-2 transition-colors ${
          isOver ? "bg-brand-soft/60" : ""
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((tid) => {
            const task = tasksById.get(tid);
            if (!task) return null;
            return (
              <SortableTaskCard
                key={tid}
                task={task}
                assignee={task.assigneeId ? membersById.get(task.assigneeId) ?? null : null}
                onClick={() => onTaskClick(tid)}
              />
            );
          })}
        </SortableContext>

        {taskIds.length === 0 &&
          (filtering ? (
            <p className="px-2 py-6 text-center text-xs text-muted">No matching tasks</p>
          ) : (
            <button
              onClick={() => onAddTask(id)}
              className="w-full rounded-lg border border-dashed border-border-strong py-6 text-xs text-muted hover:border-brand hover:text-brand"
            >
              + Add a task
            </button>
          ))}
      </div>
    </div>
  );
}
