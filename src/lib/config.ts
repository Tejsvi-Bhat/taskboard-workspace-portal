/**
 * Absolute base URL for the deployment. Used for canonical links, Open Graph
 * URLs and the sitemap so shared links resolve correctly.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL  — explicit override (e.g. a custom domain)
 *   2. RENDER_EXTERNAL_URL   — auto-provided by Render at runtime (no config)
 *   3. localhost fallback    — local dev
 *
 * Only read server-side (metadata, sitemap, robots), so the runtime
 * RENDER_EXTERNAL_URL value is picked up correctly.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
