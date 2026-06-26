"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";

/** Log in, then navigate to the originally-requested page (or home). */
export function useLogin(next: string) {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: () => {
      qc.clear();
      router.replace(next || "/");
      router.refresh();
    },
    onError: (e) => e, // surfaced by the form via mutation.error
  });
}

export function loginErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

/** Log out and return to the login screen. */
export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      qc.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}
