import { z } from 'zod';

export const answerOptionSchema = z.object({
  option_text: z.string().trim().min(1, 'Option text is required').max(500),
  position: z.number().int().min(1).optional(),
  is_correct: z.boolean().optional().default(false),
});

export const createQuestionSchema = z.object({
  question_text: z.string().trim().min(1, 'Question text is required').max(3000),
  question_type: z.enum(['multiple_choice', 'true_false']).default('multiple_choice'),
  time_limit_seconds: z.number().int().min(5).max(300).default(20),
  base_points: z.number().int().min(100).max(100000).default(1000),
  image_url: z.string().url('Invalid image URL').max(1024).optional().nullable(),
  explanation: z.string().trim().max(2000).optional().nullable(),
  options: z.array(answerOptionSchema).min(2, 'At least 2 answer options are required').max(8),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  position: z.number().int().min(1).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;