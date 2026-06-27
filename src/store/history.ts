import { create } from "zustand";
import type { Command } from "@/lib/history/types";

/**
 * Per-board undo/redo stacks. Recording a new action clears the redo stack
 * (standard linear history). State is scoped to one board at a time: recording
 * for a different board resets the stacks, so navigating between boards doesn't
 * leak history. Kept as client state — it's ephemeral UI, not server data.
 */
interface HistoryState {
  boardId: string | null;
  undoStack: Command[];
  redoStack: Command[];
  record: (boardId: string, cmd: Command) => void;
  moveTopToRedo: () => void;
  moveTopToUndo: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  boardId: null,
  undoStack: [],
  redoStack: [],
  record: (boardId, cmd) =>
    set((s) => {
      const sameBoard = s.boardId === boardId;
      const undoStack = sameBoard ? s.undoStack : [];
      return { boardId, undoStack: [...undoStack, cmd], redoStack: [] };
    }),
  moveTopToRedo: () =>
    set((s) => {
      const undoStack = [...s.undoStack];
      const cmd = undoStack.pop();
      return cmd ? { undoStack, redoStack: [...s.redoStack, cmd] } : {};
    }),
  moveTopToUndo: () =>
    set((s) => {
      const redoStack = [...s.redoStack];
      const cmd = redoStack.pop();
      return cmd ? { redoStack, undoStack: [...s.undoStack, cmd] } : {};
    }),
}));
