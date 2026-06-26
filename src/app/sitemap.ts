import type { MetadataRoute } from "next";
import { listPublicBoards } from "@/lib/mock/db";
import { siteUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Sitemap of all publicly-shared boards (plus the landing/login). Only public
 * resources are listed — private boards never appear, so we don't expose them
 * to crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const boards = listPublicBoards().map((b) => ({
    url: `${siteUrl}/public/board/${b.id}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    ...boards,
  ];
}
