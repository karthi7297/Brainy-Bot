import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../utils/HttpError';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      next(HttpError.badRequest('Invalid request', result.error.flatten()));
      return;
    }
    (req as Request & Record<string, unknown>)[source] = result.data;
    next();
  };
}