import { NextResponse } from "next/server";
import { createSession, findUserByEmail } from "@/lib/mock/db";
import { loginSchema } from "@/lib/api/schemas";
import { fail, latency } from "@/lib/api/http";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

/**
 * POST /api/login
 * Mock auth: any seeded email + any non-empty password succeeds. On success we
 * set an httpOnly session cookie and return the user. Failures return 401.
 */
export async function POST(req: Request) {
  await latency();

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Enter a valid email and password.", "INVALID_INPUT");
  }

  const user = findUserByEmail(parsed.data.email);
  if (!user) {
    return fail(401, "No account found for that email. Try alice@acme.test.", "INVALID_CREDENTIALS");
  }

  const session = createSession(user.id);
  const res = NextResponse.json({ user, expiresAt: new Date(session.expiresAt).toISOString() });
  res.cookies.set(SESSION_COOKIE, session.token, {
    ...sessionCookieOptions,
    expires: new Date(session.expiresAt),
  });
  return res;
}
