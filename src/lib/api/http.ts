import "server-only";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import type { SessionUser } from "@/types/models";

/**
 * Shared helpers for route handlers: a consistent JSON error envelope, a small
 * artificial latency so the client's loading states are actually exercised, and
 * an auth guard that 401s when there is no valid session.
 */

export interface ApiErrorBody {
  error: { message: string; code?: string };
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, code?: string) {
  return NextResponse.json<ApiErrorBody>({ error: { message, code } }, { status });
}

/** Simulate network/server latency (50–200ms) to make loading states real. */
export async function latency() {
  const ms = 50 + Math.floor(Math.random() * 150);
  await new Promise((r) => setTimeout(r, ms));
}

type Guarded =
  | { session: SessionUser; response?: never }
  | { session?: never; response: NextResponse };

/** Require a valid session. Returns either the session or a 401 response. */
export async function requireSession(): Promise<Guarded> {
  const session = await getCurrentSession();
  if (!session) {
    return { response: fail(401, "Your session has expired. Please sign in again.", "SESSION_EXPIRED") };
  }
  return { session };
}
