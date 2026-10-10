import type { RowDataPacket } from 'mysql2/promise';
import { query } from '../../db/mysql';
import { mapUser, type UserRow } from '../../db/models';
import { HttpError } from '../../utils/HttpError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import type { User } from './auth.types';

export interface AuthResult {
  token: string;
  user: User;
}

export function toPublicUser(row: UserRow): User {
  return mapUser(row) as User;
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  const existing = await query<RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  if (existing.length > 0) {
    throw HttpError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const result = await query<RowDataPacket[]>(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );

  const created = await query<UserRow[]>(
    'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
    [(result as unknown as { insertId: number }).insertId],
  );

  const user = toPublicUser(created[0]);
  return { token: signToken({ sub: user.id, email: user.email }), user };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const rows = await query<UserRow[]>(
    "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  if (rows.length === 0) {
    throw HttpError.unauthorized('Invalid email or password');
  }

  const valid = await verifyPassword(password, rows[0].password_hash);
  if (!valid) {
    throw HttpError.unauthorized('Invalid email or password');
  }

  const user = toPublicUser(rows[0]);
  return { token: signToken({ sub: user.id, email: user.email }), user };
}

export async function findUserById(id: number): Promise<User | null> {
  const rows = await query<UserRow[]>(
    'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  if (rows.length === 0) return null;
  return toPublicUser(rows[0]);
}