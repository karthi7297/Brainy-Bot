import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/HttpError';
import { mapQuestion } from '../../db/models';
import { addQuestion, deleteQuestion, updateQuestion } from './question.service';
import type { CreateQuestionInput, UpdateQuestionInput } from './question.schemas';

function parseId(value: string, name: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest(`Invalid ${name}`);
  }
  return id;
}

export const createQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const quizId = parseId(req.params.quizId, 'quiz id');
  const body = req.body as CreateQuestionInput;
  const row = await addQuestion(quizId, req.user!.id, body);
  res.status(201).json({ question: mapQuestion(row, row.options) });
});

export const updateQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const questionId = parseId(req.params.questionId, 'question id');
  const body = req.body as UpdateQuestionInput;
  const row = await updateQuestion(questionId, req.user!.id, body);
  res.json({ question: mapQuestion(row, row.options) });
});

export const deleteQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const questionId = parseId(req.params.questionId, 'question id');
  await deleteQuestion(questionId, req.user!.id);
  res.status(204).send();
});