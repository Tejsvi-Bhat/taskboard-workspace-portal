import { NextResponse } from "next/server";
import { expireSession } from "@/lib/mock/db";
import { SESSION_COOKIE, getSessionToken } from "@/lib/auth/session";

/** POST /api/logout — clear the session server-side and drop the cookie. */
export async function POST() {
  const token = await getSessionToken();
  expireSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
