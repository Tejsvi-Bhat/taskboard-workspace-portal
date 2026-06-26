"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useBoards } from "@/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/store/workspace";
import { useCurrentUser } from "@/components/providers/SessionProvider";
import { useLogout } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/States";

/**
 * Left navigation: workspace switcher, the boards in the current workspace, and
 * the signed-in user with a logout action. Boards are derived from the selected
 * workspace, so the nav always matches the active context.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { data: boards, isLoading } = useBoards(currentWorkspaceId);
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="px-1 pt-1">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-1 pb-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            T
          </span>
          <span className="font-semibold">Taskboard</span>
        </Link>
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto">
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted">Boards</p>
        <ul className="space-y-0.5">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-2 py-1.5">
                <Skeleton className="h-4 w-32" />
              </li>
            ))}
          {boards?.map((b) => {
            const href = `/board/${b.id}`;
            const active = pathname === href;
            return (
              <li key={b.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                    active ? "bg-brand-soft font-medium text-brand" : "text-muted-strong hover:bg-surface-muted",
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", active ? "bg-brand" : "bg-border-strong")}
                  />
                  <span className="flex-1 truncate">{b.name}</span>
                  {b.isPublic && (
                    <span title="Public board" className="text-xs text-muted">
                      🌐
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          {boards?.length === 0 && !isLoading && (
            <li className="px-2 py-2 text-sm text-muted">No boards yet.</li>
          )}
        </ul>
      </nav>

      <div className="border-t border-border pt-3">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar user={user} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-50"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
