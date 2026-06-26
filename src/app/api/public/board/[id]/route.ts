import { getBoardDetail } from "@/lib/mock/db";
import { ok, fail, latency } from "@/lib/api/http";

/**
 * GET /api/public/board/:id — read-only board, NO auth. Only boards explicitly
 * marked public are returned; everything else 404s (we don't leak existence of
 * private boards). This is the endpoint the public SSR page reads from.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await latency();
  const { id } = await params;

  const detail = getBoardDetail(id);
  if (!detail || !detail.board.isPublic) {
    return fail(404, "This board is not publicly available.", "NOT_FOUND");
  }

  return ok(detail);
}
