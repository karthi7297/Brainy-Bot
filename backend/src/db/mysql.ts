import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';

let pool: Pool | null = null;

type QueryParams = Parameters<Pool['query']>[1];
type ExecuteParams = Parameters<Pool['execute']>[1];

function toQueryParams(params: unknown[]): QueryParams | undefined {
  if (params.length === 0) return undefined;
  return (params as unknown) as QueryParams;
}

function toExecuteParams(params: unknown[]): ExecuteParams | undefined {
  if (params.length === 0) return undefined;
  return (params as unknown) as ExecuteParams;
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: false,
      namedPlaceholders: false,
      charset: 'utf8mb4_unicode_ci',
    });
  }
  return pool;
}

export async function query<T extends RowDataPacket[] | RowDataPacket[][]>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const [rows] = await getPool().query<T>(sql, toQueryParams(params));
  return rows;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, toExecuteParams(params));
  return result;
}

export interface Tx {
  connection: PoolConnection;
  query: <T extends RowDataPacket[]>(sql: string, params?: unknown[]) => Promise<T>;
  execute: (sql: string, params?: unknown[]) => Promise<ResultSetHeader>;
}

export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const tx: Tx = {
      connection,
      query: async <R extends RowDataPacket[]>(sql: string, params: unknown[] = []) => {
        const [rows] = await connection.query<R>(sql, toQueryParams(params));
        return rows;
      },
      execute: async (sql: string, params: unknown[] = []) => {
        const [result] = await connection.execute<ResultSetHeader>(sql, toExecuteParams(params));
        return result;
      },
    };
    const result = await fn(tx);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function pingDatabase(): Promise<void> {
  await getPool().query('SELECT 1');
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
