import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-only UI state for "which workspace am I looking at". Persisted to
 * localStorage so a refresh keeps you in context. This is deliberately separate
 * from server state (React Query): the *list* of workspaces is server data, but
 * the *current selection* is a local UI concern.
 */
interface WorkspaceState {
  currentWorkspaceId: string | null;
  setCurrentWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),
    }),
    { name: "tb_current_workspace" },
  ),
);
