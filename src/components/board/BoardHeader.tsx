"use client";

import { Avatar } from "@/components/ui/Avatar";
import { ShareButton } from "./ShareButton";
import type { Board, User } from "@/types/models";

/** Board title bar: name, description, member stack and the share control. */
export function BoardHeader({ board, members }: { board: Board; members: User[] }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold">{board.name}</h1>
        {board.description && <p className="truncate text-sm text-muted">{board.description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <Avatar key={m.id} user={m} size={28} className="ring-2 ring-surface" />
          ))}
        </div>
        <ShareButton board={board} />
      </div>
    </header>
  );
}
