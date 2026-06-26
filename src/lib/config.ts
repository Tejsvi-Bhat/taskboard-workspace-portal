/**
 * Absolute base URL for the deployment. Used for canonical links, Open Graph
 * URLs and the sitemap so shared links resolve correctly. Override in prod via
 * NEXT_PUBLIC_SITE_URL.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
