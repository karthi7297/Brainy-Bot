import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { loginHandler, meHandler, registerHandler } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), registerHandler);
authRouter.post('/login', validate(loginSchema), loginHandler);
authRouter.get('/me', requireAuth, meHandler);