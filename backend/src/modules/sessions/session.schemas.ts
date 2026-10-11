import { z } from 'zod';

export const createSessionSchema = z.object({
  quiz_id: z.number().int().positive(),
});

export const joinSessionSchema = z.object({
  pin: z.string().trim().min(6).max(16),
  nickname: z.string().trim().min(2, 'Nickname must be at least 2 characters').max(60),
});

export const lookupSessionSchema = z.object({
  pin: z.string().trim().min(6).max(16),
});

export const submitAnswerSchema = z.object({
  question_id: z.number().int().positive(),
  option_id: z.number().int().positive().nullable(),
  response_time_ms: z.number().int().min(0).max(3600000),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;