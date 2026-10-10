import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  archiveQuizHandler,
  createQuizHandler,
  deleteQuizHandler,
  duplicateQuizHandler,
  getQuizHandler,
  listQuizzesHandler,
  publishQuizHandler,
  reorderQuestionsHandler,
  updateQuizHandler,
} from './quiz.controller';
import {
  createQuestionHandler,
  deleteQuestionHandler,
  updateQuestionHandler,
} from '../questions/question.controller';
import {
  createQuizSchema,
  listQuizzesSchema,
  reorderQuestionsSchema,
  updateQuizSchema,
} from './quiz.schemas';
import {
  createQuestionSchema,
  updateQuestionSchema,
} from '../questions/question.schemas';

export const quizRouter = Router();

// Quiz collection
quizRouter.get('/', requireAuth, validate(listQuizzesSchema, 'query'), listQuizzesHandler);
quizRouter.post('/', requireAuth, validate(createQuizSchema), createQuizHandler);

// Quiz item
quizRouter.get('/:quizId', optionalAuth, getQuizHandler);
quizRouter.put('/:quizId', requireAuth, validate(updateQuizSchema), updateQuizHandler);
quizRouter.delete('/:quizId', requireAuth, deleteQuizHandler);

// Quiz actions
quizRouter.post('/:quizId/publish', requireAuth, publishQuizHandler);
quizRouter.post('/:quizId/archive', requireAuth, archiveQuizHandler);
quizRouter.post('/:quizId/duplicate', requireAuth, duplicateQuizHandler);
quizRouter.put('/:quizId/questions/order', requireAuth, validate(reorderQuestionsSchema), reorderQuestionsHandler);

// Questions nested under a quiz
quizRouter.post('/:quizId/questions', requireAuth, validate(createQuestionSchema), createQuestionHandler);
quizRouter.put('/questions/:questionId', requireAuth, validate(updateQuestionSchema), updateQuestionHandler);
quizRouter.delete('/questions/:questionId', requireAuth, deleteQuestionHandler);