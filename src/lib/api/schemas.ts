import { z } from "zod";

/**
 * Request payload schemas. Route handlers validate every body against these so
 * the mock backend rejects malformed input the same way a real API would — and
 * the inferred types keep the client and server in lockstep.
 */

export const loginSchema = z.object({
  email: z.string().email(),
  // Mock auth: any non-empty password is accepted for a seeded email.
  password: z.string().min(1),
});

export const createTaskSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
  columnId: z.string().min(1).optional(),
  position: z.number().int().min(0).optional(),
});

export const shareBoardSchema = z.object({
  isPublic: z.boolean(),
});

export const simulationSchema = z.object({
  enabled: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type ShareBoardBody = z.infer<typeof shareBoardSchema>;
