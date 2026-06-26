"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useShareBoard } from "@/hooks/useShareBoard";
import { toast } from "@/store/toast";
import type { Board } from "@/types/models";

/**
 * Share control: toggles a board between public and private and, when public,
 * exposes the no-auth shareable link with a copy button. The link points at the
 * SSR public route so it unfurls nicely when pasted into chats/social.
 */
export function ShareButton({ board }: { board: Board }) {
  const share = useShareBoard(board.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Derived at render time (no state needed). The link is only shown inside the
  // popover, which opens client-side, so `window` is always defined when used.
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/public/board/${board.id}` : "";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy — copy it manually.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button data-testid="share-button" variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8.7 13.5l6.6 3.8M15.3 6.7L8.7 10.5" strokeLinecap="round" />
          <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
        </svg>
        Share
        {board.isPublic && <span className="ml-1 rounded-full bg-brand-soft px-1.5 text-xs text-brand">Public</span>}
      </Button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-30 mt-1 w-80 rounded-xl border border-border bg-surface p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Public sharing</p>
              <p className="mt-0.5 text-xs text-muted">
                Anyone with the link can view this board — no sign-in required.
              </p>
            </div>
            <button
              role="switch"
              data-testid="share-toggle"
              aria-checked={board.isPublic}
              onClick={() => share.mutate(!board.isPublic)}
              disabled={share.isPending}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                board.isPublic ? "bg-brand" : "bg-border-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                  board.isPublic ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {board.isPublic && (
            <div className="mt-3 flex gap-2">
              <Input readOnly value={publicUrl} className="h-9 text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button size="sm" onClick={copy}>
                Copy
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
