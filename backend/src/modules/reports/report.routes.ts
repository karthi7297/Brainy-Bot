import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getReportHandler } from './report.controller';

export const reportRouter = Router();

reportRouter.get('/:sessionId', requireAuth, getReportHandler);