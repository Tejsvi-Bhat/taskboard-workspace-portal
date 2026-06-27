import type { Task, TaskPriority } from "@/types/models";

/**
 * Undo/redo is modeled as a stack of reversible commands. Each command captures
 * enough state to apply both its forward and inverse operation through the
 * existing API — so undo/redo is just "run the inverse / forward and re-sync".
 */
export interface TaskPosition {
  columnId: string;
  position: number;
}

export interface EditFields {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  columnId?: string;
}

export type Command =
  | { kind: "move"; taskId: string; before: TaskPosition; after: TaskPosition }
  | { kind: "edit"; taskId: string; before: EditFields; after: EditFields }
  | { kind: "create"; task: Task; position: number }
  | { kind: "delete"; task: Task; position: number };
