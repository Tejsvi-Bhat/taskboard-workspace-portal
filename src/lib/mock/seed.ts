import type {
  Activity,
  Board,
  Column,
  Task,
  User,
  Workspace,
} from "@/types/models";

/**
 * Seed data for the in-memory mock backend. Exposed as a factory so the store
 * can rebuild a clean snapshot (e.g. on a hot reload) without sharing mutable
 * references with a previous instance.
 */
export interface SeedData {
  users: User[];
  workspaces: Workspace[];
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  activities: Activity[];
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export function createSeedData(): SeedData {
  const users: User[] = [
    { id: "u-alice", name: "Alice Park", email: "alice@acme.test", avatarColor: "#4f46e5" },
    { id: "u-bob", name: "Bob Nguyen", email: "bob@acme.test", avatarColor: "#0891b2" },
    { id: "u-carol", name: "Carol Diaz", email: "carol@acme.test", avatarColor: "#db2777" },
    { id: "u-dan", name: "Dan Owusu", email: "dan@acme.test", avatarColor: "#16a34a" },
  ];

  const workspaces: Workspace[] = [
    {
      id: "ws-acme",
      name: "Acme Product",
      slug: "acme-product",
      memberIds: ["u-alice", "u-bob", "u-carol", "u-dan"],
    },
    {
      id: "ws-launch",
      name: "Launch Team",
      slug: "launch-team",
      memberIds: ["u-alice", "u-carol"],
    },
  ];

  // --- Boards ---------------------------------------------------------------
  const boards: Board[] = [
    {
      id: "b-roadmap",
      workspaceId: "ws-acme",
      name: "Product Roadmap",
      description: "Quarterly initiatives and their current delivery status.",
      isPublic: true,
      columnOrder: ["c-roadmap-todo", "c-roadmap-progress", "c-roadmap-review", "c-roadmap-done"],
    },
    {
      id: "b-sprint",
      workspaceId: "ws-acme",
      name: "Engineering Sprint",
      description: "Active sprint board for the platform team.",
      isPublic: false,
      columnOrder: ["c-sprint-todo", "c-sprint-progress", "c-sprint-done"],
    },
    {
      id: "b-launch",
      workspaceId: "ws-launch",
      name: "Launch Marketing",
      description: "Go-to-market tasks for the public launch.",
      isPublic: true,
      columnOrder: ["c-launch-todo", "c-launch-progress", "c-launch-done"],
    },
  ];

  // --- Columns --------------------------------------------------------------
  const columns: Column[] = [
    { id: "c-roadmap-todo", boardId: "b-roadmap", name: "To Do", taskIds: ["t-1", "t-2"] },
    { id: "c-roadmap-progress", boardId: "b-roadmap", name: "In Progress", taskIds: ["t-3"] },
    { id: "c-roadmap-review", boardId: "b-roadmap", name: "Review", taskIds: ["t-4"] },
    { id: "c-roadmap-done", boardId: "b-roadmap", name: "Done", taskIds: ["t-5"] },

    { id: "c-sprint-todo", boardId: "b-sprint", name: "To Do", taskIds: ["t-6", "t-7"] },
    { id: "c-sprint-progress", boardId: "b-sprint", name: "In Progress", taskIds: ["t-8"] },
    { id: "c-sprint-done", boardId: "b-sprint", name: "Done", taskIds: ["t-9"] },

    { id: "c-launch-todo", boardId: "b-launch", name: "To Do", taskIds: ["t-10", "t-11"] },
    { id: "c-launch-progress", boardId: "b-launch", name: "In Progress", taskIds: ["t-12"] },
    { id: "c-launch-done", boardId: "b-launch", name: "Done", taskIds: [] },
  ];

  // --- Tasks ----------------------------------------------------------------
  const tasks: Task[] = [
    task("t-1", "b-roadmap", "c-roadmap-todo", "Define Q3 north-star metric", "Align leadership on a single activation metric for the quarter.", "todo", "high", "u-alice", 120),
    task("t-2", "b-roadmap", "c-roadmap-todo", "Customer interview synthesis", "Roll up findings from 12 interviews into themes.", "todo", "medium", "u-carol", 200),
    task("t-3", "b-roadmap", "c-roadmap-progress", "Onboarding redesign", "Reduce time-to-first-value in the new-user flow.", "in_progress", "urgent", "u-bob", 45),
    task("t-4", "b-roadmap", "c-roadmap-review", "Billing self-serve upgrade", "Let teams upgrade plans without contacting sales.", "in_progress", "high", "u-dan", 30),
    task("t-5", "b-roadmap", "c-roadmap-done", "SSO for enterprise", "SAML SSO shipped to GA.", "done", "high", "u-bob", 1440),

    task("t-6", "b-sprint", "c-sprint-todo", "Fix flaky board DnD test", "Drag test intermittently fails in CI.", "todo", "medium", "u-bob", 90),
    task("t-7", "b-sprint", "c-sprint-todo", "Add rate limiting to API", "Protect the public board endpoint.", "todo", "high", "u-dan", 150),
    task("t-8", "b-sprint", "c-sprint-progress", "Optimistic task updates", "Make drag-and-drop feel instant.", "in_progress", "high", "u-alice", 20),
    task("t-9", "b-sprint", "c-sprint-done", "Set up CI pipeline", "Lint, typecheck and build on every PR.", "done", "medium", "u-dan", 2880),

    task("t-10", "b-launch", "c-launch-todo", "Draft launch blog post", "Announcement post for the public launch.", "todo", "high", "u-carol", 300),
    task("t-11", "b-launch", "c-launch-todo", "Prepare social assets", "OG images and short clips for sharing.", "todo", "medium", "u-alice", 260),
    task("t-12", "b-launch", "c-launch-progress", "Set up product landing page", "Public marketing page with sign-up CTA.", "in_progress", "urgent", "u-carol", 60),
  ];

  const activities: Activity[] = [
    activity("a-1", "b-roadmap", "task_moved", "t-3", "Bob Nguyen", "moved \"Onboarding redesign\" to In Progress", 45),
    activity("a-2", "b-roadmap", "task_updated", "t-1", "Alice Park", "updated \"Define Q3 north-star metric\"", 110),
    activity("a-3", "b-sprint", "task_created", "t-8", "Alice Park", "created \"Optimistic task updates\"", 20),
  ];

  return { users, workspaces, boards, columns, tasks, activities };
}

function task(
  id: string,
  boardId: string,
  columnId: string,
  title: string,
  description: string,
  status: Task["status"],
  priority: Task["priority"],
  assigneeId: string,
  ageMinutes: number,
): Task {
  return {
    id,
    boardId,
    columnId,
    title,
    description,
    status,
    priority,
    assigneeId,
    createdAt: minutesAgo(ageMinutes),
    updatedAt: minutesAgo(Math.floor(ageMinutes / 2)),
  };
}

function activity(
  id: string,
  boardId: string,
  type: Activity["type"],
  taskId: string,
  actorName: string,
  message: string,
  ageMinutes: number,
): Activity {
  return { id, boardId, type, taskId, actorName, message, createdAt: minutesAgo(ageMinutes) };
}
