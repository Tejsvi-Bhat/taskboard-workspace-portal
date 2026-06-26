import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBoardDetail } from "@/lib/mock/db";
import { siteUrl } from "@/lib/config";
import { PublicBoardView } from "@/components/public/PublicBoardView";

// Always reflect the current board state rather than a build-time snapshot.
export const dynamic = "force-dynamic";

/** Only public boards are exposed; everything else is a 404 (no existence leak). */
function getPublicDetail(id: string) {
  const detail = getBoardDetail(id);
  if (!detail || !detail.board.isPublic) return null;
  return detail;
}

function summarize(taskCount: number, columnCount: number) {
  return `${taskCount} task${taskCount === 1 ? "" : "s"} across ${columnCount} column${
    columnCount === 1 ? "" : "s"
  }`;
}

/**
 * Per-page metadata for rich link previews. Next automatically attaches the
 * sibling opengraph-image as og:image, so shared links unfurl with a branded
 * card on social/chat platforms.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = getPublicDetail(id);
  if (!detail) return { title: "Board not found", robots: { index: false } };

  const { board, tasks, columns } = detail;
  const description = board.description
    ? `${board.description} — ${summarize(tasks.length, columns.length)}.`
    : summarize(tasks.length, columns.length);
  const url = `${siteUrl}/public/board/${board.id}`;

  return {
    title: board.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${board.name} · Taskboard`,
      description,
      url,
      type: "website",
      siteName: "Taskboard",
    },
    twitter: { card: "summary_large_image", title: board.name, description },
  };
}

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getPublicDetail(id);
  if (!detail) notFound();

  const { board, tasks, columns } = detail;

  // Structured data so automated systems can understand the board's contents.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: board.name,
    description: board.description,
    numberOfItems: tasks.length,
    itemListElement: tasks.slice(0, 50).map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
    })),
  };

  return (
    <main className="min-h-dvh bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              T
            </span>
            <span className="font-semibold">Taskboard</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Open Taskboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-8">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
            Public board
          </span>
          <span className="text-xs text-muted">Read-only · no sign-in required</span>
        </div>
        <h1 className="text-2xl font-semibold">{board.name}</h1>
        {board.description && <p className="mt-1 max-w-2xl text-muted">{board.description}</p>}
        <p className="mt-2 text-sm text-muted">{summarize(tasks.length, columns.length)}</p>
      </div>

      <div className="mx-auto mt-6 max-w-6xl">
        <PublicBoardView detail={detail} />
      </div>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted">
        Shared from a Taskboard workspace.{" "}
        <Link href="/login" className="text-brand hover:underline">
          Create your own boards →
        </Link>
      </footer>
    </main>
  );
}
