"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useHistoryStore } from "@/store/history";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "@/store/toast";
import type { Command } from "@/lib/history/types";
import type { Task } from "@/types/models";

/**
 * Undo/redo controller for a board. Reads the stacks from the history store and
 * applies a command's inverse (undo) or forward (redo) operation through the
 * normal API, then invalidates the board query to re-sync. Applying does NOT go
 * through the recording mutations, so it never pushes new history entries.
 */
export function useHistory(boardId: string) {
  const qc = useQueryClient();
  const { boardId: storeBoardId, undoStack, redoStack, record, moveTopToRedo, moveTopToUndo } =
    useHistoryStore();

  // Treat history as empty unless it belongs to the board on screen.
  const scoped = storeBoardId === boardId;
  const undos = scoped ? undoStack : [];
  const redos = scoped ? redoStack : [];

  const resync = () => qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });

  async function undo() {
    const cmd = undos[undos.length - 1];
    if (!cmd) return;
    try {
      await applyInverse(cmd, boardId);
      moveTopToRedo();
      resync();
    } catch {
      toast.error("Couldn't undo that action.");
    }
  }

  async function redo() {
    const cmd = redos[redos.length - 1];
    if (!cmd) return;
    try {
      await applyForward(cmd, boardId);
      moveTopToUndo();
      resync();
    } catch {
      toast.error("Couldn't redo that action.");
    }
  }

  return {
    canUndo: undos.length > 0,
    canRedo: redos.length > 0,
    undo,
    redo,
    record: (cmd: Command) => record(boardId, cmd),
  };
}

/** Re-apply a command (redo). */
async function applyForward(cmd: Command, boardId: string) {
  switch (cmd.kind) {
    case "move":
      await api.updateTask(cmd.taskId, { ...cmd.after });
      break;
    case "edit":
      await api.updateTask(cmd.taskId, { ...cmd.after });
      break;
    case "create":
      await recreate(cmd.task, cmd.position, boardId);
      break;
    case "delete":
      await api.deleteTask(cmd.task.id);
      break;
  }
}

/** Apply the inverse of a command (undo). */
async function applyInverse(cmd: Command, boardId: string) {
  switch (cmd.kind) {
    case "move":
      await api.updateTask(cmd.taskId, { ...cmd.before });
      break;
    case "edit":
      await api.updateTask(cmd.taskId, { ...cmd.before });
      break;
    case "create":
      await api.deleteTask(cmd.task.id);
      break;
    case "delete":
      await recreate(cmd.task, cmd.position, boardId);
      break;
  }
}

/** Restore a task exactly (same id, column and position). */
function recreate(task: Task, position: number, boardId: string) {
  return api.createTask({
    boardId,
    id: task.id,
    columnId: task.columnId,
    position,
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigneeId: task.assigneeId,
  });
}
