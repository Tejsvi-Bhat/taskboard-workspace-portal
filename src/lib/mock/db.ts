import type {
  Activity,
  Board,
  BoardDetail,
  Column,
  Task,
  User,
  Workspace,
} from "@/types/models";
import { createSeedData, type SeedData } from "./seed";

/**
 * In-memory mock database.
 *
 * This stands in for a real backend. It is a single mutable snapshot that lives
 * for the lifetime of the Node server process (state resets on restart — an
 * accepted trade-off documented in the engineering notes). We stash it on
 * `globalThis` so Next's dev hot-reload doesn't spin up a fresh, empty store on
 * every edit.
 *
 * All write operations also append an Activity entry, which is what powers the
 * simulated real-time feed.
 */

interface Session {
  token: string;
  userId: string;
  expiresAt: number; // epoch ms
}

interface Store extends SeedData {
  sessions: Map<string, Session>;
  seq: number;
}

const SESSION_TTL_MS = 30 * 60_000; // 30 min — short so expiry is demoable.

function createStore(): Store {
  return { ...createSeedData(), sessions: new Map(), seq: 1 };
}

const globalForStore = globalThis as unknown as { __taskboardStore?: Store };
const store: Store = (globalForStore.__taskboardStore ??= createStore());

const nowIso = () => new Date().toISOString();
const nextId = (prefix: string) => `${prefix}-${store.seq++}-${Date.now().toString(36)}`;

// --- Lookups ----------------------------------------------------------------

