import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { pingDatabase } from './db/mysql';
import { initRealtime } from './realtime/socket';

async function main(): Promise<void> {
  try {
    await pingDatabase();
    console.log(`[db] Connected to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  } catch (error) {
    console.warn(
      `[db] WARNING: could not connect to MySQL (${env.DB_HOST}:${env.DB_PORT}) - ` +
        'API requests that touch the database will fail until it is reachable.',
    );
    console.warn((error as Error).message);
  }

  const app = createApp();
  const server = http.createServer(app);

  initRealtime(server);

  server.listen(env.PORT, () => {
    console.log(`[server] Brainy Bot API listening on http://localhost:${env.PORT}`);
    console.log(`[server] REST base path : /api`);
    console.log(`[server] WebSocket path : /ws`);
  });

  const shutdown = () => {
    console.log('[server] Shutting down...');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[server] Failed to start', error);
  process.exit(1);
});