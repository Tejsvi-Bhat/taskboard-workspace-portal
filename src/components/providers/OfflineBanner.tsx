"use client";

import { useMutationState } from "@tanstack/react-query";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Connectivity banner. While offline it reassures the user that their changes
 * are kept and will sync later (mutations are optimistic locally and paused on
 * the network until reconnect). On reconnect, while queued changes flush, it
 * briefly shows a syncing state. Hidden entirely when online with nothing
 * pending.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  // Mutations in "pending" status while offline are paused (queued); on
  // reconnect they resume and flush, then drop out of this list.
  const pending = useMutationState({ filters: { status: "pending" } });
  const pendingCount = pending.length;

  if (online && pendingCount === 0) return null;

  const offline = !online;

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium text-white ${
        offline ? "bg-muted-strong" : "bg-brand"
      }`}
    >
      <span className={`inline-block size-1.5 rounded-full bg-white ${offline ? "" : "animate-pulse"}`} />
      {offline ? (
        <span>
          You&apos;re offline — changes are saved and will sync when you reconnect
          {pendingCount > 0 ? ` (${pendingCount} pending)` : ""}.
        </span>
      ) : (
        <span>Back online — syncing {pendingCount} change{pendingCount === 1 ? "" : "s"}…</span>
      )}
    </div>
  );
}
