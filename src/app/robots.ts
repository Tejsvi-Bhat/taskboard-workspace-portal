import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

/**
 * Allow crawling of the public landing and shared boards; keep the
 * authenticated app and API out of the index. Points crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/public/", "/login"],
      disallow: ["/board/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
