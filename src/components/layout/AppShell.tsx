"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { OfflineBanner } from "@/components/providers/OfflineBanner";
import { cn } from "@/lib/utils/cn";

/**
 * Responsive application frame. On desktop the sidebar is a fixed rail; on
 * mobile it becomes an off-canvas drawer toggled from a slim top bar. The main
 * content scrolls independently so the board can own its own horizontal scroll.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <OfflineBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="animate-fade-in absolute left-0 top-0 h-full w-64 border-r border-border bg-surface">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 hover:bg-surface-muted"
            aria-label="Open menu"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-semibold">Taskboard</span>
        </header>

        <main className={cn("min-h-0 flex-1 overflow-hidden")}>{children}</main>
      </div>
      </div>
    </div>
  );
}
