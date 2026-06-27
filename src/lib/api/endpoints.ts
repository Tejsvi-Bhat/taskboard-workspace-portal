import { apiClient } from "@/lib/api/client";
import type {
  Activity,
  Board,
  BoardDetail,
  SessionUser,
  Task,
  Workspace,
} from "@/types/models";
import type { CreateTaskBody, UpdateTaskBody } from "@/lib/api/schemas";

/**
 * Typed wrappers around each API route. This is the only module that knows URL
 * shapes; hooks and components import these functions, keeping endpoints
 * refactorable from one place.
 */
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post<SessionUser>("/api/login", { email, password }),
  logout: () => apiClient.post<{ ok: true }>("/api/logout"),
  session: () => apiClient.get<SessionUser>("/api/session"),

  // Workspaces & boards
  workspaces: () => apiClient.get<{ workspaces: Workspace[] }>("/api/workspaces"),
  boards: (workspaceId: string) =>
    apiClient.get<{ boards: Board[] }>(`/api/boards?workspaceId=${encodeURIComponent(workspaceId)}`),
  board: (boardId: string) => apiClient.get<BoardDetail>(`/api/board/${boardId}`),
  shareBoard: (boardId: string, isPublic: boolean) =>
    apiClient.patch<{ board: Board }>(`/api/board/${boardId}/share`, { isPublic }),

  // Tasks
  createTask: (body: CreateTaskBody) => apiClient.post<{ task: Task }>("/api/task", body),
  updateTask: (taskId: string, body: UpdateTaskBody) =>
    apiClient.patch<{ task: Task }>(`/api/task/${taskId}`, body),
  deleteTask: (taskId: string) => apiClient.delete<{ ok: true }>(`/api/task/${taskId}`),

  // Activity
  activity: (boardId: string) =>
    apiClient.get<{ activities: Activity[] }>(`/api/activity?boardId=${encodeURIComponent(boardId)}`),

  // Simulated-activity feature flag
  getSimulation: () => apiClient.get<{ enabled: boolean }>("/api/simulation"),
  setSimulation: (enabled: boolean) =>
    apiClient.patch<{ enabled: boolean }>("/api/simulation", { enabled }),
};
