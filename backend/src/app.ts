import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { quizRouter } from './modules/quizzes/quiz.routes';
import { sessionRouter } from './modules/sessions/session.routes';
import { reportRouter } from './modules/reports/report.routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          env.NODE_ENV === 'development' ||
          env.CORS_ORIGIN.includes(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'brainy-bot-backend', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/reports', reportRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}