import { query } from '../db/mysql';
import type { RowDataPacket } from 'mysql2/promise';

/** Generates a random 6-digit game PIN, retrying until it is unique. */
export async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const rows = await query<RowDataPacket[]>(
      'SELECT id FROM game_sessions WHERE game_pin = ? LIMIT 1',
      [pin],
    );
    if (rows.length === 0) return pin;
  }
  throw new Error('Could not generate a unique game PIN');
}

/** Normalizes a PIN coming from the client (strips spaces / dashes). */
export function normalizePin(pin: string): string {
  return pin.replace(/\D/g, '');
}
