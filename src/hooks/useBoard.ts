"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import {
  applyCreateTask,
  applyDeleteTask,
  applyUpdateTask,
} from "@/lib/query/boardCache";
import { toast } from "@/store/toast";
import type { BoardDetail, Task } from "@/types/models";
import type { CreateTaskBody, UpdateTaskBody } from "@/lib/api/schemas";

/**
 * Board data + task mutations. The mutations are optimistic: each one cancels
 * in-flight board fetches, snapshots the cache, applies the expected change
 * immediately, and rolls back on error. `refetchInterval` keeps the board in
 * sync with simulated "remote" changes without the user doing anything.
 */
export function useBoard(boardId: string, { poll = true }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => api.board(boardId),
    refetchInterval: poll ? 8000 : false,
  });
}

type Ctx = { previous?: BoardDetail };

export function useTaskMutations(boardId: string) {
  const qc = useQueryClient();
  const key = queryKeys.board(boardId);

  /** Shared optimistic wrapper: snapshot, apply transform, roll back on error. */
  function optimistic<TVars>(transform: (prev: BoardDetail, vars: TVars) => BoardDetail) {
    return {
      onMutate: async (vars: TVars): Promise<Ctx> => {
        await qc.cancelQueries({ queryKey: key });
        const previous = qc.getQueryData<BoardDetail>(key);
        if (previous) qc.setQueryData<BoardDetail>(key, transform(previous, vars));
        return { previous };
      },
      onError: (_err: unknown, _vars: TVars, ctx?: Ctx) => {
        if (ctx?.previous) qc.setQueryData(key, ctx.previous);
        toast.error("That change didn't stick — please try again.");
      },
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    };
  }

  const createTask = useMutation({
    mutationFn: (body: CreateTaskBody) => api.createTask(body),
    ...optimistic<CreateTaskBody>((prev, body) =>
      applyCreateTask(prev, optimisticTask(body)),
    ),
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: UpdateTaskBody }) =>
      api.updateTask(taskId, patch),
    ...optimistic<{ taskId: string; patch: UpdateTaskBody }>((prev, { taskId, patch }) =>
      applyUpdateTask(prev, taskId, patch),
    ),
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    ...optimistic<string>((prev, taskId) => applyDeleteTask(prev, taskId)),
  });

  return { createTask, updateTask, deleteTask };
}

/** Build a provisional Task for the optimistic create (server assigns real id). */
function optimisticTask(body: CreateTaskBody): Task {
  const now = new Date().toISOString();
  return {
    id: `temp-${now}-${Math.random().toString(36).slice(2, 7)}`,
    boardId: body.boardId,
    columnId: body.columnId,
    title: body.title,
    description: body.description ?? "",
    status: "todo",
    priority: body.priority ?? "medium",
    assigneeId: body.assigneeId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
