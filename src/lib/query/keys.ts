/**
 * Centralized React Query keys. Co-locating them prevents typos and makes cache
 * invalidation explicit and greppable. Keys are hierarchical so we can
 * invalidate broadly (all boards) or narrowly (one board) as needed.
 */
export const queryKeys = {
  session: ["session"] as const,
  workspaces: ["workspaces"] as const,
  boards: (workspaceId: string) => ["boards", workspaceId] as const,
  board: (boardId: string) => ["board", boardId] as const,
  activity: (boardId: string) => ["activity", boardId] as const,
};
