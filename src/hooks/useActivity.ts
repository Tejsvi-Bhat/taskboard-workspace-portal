"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";

/**
 * Recent activity for a board, polled every few seconds. This is the client half
 * of the "simulated real-time" story — the server-side simulator mutates tasks,
 * and this poll surfaces those changes in the feed.
 */
export function useActivity(boardId: string) {
  return useQuery({
    queryKey: queryKeys.activity(boardId),
    queryFn: async () => (await api.activity(boardId)).activities,
    refetchInterval: 5000,
  });
}
