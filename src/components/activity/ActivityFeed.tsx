"use client";

import { useEffect, useRef } from "react";
import { useActivity } from "@/hooks/useActivity";
import { useCurrentUser } from "@/components/providers/SessionProvider";
import { formatRelativeTime } from "@/lib/utils/time";
import { Skeleton } from "@/components/ui/States";
import { toast } from "@/store/toast";
import type { Activity, ActivityType } from "@/types/models";

const ICONS: Record<ActivityType, string> = {
  task_created: "✨",
  task_updated: "✏️",
  task_moved: "↔️",
  task_deleted: "🗑️",
  board_shared: "🌐",
};

/**
 * Recent-activity rail. Polls the activity endpoint and renders a reverse-chron
 * feed. When a *new* entry arrives from someone else (the simulator or, in a
 * real system, another user) we surface a lightweight toast so updates feel
 * live. Our own actions are intentionally not toasted.
 */
export function ActivityFeed({ boardId }: { boardId: string }) {
  const { data: activities, isLoading } = useActivity(boardId);
  const me = useCurrentUser();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!activities) return;
    // First load: prime the "seen" set without notifying.
    if (seen.current === null) {
      seen.current = new Set(activities.map((a) => a.id));
      return;
    }
    for (const a of activities) {
      if (!seen.current.has(a.id)) {
        seen.current.add(a.id);
        if (a.actorName !== me.name) toast.info(`${a.actorName} ${a.message}`);
      }
    }
  }, [activities, me.name]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <p className="text-xs text-muted">Live updates from your team</p>
      </div>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 p-2">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}

        {activities?.map((a) => <ActivityItem key={a.id} activity={a} />)}

        {activities && activities.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted">No activity yet.</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="animate-fade-in flex gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-muted">
      <span className="mt-0.5 text-base leading-none" aria-hidden>
        {ICONS[activity.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-medium">{activity.actorName}</span>{" "}
          <span className="text-muted-strong">{activity.message}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(activity.createdAt)}</p>
      </div>
    </div>
  );
}