export function getUser(id: string): User | undefined {
  return store.users.find((u) => u.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getWorkspacesForUser(userId: string): Workspace[] {
  return store.workspaces.filter((w) => w.memberIds.includes(userId));
}

export function getBoardsForWorkspace(workspaceId: string): Board[] {
  return store.boards.filter((b) => b.workspaceId === workspaceId);
}

export function getBoard(boardId: string): Board | undefined {
  return store.boards.find((b) => b.id === boardId);
}

export function getBoardDetail(boardId: string): BoardDetail | undefined {
  const board = getBoard(boardId);
  if (!board) return undefined;

  const columns = board.columnOrder
    .map((cid) => store.columns.find((c) => c.id === cid))
    .filter((c): c is Column => Boolean(c));

  const tasks = store.tasks.filter((t) => t.boardId === boardId);
  const memberIds = new Set(
    store.workspaces.find((w) => w.id === board.workspaceId)?.memberIds ?? [],
  );
  const members = store.users.filter((u) => memberIds.has(u.id));

  return { board, columns, tasks, members };
}

export function getTask(taskId: string): Task | undefined {
  return store.tasks.find((t) => t.id === taskId);
}

/**
 * Authorization check for task-scoped routes: does this user have access to the
 * board that owns this task? Centralized so PATCH/DELETE stay consistent.
 */
export function getTaskBoardAccess(
  taskId: string,
  userId: string,
): "ok" | "not_found" | "forbidden" {
  const task = getTask(taskId);
  if (!task) return "not_found";
  const board = getBoard(task.boardId);
  if (!board) return "not_found";
  const memberWorkspaces = getWorkspacesForUser(userId);
  return memberWorkspaces.some((w) => w.id === board.workspaceId) ? "ok" : "forbidden";
}

export function getActivityForBoard(boardId: string, limit = 30): Activity[] {
  return store.activities
    .filter((a) => a.boardId === boardId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

// --- Mutations --------------------------------------------------------------

export interface CreateTaskInput {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: Task["priority"];
  assigneeId?: string | null;
}

export function createTask(input: CreateTaskInput, actorName: string): Task | undefined {
  const column = store.columns.find((c) => c.id === input.columnId);
  if (!column || column.boardId !== input.boardId) return undefined;

  const task: Task = {
    id: nextId("t"),
    boardId: input.boardId,
    columnId: input.columnId,
    title: input.title,
    description: input.description ?? "",
    status: statusForColumn(column),
    priority: input.priority ?? "medium",
    assigneeId: input.assigneeId ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  store.tasks.push(task);
  column.taskIds.push(task.id);
  logActivity(input.boardId, "task_created", task.id, actorName, `created "${task.title}"`);
  return task;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assigneeId?: string | null;
  /** Move target column. When present the task is (re)placed at `position`. */
  columnId?: string;
  /** Index within the target column's task list. Defaults to end. */
  position?: number;
}

export function updateTask(
  taskId: string,
  patch: UpdateTaskInput,
  actorName: string,
): Task | undefined {
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return undefined;

  const movingColumn = patch.columnId !== undefined;
  const reordering = patch.position !== undefined;

  if (movingColumn || reordering) {
    const targetColumnId = patch.columnId ?? task.columnId;
    const sourceColumn = store.columns.find((c) => c.id === task.columnId);
    const targetColumn = store.columns.find((c) => c.id === targetColumnId);
    if (!targetColumn || targetColumn.boardId !== task.boardId) return undefined;

    // Remove from source, insert into target at the requested position.
    if (sourceColumn) {
      sourceColumn.taskIds = sourceColumn.taskIds.filter((id) => id !== taskId);
    }
    const pos = clamp(patch.position ?? targetColumn.taskIds.length, 0, targetColumn.taskIds.length);
    targetColumn.taskIds.splice(pos, 0, taskId);

    if (task.columnId !== targetColumnId) {
      task.columnId = targetColumnId;
      task.status = statusForColumn(targetColumn);
      logActivity(task.boardId, "task_moved", task.id, actorName, `moved "${task.title}" to ${targetColumn.name}`);
    }
  }

  if (patch.title !== undefined) task.title = patch.title;
  if (patch.description !== undefined) task.description = patch.description;
  if (patch.status !== undefined) task.status = patch.status;
  if (patch.priority !== undefined) task.priority = patch.priority;
  if (patch.assigneeId !== undefined) task.assigneeId = patch.assigneeId;

  task.updatedAt = nowIso();

  const onlyMoved = (movingColumn || reordering) &&
    patch.title === undefined && patch.description === undefined &&
    patch.priority === undefined && patch.assigneeId === undefined &&
    patch.status === undefined;
  if (!onlyMoved) {
    logActivity(task.boardId, "task_updated", task.id, actorName, `updated "${task.title}"`);
  }
  return task;
}

export function deleteTask(taskId: string, actorName: string): boolean {
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return false;

  store.tasks = store.tasks.filter((t) => t.id !== taskId);
  const column = store.columns.find((c) => c.id === task.columnId);
  if (column) column.taskIds = column.taskIds.filter((id) => id !== taskId);

  logActivity(task.boardId, "task_deleted", null, actorName, `deleted "${task.title}"`);
  return true;
}

export function setBoardVisibility(boardId: string, isPublic: boolean, actorName: string): Board | undefined {
  const board = getBoard(boardId);
  if (!board) return undefined;
  board.isPublic = isPublic;
  if (isPublic) {
    logActivity(boardId, "board_shared", null, actorName, `made "${board.name}" public`);
  }
  return board;
}

export function listPublicBoards(): Board[] {
  return store.boards.filter((b) => b.isPublic);
}

// --- Sessions ---------------------------------------------------------------

export function createSession(userId: string): Session {
  const token = nextId("sess");
  const session: Session = { token, userId, expiresAt: Date.now() + SESSION_TTL_MS };
  store.sessions.set(token, session);
  return session;
}

export function getSession(token: string | undefined): Session | undefined {
  if (!token) return undefined;
  const session = store.sessions.get(token);
  if (!session) return undefined;
  if (session.expiresAt <= Date.now()) {
    store.sessions.delete(token);
    return undefined;
  }
  return session;
}

export function expireSession(token: string | undefined): void {
  if (token) store.sessions.delete(token);
}

/** Test/demo helper: force a session to expire immediately. */
export function forceExpireSession(token: string | undefined): void {
  if (token && store.sessions.has(token)) {
    store.sessions.get(token)!.expiresAt = Date.now() - 1;
  }
}

// --- Simulator hook ---------------------------------------------------------

/** Used by the activity simulator to mutate a random task on a public/active board. */
export function simulateRemoteActivity(): Activity | undefined {
  const candidates = store.tasks.filter((t) => t.status !== "done");
  if (candidates.length === 0) return undefined;

  const task = candidates[Math.floor(Math.random() * candidates.length)];
  const actors = ["Bob Nguyen", "Carol Diaz", "Dan Owusu"];
  const actor = actors[Math.floor(Math.random() * actors.length)];
  const board = getBoard(task.boardId);
  if (!board) return undefined;

  // Occasionally move the task to a neighbouring column; otherwise bump priority.
  if (Math.random() < 0.5 && board.columnOrder.length > 1) {
    const idx = board.columnOrder.indexOf(task.columnId);
    const targetIdx = Math.min(board.columnOrder.length - 1, Math.max(0, idx + (Math.random() < 0.5 ? 1 : -1)));
    const targetColumnId = board.columnOrder[targetIdx];
    if (targetColumnId !== task.columnId) {
      updateTask(task.id, { columnId: targetColumnId }, actor);
      return getActivityForBoard(task.boardId, 1)[0];
    }
  }

  const priorities: Task["priority"][] = ["low", "medium", "high", "urgent"];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  updateTask(task.id, { priority }, actor);
  return getActivityForBoard(task.boardId, 1)[0];
}

// --- Internals --------------------------------------------------------------

function statusForColumn(column: Column): Task["status"] {
  const n = column.name.toLowerCase();
  if (n.includes("done")) return "done";
  if (n.includes("progress")) return "in_progress";
  if (n.includes("block")) return "blocked";
  return "todo";
}

function logActivity(
  boardId: string,
  type: Activity["type"],
  taskId: string | null,
  actorName: string,
  message: string,
): void {
  store.activities.push({
    id: nextId("a"),
    boardId,
    type,
    taskId,
    actorName,
    message,
    createdAt: nowIso(),
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
