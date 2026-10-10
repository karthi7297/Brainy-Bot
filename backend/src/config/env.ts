import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  DB_HOST: required('DB_HOST', 'localhost'),
  DB_PORT: Number(required('DB_PORT', '3306')),
  DB_USER: required('DB_USER', 'root'),
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_NAME: required('DB_NAME', 'brainybot'),

  JWT_SECRET: required('JWT_SECRET', isTest ? 'test-secret' : 'super-secret-brainy-bot-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
} as const;

export type Env = typeof env;
