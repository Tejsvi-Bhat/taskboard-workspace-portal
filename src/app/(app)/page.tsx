"use client";

import Link from "next/link";
import { useWorkspaces, useBoards } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/store/workspace";
import { Loading, ErrorState, EmptyState, Skeleton } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";

/**
 * Workspace home: the boards available in the currently-selected workspace.
 * Everything keys off `currentWorkspaceId`, so switching workspaces re-renders
 * this list with the right boards.
 */
export default function WorkspaceHome() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { data: workspaces } = useWorkspaces();
  const { data: boards, isLoading, isError, refetch } = useBoards(currentWorkspaceId);

  const workspace = workspaces?.find((w) => w.id === currentWorkspaceId);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="mb-6">
          {workspace ? (
            <>
              <h1 className="text-2xl font-semibold">{workspace.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {boards?.length ?? "—"} board{boards?.length === 1 ? "" : "s"} in this workspace
              </p>
            </>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
        </header>

        {isLoading && <Loading label="Loading boards…" />}
        {isError && <ErrorState message="Couldn't load boards." onRetry={() => refetch()} />}

        {boards && boards.length === 0 && (
          <EmptyState title="No boards yet" description="This workspace doesn't have any boards." />
        )}

        {boards && boards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((b) => (
              <Link
                key={b.id}
                href={`/board/${b.id}`}
                data-testid={`board-card-${b.id}`}
                className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="font-semibold group-hover:text-brand">{b.name}</h2>
                  {b.isPublic && <Badge className="bg-brand-soft text-brand">Public</Badge>}
                </div>
                <p className="line-clamp-2 text-sm text-muted">{b.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
