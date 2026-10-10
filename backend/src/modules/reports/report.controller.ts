import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/HttpError';
import { findSessionById } from '../sessions/session.service';
import { getSessionReport } from './report.service';

export const getReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = Number(req.params.sessionId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw HttpError.badRequest('Invalid session id');
  }

  const session = await findSessionById(sessionId);
  if (!session) throw HttpError.notFound('Session not found');
  if (session.host_id !== req.user!.id) {
    throw HttpError.forbidden('You cannot view this report');
  }

  const report = await getSessionReport(sessionId);
  res.json({ report });
});