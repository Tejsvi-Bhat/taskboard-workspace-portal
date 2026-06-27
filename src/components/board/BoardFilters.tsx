"use client";

import { Select } from "@/components/ui/Input";
import type { Task, TaskPriority, User } from "@/types/models";

/**
 * Board filter state and matcher. Filtering is a pure view concern — it changes
 * which cards a column renders but never the underlying order, so drag-and-drop
 * persistence stays correct (positions are computed against the full order).
 */
export interface BoardFilterState {
  query: string;
  priority: TaskPriority | "all";
  assigneeId: string | "all" | "unassigned";
}

export const emptyFilters: BoardFilterState = {
  query: "",
  priority: "all",
  assigneeId: "all",
};

export function isFilterActive(f: BoardFilterState): boolean {
  return f.query.trim() !== "" || f.priority !== "all" || f.assigneeId !== "all";
}

export function matchesFilter(task: Task | undefined, f: BoardFilterState): boolean {
  if (!task) return false;
  if (f.priority !== "all" && task.priority !== f.priority) return false;
  if (f.assigneeId === "unassigned" && task.assigneeId) return false;
  if (f.assigneeId !== "all" && f.assigneeId !== "unassigned" && task.assigneeId !== f.assigneeId) {
    return false;
  }
  const q = f.query.trim().toLowerCase();
  if (q && !`${task.title} ${task.description}`.toLowerCase().includes(q)) return false;
  return true;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function BoardFilters({
  filters,
  onChange,
  members,
  total,
  shown,
}: {
  filters: BoardFilterState;
  onChange: (next: BoardFilterState) => void;
  members: User[];
  total: number;
  shown: number;
}) {
  const active = isFilterActive(filters);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-5 py-2.5">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 3 3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="h-9 w-56 rounded-lg border border-border-strong bg-surface pl-8 pr-3 text-sm placeholder:text-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        />
      </div>

      <Select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as BoardFilterState["priority"] })}
        className="h-9 w-auto"
      >
        <option value="all">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by assignee"
        value={filters.assigneeId}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
        className="h-9 w-auto"
      >
        <option value="all">All assignees</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>

      {active && (
        <>
          <span className="text-xs text-muted">
            {shown} of {total} shown
          </span>
          <button
            onClick={() => onChange(emptyFilters)}
            className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}
