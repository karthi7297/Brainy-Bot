import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface PlayerTokenPayload {
  sub: number;
  role: 'player';
  sid: number;
}

export function signPlayerToken(participantId: number, sessionId: number): string {
  return jwt.sign({ sub: participantId, role: 'player', sid: sessionId }, env.JWT_SECRET, {
    expiresIn: '2h',
  });
}

export function verifyPlayerToken(token: string): PlayerTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as PlayerTokenPayload;
  if (decoded.role !== 'player') {
    throw new Error('Not a player token');
  }
  return decoded;
}