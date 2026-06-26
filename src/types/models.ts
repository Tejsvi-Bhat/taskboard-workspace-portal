/**
 * Domain models shared across the server (route handlers / mock store) and the
 * client (React Query cache, components). Keeping a single source of truth for
 * these shapes is what lets the typed `apiClient` stay honest end-to-end.
 *
 * Ordering is modeled explicitly: a board owns an ordered list of column ids,
 * and each column owns an ordered list of task ids. This makes "move across
 * columns" and "reorder within a column" deterministic and trivially
 * serializable — the source of truth for position is an array index, not a
 * float rank we'd have to rebalance.
 */

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  name: string;
  email: string;
  /** Tailwind-friendly hex used to render a deterministic avatar. */
  avatarColor: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  memberIds: string[];
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  /** Ordered task ids — the source of truth for vertical order. */
  taskIds: string[];
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  isPublic: boolean;
  /** Ordered column ids — the source of truth for horizontal order. */
  columnOrder: string[];
}

export type ActivityType =
  | "task_created"
  | "task_updated"
  | "task_moved"
  | "task_deleted"
  | "board_shared";

export interface Activity {
  id: string;
  boardId: string;
  type: ActivityType;
  taskId: string | null;
  actorName: string;
  message: string;
  createdAt: string;
}

/**
 * Denormalized board payload returned by GET /api/board/:id and
 * GET /api/public/board/:id. The client receives everything it needs to render
 * the board in one round-trip; React Query then owns the cache.
 */
export interface BoardDetail {
  board: Board;
  columns: Column[];
  tasks: Task[];
  members: User[];
}

export interface SessionUser {
  user: User;
  expiresAt: string;
}
