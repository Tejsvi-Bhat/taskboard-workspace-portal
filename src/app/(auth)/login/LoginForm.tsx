"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { useLogin, loginErrorMessage } from "@/hooks/useAuth";

const DEMO_USERS = [
  "alice@acme.test",
  "bob@acme.test",
  "carol@acme.test",
];

/** Controlled login form. Talks to the mock /api/login via the useLogin hook. */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("alice@acme.test");
  const [password, setPassword] = useState("password");
  const login = useLogin(next);
  const error = loginErrorMessage(login.error);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate({ email, password });
      }}
    >
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={login.isPending}>
        Sign in
      </Button>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {DEMO_USERS.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setEmail(u)}
            className="rounded-md bg-surface-muted px-2 py-1 text-xs text-muted-strong hover:bg-border"
          >
            {u}
          </button>
        ))}
      </div>
    </form>
  );
}
