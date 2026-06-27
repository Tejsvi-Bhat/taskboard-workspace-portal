import { NextResponse } from "next/server";

/**
 * GET /api/health — lightweight, unauthenticated health check for the host
 * (Render pings this). Returns 200 with a tiny body. The app's root route is a
 * redirect, so a dedicated 200 endpoint makes for a cleaner health probe.
 */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
