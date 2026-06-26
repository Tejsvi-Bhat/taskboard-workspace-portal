import Link from "next/link";

/**
 * Global 404. Reached when a public board doesn't exist or isn't shared (the
 * public page calls notFound()), or for any unknown route. Kept standalone so it
 * renders without app providers.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
        T
      </span>
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-1 max-w-sm text-muted">
          This page doesn&apos;t exist, or the board isn&apos;t shared publicly.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        Go to Taskboard
      </Link>
    </main>
  );
}
