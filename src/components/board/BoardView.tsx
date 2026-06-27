"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { BoardHeader } from "./BoardHeader";
import {
  BoardFilters,
  emptyFilters,
  isFilterActive,
  matchesFilter,
  type BoardFilterState,
} from "./BoardFilters";
import { useBoard, useTaskMutations } from "@/hooks/useBoard";
import { useHistory } from "@/hooks/useHistory";
import { Loading, ErrorState } from "@/components/ui/States";
import type { Task } from "@/types/models";
import type { TaskPosition } from "@/lib/history/types";

type ModalState =
  | null
  | { kind: "create"; columnId: string }
  | { kind: "edit"; task: Task };

/**
 * The interactive board. Owns drag-and-drop across columns and within a column.
 *
 * Rendering is driven by a local `order` map (columnId → taskIds) so a drag has
 * instant visual feedback before it's committed. The map is re-synced from the
 * React Query cache whenever the server data changes and no drag is in flight —
 * which is also how "remote" simulated changes from polling appear. On drop we
 * fire an optimistic updateTask mutation that persists the move.
 */
export function BoardView({ boardId }: { boardId: string }) {
  const { data, isLoading, isError, refetch } = useBoard(boardId);
  const { updateTask } = useTaskMutations(boardId);
  const history = useHistory(boardId);

  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [filters, setFilters] = useState<BoardFilterState>(emptyFilters);
  const dragOrigin = useRef<TaskPosition | null>(null);

  // Intentionally synchronizing local drag-order with an external system (the
  // React Query server cache): mirror server order whenever it changes, except
  // mid-drag where local order is authoritative until the drop is committed.
  useEffect(() => {
    if (activeId || !data) return;
    const next: Record<string, string[]> = {};
    for (const c of data.columns) next[c.id] = c.taskIds;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store sync, see above
    setOrder(next);
  }, [data, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Keyboard shortcuts for undo/redo. Refs keep the handler reading the latest
  // history functions without re-binding the listener on every render.
  const undoRef = useRef(history.undo);
  const redoRef = useRef(history.redo);
  useEffect(() => {
    undoRef.current = history.undo;
    redoRef.current = history.redo;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoRef.current();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redoRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tasksById = useMemo(() => indexBy(data?.tasks ?? [], (t) => t.id), [data]);
  const membersById = useMemo(() => indexBy(data?.members ?? [], (m) => m.id), [data]);

  if (isLoading) return <Loading label="Loading board…" />;
  if (isError || !data) return <ErrorState message="Couldn't load this board." onRetry={() => refetch()} />;

  const findContainer = (id: string): string | undefined =>
    id in order ? id : Object.keys(order).find((col) => order[col].includes(id));

  const insertIndex = (overId: string, overCol: string): number => {
    if (overId in order) return order[overCol].length; // dropped on the column itself
    const idx = order[overCol].indexOf(overId);
    return idx >= 0 ? idx : order[overCol].length;
  };

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    const col = findContainer(id);
    dragOrigin.current = col ? { columnId: col, position: order[col].indexOf(id) } : null;
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = findContainer(String(active.id));
    const overCol = findContainer(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setOrder((prev) => {
      const target = insertIndex(String(over.id), overCol);
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter((id) => id !== active.id),
        [overCol]: [
          ...prev[overCol].slice(0, target),
          String(active.id),
          ...prev[overCol].slice(target),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const overCol = findContainer(String(over.id));
    if (!overCol) return;
    const newIndex = insertIndex(String(over.id), overCol);

    setOrder((prev) => {
      const items = prev[overCol];
      const oldIndex = items.indexOf(String(active.id));
      if (oldIndex === -1) return prev;
      return { ...prev, [overCol]: arrayMove(items, oldIndex, newIndex) };
    });

    updateTask.mutate({
      taskId: String(active.id),
      patch: { columnId: overCol, position: newIndex },
    });

    // Record the move for undo/redo (only if the position actually changed).
    const before = dragOrigin.current;
    dragOrigin.current = null;
    if (before && (before.columnId !== overCol || before.position !== newIndex)) {
      history.record({
        kind: "move",
        taskId: String(active.id),
        before,
        after: { columnId: overCol, position: newIndex },
      });
    }
  }

  const activeTask = activeId ? tasksById.get(activeId) : null;
  const orderedColumns = data.columns;

  // Filtering is a view concern: derive the visible ids per column from the full
  // order. DnD still operates on the full `order`, so positions persist correctly.
  const filterActive = isFilterActive(filters);
  const visibleIdsFor = (columnId: string) => {
    const ids = order[columnId] ?? [];
    return filterActive ? ids.filter((id) => matchesFilter(tasksById.get(id), filters)) : ids;
  };
  const total = data.tasks.length;
  const shown = orderedColumns.reduce((n, c) => n + visibleIdsFor(c.id).length, 0);

  return (
    <div className="flex h-full flex-col">
      <BoardHeader board={data.board} members={data.members} />
      <BoardFilters
        filters={filters}
        onChange={setFilters}
        members={data.members}
        total={total}
        shown={shown}
        actions={
          <>
            <HistoryButton
              label="Undo"
              disabled={!history.canUndo}
              onClick={history.undo}
              path="M9 7H5m0 0v4m0-4 3.5 3.5A7 7 0 1 1 6 16"
            />
            <HistoryButton
              label="Redo"
              disabled={!history.canRedo}
              onClick={history.redo}
              path="M11 7h4m0 0v4m0-4-3.5 3.5A7 7 0 1 0 14 16"
            />
          </>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-thin flex flex-1 gap-4 overflow-x-auto px-5 pb-5">
          {orderedColumns.map((c) => (
            <Column
              key={c.id}
              id={c.id}
              name={c.name}
              taskIds={visibleIdsFor(c.id)}
              tasksById={tasksById}
              membersById={membersById}
              filtering={filterActive}
              onAddTask={(columnId) => setModal({ kind: "create", columnId })}
              onTaskClick={(taskId) => {
                const task = tasksById.get(taskId);
                if (task) setModal({ kind: "edit", task });
              }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              assignee={activeTask.assigneeId ? membersById.get(activeTask.assigneeId) ?? null : null}
              interactive={false}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modal && (
        <TaskModal
          boardId={boardId}
          mode={modal}
          columns={data.columns}
          members={data.members}
          onRecord={history.record}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/** Small icon button used for the Undo/Redo controls. */
function HistoryButton({
  label,
  path,
  disabled,
  onClick,
}: {
  label: string;
  path: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`${label} (${label === "Undo" ? "Ctrl/Cmd+Z" : "Ctrl/Cmd+Shift+Z"})`}
      aria-label={label}
      className="rounded-md p-1.5 text-muted-strong hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function indexBy<T>(items: T[], key: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(key(item), item);
  return map;
}
