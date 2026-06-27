"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Field } from "@/components/ui/Input";
import { useTaskMutations } from "@/hooks/useBoard";
import type { Column, Task, TaskPriority, User } from "@/types/models";
import type { Command, EditFields } from "@/lib/history/types";

type Mode =
  | { kind: "create"; columnId: string }
  | { kind: "edit"; task: Task };

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

/** True if any edited field differs (used to avoid recording no-op edits). */
function hasChanged(before: EditFields, after: EditFields): boolean {
  return (Object.keys(after) as (keyof EditFields)[]).some((k) => before[k] !== after[k]);
}

/**
 * Unified create/edit task dialog. Reuses the same form for both flows and talks
 * to the optimistic task mutations, so saves and deletes reflect instantly.
 */
export function TaskModal({
  boardId,
  mode,
  columns,
  members,
  onRecord,
  onClose,
}: {
  boardId: string;
  mode: Mode;
  columns: Column[];
  members: User[];
  onRecord: (cmd: Command) => void;
  onClose: () => void;
}) {
  const isEdit = mode.kind === "edit";
  const existing = isEdit ? mode.task : null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState<string>(existing?.assigneeId ?? "");
  const [columnId, setColumnId] = useState<string>(
    isEdit ? mode.task.columnId : mode.columnId,
  );

  const { createTask, updateTask, deleteTask } = useTaskMutations(boardId);
  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;
  const titleError = title.trim().length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (titleError) return;

    if (isEdit && existing) {
      const movedColumn = columnId !== existing.columnId;
      const after: EditFields = {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId || null,
        ...(movedColumn ? { columnId } : {}),
      };
      const before: EditFields = {
        title: existing.title,
        description: existing.description,
        priority: existing.priority,
        assigneeId: existing.assigneeId,
        ...(movedColumn ? { columnId: existing.columnId } : {}),
      };
      updateTask.mutate({ taskId: existing.id, patch: after });
      if (hasChanged(before, after)) {
        onRecord({ kind: "edit", taskId: existing.id, before, after });
      }
    } else {
      const position = columns.find((c) => c.id === columnId)?.taskIds.length ?? 0;
      createTask
        .mutateAsync({
          boardId,
          columnId,
          title: title.trim(),
          description: description.trim(),
          priority,
          assigneeId: assigneeId || null,
        })
        .then((res) => {
          if (res?.task) onRecord({ kind: "create", task: res.task, position });
        })
        .catch(() => {});
    }
    onClose();
  }

  function handleDelete() {
    if (!existing) return;
    const position = columns.find((c) => c.id === existing.columnId)?.taskIds.indexOf(existing.id) ?? 0;
    onRecord({ kind: "delete", task: existing, position });
    deleteTask.mutate(existing.id);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit task" : "New task"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            required
          />
        </Field>

        <Field label="Description" htmlFor="task-desc">
          <Textarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Column" htmlFor="task-col">
            <Select id="task-col" value={columnId} onChange={(e) => setColumnId(e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Priority" htmlFor="task-pri">
            <Select
              id="task-pri"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Assignee" htmlFor="task-assignee">
          <Select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-danger hover:bg-danger-soft">
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={titleError}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
