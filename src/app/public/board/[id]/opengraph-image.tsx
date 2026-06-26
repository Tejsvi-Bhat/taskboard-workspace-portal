import { ImageResponse } from "next/og";
import { getBoardDetail } from "@/lib/mock/db";

// Runs in the Node runtime so it can read the in-memory store the rest of the
// app uses (the edge runtime would be a separate isolate without that state).
export const runtime = "nodejs";
export const alt = "Taskboard public board";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Branded, data-driven link-preview image. Rendered on demand from the board's
 * real name and counts, so a shared link unfurls with a card that reflects the
 * actual board rather than a generic placeholder.
 */
export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getBoardDetail(id);
  const board = detail?.board.isPublic ? detail.board : null;
  const taskCount = detail?.board.isPublic ? detail.tasks.length : 0;
  const columnCount = detail?.board.isPublic ? detail.columns.length : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#4f46e5",
              color: "white",
              fontSize: 34,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            T
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#4b5563" }}>Taskboard</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 30, color: "#4f46e5", fontWeight: 600 }}>Public board</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#1a1d21", lineHeight: 1.1 }}>
            {board?.name ?? "Shared board"}
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#6b7280" }}>
          {`${taskCount} tasks · ${columnCount} columns · read-only`}
        </div>
      </div>
    ),
    size,
  );
}
