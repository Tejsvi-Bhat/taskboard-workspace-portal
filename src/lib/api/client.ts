import type { ApiErrorBody } from "@/lib/api/http";

/**
 * The single choke-point for all browser → API communication. Components and
 * hooks never call `fetch` directly; they go through `apiClient`. That gives us
 * one place to normalize errors, attach defaults, and react to an expired
 * session (401) globally.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
  get isSessionExpired() {
    return this.status === 401;
  }
}

/**
 * Global hook invoked whenever any request returns 401. The app registers a
 * handler (see SessionProvider) that surfaces a toast and redirects to /login —
 * this keeps "session expired" handling in one place instead of every caller.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      // Same-origin cookies carry the session.
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Network error — please check your connection.", 0);
  }

  if (res.status === 401) {
    onUnauthorized?.();
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(err?.message ?? `Request failed (${res.status})`, res.status, err?.code);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
