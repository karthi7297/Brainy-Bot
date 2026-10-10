import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createSessionHandler,
  endGameHandler,
  getSessionHandler,
  getStateHandler,
  joinSessionHandler,
  kickPlayerHandler,
  listSessionsHandler,
  lockQuestionHandler,
  lookupSessionHandler,
  nextQuestionHandler,
  startGameHandler,
} from './session.controller';
import { createSessionSchema, joinSessionSchema, lookupSessionSchema } from './session.schemas';

export const sessionRouter = Router();

// Public (players)
sessionRouter.post('/lookup', validate(lookupSessionSchema), lookupSessionHandler);
sessionRouter.post('/join', validate(joinSessionSchema), joinSessionHandler);

// Authenticated host
sessionRouter.use(requireAuth);
sessionRouter.get('/', listSessionsHandler);
sessionRouter.post('/', validate(createSessionSchema), createSessionHandler);
sessionRouter.get('/:sessionId', getSessionHandler);
sessionRouter.get('/:sessionId/state', getStateHandler);
sessionRouter.post('/:sessionId/start', startGameHandler);
sessionRouter.post('/:sessionId/next', nextQuestionHandler);
sessionRouter.post('/:sessionId/lock', lockQuestionHandler);
sessionRouter.post('/:sessionId/end', endGameHandler);
sessionRouter.post('/:sessionId/kick', kickPlayerHandler);