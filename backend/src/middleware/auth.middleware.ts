import type { NextFunction, Request, Response } from 'express';
import { query } from '../db/mysql';
import { HttpError } from '../utils/HttpError';
import { verifyToken } from '../utils/jwt';
import type { UserRow } from '../db/models';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw HttpError.unauthorized('Missing bearer token');
    }

    const payload = verifyToken(header.slice(7));

    const rows = await query<UserRow[]>(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [payload.sub],
    );
    if (rows.length === 0) {
      throw HttpError.unauthorized('Account no longer exists');
    }

    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      next(HttpError.unauthorized('Invalid or expired token'));
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7));
      req.user = { id: payload.sub, name: '', email: payload.email };
    } catch {
      // ignore invalid token on optional auth
    }
  }
  next();
}