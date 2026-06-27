"use client";

import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

/**
 * Subscribe to connectivity changes via React Query's onlineManager (which
 * tracks the browser's online/offline events). Using onlineManager — rather than
 * navigator.onLine directly — keeps the UI in lockstep with the same signal that
 * pauses/resumes queries and mutations. Assumes online during SSR.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
