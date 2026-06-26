"use client";

import { cn } from "@/lib/utils/cn";
import { useToastStore, type ToastVariant } from "@/store/toast";

const variantStyles: Record<ToastVariant, string> = {
  info: "border-border-strong bg-surface text-foreground",
  success: "border-success/30 bg-white text-success",
  error: "border-danger/30 bg-white text-danger",
};

/** Fixed-position toast viewport. Reads from the global toast store. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-fade-in pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md",
            variantStyles[t.variant],
          )}
          role="status"
        >
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
