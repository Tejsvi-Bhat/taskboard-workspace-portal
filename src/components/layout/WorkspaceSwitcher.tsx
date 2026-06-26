"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/store/workspace";
import { Skeleton } from "@/components/ui/States";

/**
 * Workspace selector. The current selection is the single source of truth for
 * "which workspace context am I in" — every board/list query downstream derives
 * from it (see useWorkspaceStore). Picking one navigates home so the board list
 * reflects the new context immediately.
 */
export function WorkspaceSwitcher() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const currentId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrent = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Default to the first workspace once the (server-fetched) list loads and
  // nothing is selected — a one-time sync from external data into local state.
  useEffect(() => {
    if (!currentId && workspaces && workspaces.length > 0) {
      setCurrent(workspaces[0].id);
    }
  }, [currentId, workspaces, setCurrent]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (isLoading) return <Skeleton className="h-10 w-full" />;
  const current = workspaces?.find((w) => w.id === currentId) ?? workspaces?.[0];
  if (!current) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        data-testid="ws-switcher"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-border-strong bg-surface px-2.5 py-2 text-left hover:bg-surface-muted"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
          {current.name[0]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{current.name}</span>
          <span className="block text-xs text-muted">{current.memberIds.length} members</span>
        </span>
        <svg className="size-4 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.2 7.5 10 12l4.8-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-fade-in absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          role="listbox"
        >
          <p className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Workspaces
          </p>
          {workspaces?.map((w) => (
            <button
              key={w.id}
              role="option"
              data-testid={`ws-option-${w.id}`}
              aria-selected={w.id === current.id}
              onClick={() => {
                setCurrent(w.id);
                setOpen(false);
                router.push("/");
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-muted",
                w.id === current.id && "bg-brand-soft",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand/90 text-xs font-bold text-white">
                {w.name[0]}
              </span>
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === current.id && <span className="text-brand">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
