"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "@/store/toast";
import type { BoardDetail } from "@/types/models";

/** Toggle a board's public visibility, optimistically updating the cached board. */
export function useShareBoard(boardId: string) {
  const qc = useQueryClient();
  const key = queryKeys.board(boardId);

  return useMutation({
    mutationFn: (isPublic: boolean) => api.shareBoard(boardId, isPublic),
    onMutate: async (isPublic) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<BoardDetail>(key);
      if (previous) {
        qc.setQueryData<BoardDetail>(key, {
          ...previous,
          board: { ...previous.board, isPublic },
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Couldn't update sharing. Please try again.");
    },
    onSuccess: (_d, isPublic) => {
      toast.success(isPublic ? "Board is now public" : "Board is now private");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}
