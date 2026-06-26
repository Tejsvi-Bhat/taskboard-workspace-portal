import { forceExpireSession } from "@/lib/mock/db";
import { getSessionToken } from "@/lib/auth/session";
import { ok } from "@/lib/api/http";

/**
 * POST /api/session/expire — demo helper. Forces the current session to expire
 * immediately so graceful session-expiration handling can be shown on demand
 * without waiting out the TTL.
 */
export async function POST() {
  const token = await getSessionToken();
  forceExpireSession(token);
  return ok({ ok: true });
}
