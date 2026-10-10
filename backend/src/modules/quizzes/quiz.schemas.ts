import { z } from 'zod';

export const quizBaseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().max(2000).optional().default(''),
  visibility: z.enum(['private', 'public']).optional().default('private'),
  cover_image_url: z.string().url('Invalid image URL').max(1024).optional().nullable(),
});

export const createQuizSchema = quizBaseSchema;

export const updateQuizSchema = quizBaseSchema.partial();

export const listQuizzesSchema = z.object({
  scope: z.enum(['mine', 'public']).optional().default('mine'),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  visibility: z.enum(['private', 'public']).optional(),
});

export const reorderQuestionsSchema = z.object({
  order: z.array(z.number().int().positive()).min(1),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type ListQuizzesInput = z.infer<typeof listQuizzesSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;