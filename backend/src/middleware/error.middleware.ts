import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/HttpError';

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } satisfies ErrorResponse);
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ error: error.name, message: error.message, details: error.details } satisfies ErrorResponse);
    return;
  }

  // mysql duplicate entry (e.g. unique nickname, email, PIN)
  const code = (error as { code?: string })?.code;
  if (code === 'ER_DUP_ENTRY') {
    res.status(409).json({ error: 'DUPLICATE_ENTRY', message: 'A record with that value already exists' } satisfies ErrorResponse);
    return;
  }

  if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
    res.status(400).json({ error: 'INVALID_REFERENCE', message: 'Referenced record does not exist' } satisfies ErrorResponse);
    return;
  }

  console.error('[UNHANDLED_ERROR]', error);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' } satisfies ErrorResponse);
}