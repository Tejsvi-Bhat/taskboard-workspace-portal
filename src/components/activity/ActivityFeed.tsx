"use client";

import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useActivity } from "@/hooks/useActivity";
import { useSimulation } from "@/hooks/useSimulation";
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
  const simulation = useSimulation();
  const seen = useRef<Set<string> | null>(null);

  // Virtualize the feed so it stays smooth as activity accumulates over time —
  // only the visible rows are mounted, regardless of total length.
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = activities ?? [];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 68,
    overscan: 10,
  });

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
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="text-xs text-muted">
            {simulation.enabled ? "Live updates from your team" : "Live simulation paused"}
          </p>
        </div>
        <button
          role="switch"
          data-testid="simulation-toggle"
          aria-checked={simulation.enabled}
          aria-label="Simulate live activity"
          title="Simulate live activity from teammates"
          disabled={simulation.toggle.isPending}
          onClick={() => simulation.toggle.mutate(!simulation.enabled)}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
            simulation.enabled ? "bg-brand" : "bg-border-strong"
          } disabled:opacity-60`}
        >
          <span
            className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: simulation.enabled ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
      </div>

      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto p-2">
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

        {!isLoading && rows.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted">No activity yet.</p>
        )}

        {rows.length > 0 && (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((item) => (
              <div
                key={rows[item.index].id}
                ref={virtualizer.measureElement}
                data-index={item.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <ActivityItem activity={rows[item.index]} />
              </div>
            ))}
          </div>
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
