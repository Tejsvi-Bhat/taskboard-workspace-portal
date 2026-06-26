"use client";

import { useState } from "react";
import { BoardView } from "./BoardView";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

/**
 * Board screen layout: the interactive board plus the activity rail. On wide
 * screens the rail is docked on the right; on narrower screens it collapses into
 * a toggleable drawer so the board keeps the full width.
 */
export function BoardScreen({ boardId }: { boardId: string }) {
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1">
        <BoardView boardId={boardId} />
      </div>

      {/* Docked rail (wide screens) */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-surface xl:flex">
        <ActivityFeed boardId={boardId} />
      </aside>

      {/* Floating toggle + drawer (narrow screens) */}
      <button
        onClick={() => setActivityOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-lg xl:hidden"
      >
        Activity
      </button>

      {activityOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActivityOpen(false)} />
          <aside className="animate-fade-in absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setActivityOpen(false)}
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted"
                aria-label="Close activity"
              >
                ✕
              </button>
            </div>
            <ActivityFeed boardId={boardId} />
          </aside>
        </div>
      )}
    </div>
  );
}
