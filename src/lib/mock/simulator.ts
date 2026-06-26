import "server-only";
import { simulateRemoteActivity } from "./db";

/**
 * Background "other users" simulator. Every few seconds it nudges a random
 * task on some board (a move or a priority bump) and logs an activity entry —
 * this is what makes the activity feed and board polling feel live without a
 * real multi-user backend.
 *
 * Guarded on globalThis so Next's dev hot-reload doesn't stack up intervals,
 * and started lazily the first time any board/activity route is hit.
 */
const TICK_MS = Number(process.env.SIMULATOR_TICK_MS) || 12_000;
const g = globalThis as unknown as { __taskboardSimulator?: NodeJS.Timeout };

export function ensureSimulator() {
  if (g.__taskboardSimulator) return;
  g.__taskboardSimulator = setInterval(() => {
    try {
      simulateRemoteActivity();
    } catch {
      // Best-effort: a simulated tick failing must never break a request.
    }
  }, TICK_MS);
}
