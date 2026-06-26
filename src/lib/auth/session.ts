import "server-only";
import { cookies } from "next/headers";
import { getSession, getUser } from "@/lib/mock/db";
import type { SessionUser } from "@/types/models";

/**
 * Server-side session helpers. The session token lives in an httpOnly cookie so
 * it is unreadable from JS (mitigates XSS token theft) yet available to both the
 * middleware and server components — which is what makes SSR of authenticated
 * pages and route protection possible.
 */

export const SESSION_COOKIE = "tb_session";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** Resolve the current session user from the request cookie, or null. */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = getSession(token);
  if (!session) return null;

  const user = getUser(session.userId);
  if (!user) return null;

  return { user, expiresAt: new Date(session.expiresAt).toISOString() };
}

/** Read just the raw token (used by logout / force-expire routes). */
export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
