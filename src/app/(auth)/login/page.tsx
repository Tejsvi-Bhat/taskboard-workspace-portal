import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

/**
 * Login screen. Server-checks for an existing session first so a logged-in user
 * hitting /login is bounced straight to the app.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();
  const { next } = await searchParams;
  if (session) redirect(next || "/");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            T
          </div>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your Taskboard workspaces</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm next={next ?? ""} />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Demo: use <span className="font-medium text-muted-strong">alice@acme.test</span> with any password.
        </p>
      </div>
    </main>
  );
}
