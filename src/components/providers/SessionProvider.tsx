"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { toast } from "@/store/toast";
import type { User } from "@/types/models";

/**
 * Holds the authenticated user for the client tree and centralizes the
 * "session expired" reaction. We register a single global 401 handler here so
 * any expired-session response — from a poll, a mutation, anything — funnels to
 * one graceful path: clear caches, tell the user, send them to login.
 */
const SessionContext = createContext<User | null>(null);

export function useCurrentUser(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useCurrentUser must be used within an authenticated tree");
  return user;
}

export function SessionProvider({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let handled = false;
    setUnauthorizedHandler(() => {
      if (handled) return; // avoid a toast storm if several requests 401 at once
      handled = true;
      qc.clear();
      toast.error("Your session has expired. Please sign in again.");
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    });
    return () => setUnauthorizedHandler(null);
  }, [router, qc]);

  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
