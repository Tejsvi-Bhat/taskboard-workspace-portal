import { BoardView } from "@/components/board/BoardView";

/**
 * Authenticated board page. A thin server wrapper that hands the id to the
 * interactive client board. Auth is already enforced by the (app) layout.
 */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  return <BoardView boardId={boardId} />;
}
