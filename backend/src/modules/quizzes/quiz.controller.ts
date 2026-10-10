import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/HttpError';
import {
  createQuiz,
  deleteQuiz,
  duplicateQuiz,
  getQuizDetail,
  listQuizzes,
  setQuizStatus,
  updateQuiz,
} from './quiz.service';
import type { CreateQuizInput, ListQuizzesInput, ReorderQuestionsInput, UpdateQuizInput } from './quiz.schemas';

export const listQuizzesHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListQuizzesInput;
  const quizzes = await listQuizzes(req.user!.id, query);
  res.json({ quizzes });
});

export const getQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await getQuizDetail(Number(req.params.quizId), req.user?.id);
  res.json({ quiz });
});

export const createQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateQuizInput;
  const quiz = await createQuiz(req.user!.id, body);
  res.status(201).json({ quiz });
});

export const updateQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateQuizInput;
  const quiz = await updateQuiz(Number(req.params.quizId), req.user!.id, body);
  res.json({ quiz });
});

export const deleteQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteQuiz(Number(req.params.quizId), req.user!.id);
  res.status(204).send();
});

export const publishQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await setQuizStatus(Number(req.params.quizId), req.user!.id, 'published');
  res.json({ quiz });
});

export const archiveQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await setQuizStatus(Number(req.params.quizId), req.user!.id, 'archived');
  res.json({ quiz });
});

export const duplicateQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await duplicateQuiz(Number(req.params.quizId), req.user!.id);
  res.status(201).json({ quiz });
});

export const reorderQuestionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { order } = req.body as ReorderQuestionsInput;
  const { reorderQuestions } = await import('../questions/question.service');
  await reorderQuestions(Number(req.params.quizId), req.user!.id, order);
  res.status(204).send();
});

export const proxyGetQuizId = (req: Request): number => {
  const id = Number(req.params.quizId);
  if (!Number.isInteger(id)) {
    throw HttpError.badRequest('Invalid quiz id');
  }
  return id;
};