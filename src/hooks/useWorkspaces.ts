"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";

/** All workspaces the current user belongs to. */
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: async () => (await api.workspaces()).workspaces,
  });
}

/** Boards within a workspace. Disabled until a workspace is selected. */
export function useBoards(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.boards(workspaceId ?? "none"),
    queryFn: async () => (await api.boards(workspaceId!)).boards,
    enabled: Boolean(workspaceId),
  });
}
