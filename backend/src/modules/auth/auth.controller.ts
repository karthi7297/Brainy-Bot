import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { findUserById, login, register } from './auth.service';

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const result = await register(name, email, password);
  res.status(201).json(result);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await login(email, password);
  res.json(result);
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await findUserById(req.user!.id);
  res.json({ user });
});