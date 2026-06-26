import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * First line of defense for authenticated routes (Next.js "proxy" convention).
 * Runs on the edge and only checks for the *presence* of a session cookie — it
 * can't read the in-memory store to validate expiry. Authoritative validation
 * (including expiry) happens in the (app) server layout via getCurrentSession().
 *
 * Public surfaces (/login, /public/*) are left open so shareable pages and the
 * login screen work without a session. API routes are excluded entirely (see
 * matcher): they enforce auth themselves and return a 401 JSON envelope, which
 * is what the client's global session-expiry handling expects — a redirect
 * would corrupt those fetches.
 */
const PUBLIC_PREFIXES = ["/login", "/public"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on page routes only — exclude API, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
