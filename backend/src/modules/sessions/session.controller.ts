import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { HttpError } from '../../utils/HttpError';
import { mapParticipant, mapSession } from '../../db/models';
import { gameHub, type LiveEngine } from '../../realtime/gameHub';
import { signPlayerToken } from '../../realtime/playerToken';
import { normalizePin } from '../../utils/pin';
import {
  createSession,
  findSessionByPin,
  joinParticipant,
  listHostedSessions,
  listParticipants,
} from './session.service';

function wsUrl(req: Request): string {
  const forwarded = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const scheme = proto && proto.includes('https') ? 'wss' : 'ws';
  return `${scheme}://${req.headers.host}/ws`;
}

function assertHost(engine: LiveEngine, userId: number): void {
  if (engine.session.host_id !== userId) {
    throw HttpError.forbidden('You are not the host of this session');
  }
}

export const createSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { quiz_id } = req.body as { quiz_id: number };
  const session = await createSession(req.user!.id, quiz_id);

  // Prepare the live engine so connections resolve instantly.
  await gameHub.getEngine(session.id);

  res.status(201).json({ session: mapSession(session) });
});

export const listSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await listHostedSessions(req.user!.id);
  res.json({ sessions: sessions.map(mapSession) });
});

export const lookupSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const pin = normalizePin((req.body as { pin: string }).pin);
  if (!/^\d{6}$/.test(pin)) {
    throw HttpError.badRequest('Enter a valid 6-digit game PIN');
  }
  const session = await findSessionByPin(pin);
  if (!session) {
    throw HttpError.notFound('No game found with that PIN');
  }
  if (session.status === 'completed' || session.status === 'cancelled') {
    throw HttpError.badRequest('That game has already ended');
  }
  res.json({ session: mapSession(session) });
});

export const joinSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const pin = normalizePin((req.body as { pin: string }).pin);
  const nickname = (req.body as { nickname: string }).nickname;

  const session = await findSessionByPin(pin);
  if (!session) throw HttpError.notFound('No game found with that PIN');
  if (session.status !== 'lobby' && session.status !== 'running') {
    throw HttpError.badRequest('That game is not accepting players');
  }

  const participant = await joinParticipant(session, nickname);
  const engine = await gameHub.getEngine(session.id);
  if (!engine.participants.has(participant.id)) {
    engine.participants.set(participant.id, participant);
  }
  engine.broadcastLobby();

  res.status(201).json({
    session: mapSession(session),
    participant: mapParticipant(participant),
    token: signPlayerToken(participant.id, session.id),
    ws_url: wsUrl(req),
  });
});

export const getSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  const participants = await listParticipants(engine.session.id);
  res.json({
    session: mapSession(engine.session),
    participants: participants.map(mapParticipant),
  });
});

export const getStateHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  res.json(engine.snapshotFor('host', null));
});

export const startGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  await engine.startGame();
  res.json({ snapshot: engine.snapshotFor('host', null) });
});

export const nextQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  await engine.nextQuestion();
  res.json({ snapshot: engine.snapshotFor('host', null) });
});

export const lockQuestionHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  await engine.lockQuestion();
  res.json({ snapshot: engine.snapshotFor('host', null) });
});

export const endGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  await engine.endGame();
  res.json({ snapshot: engine.snapshotFor('host', null) });
});

export const kickPlayerHandler = asyncHandler(async (req: Request, res: Response) => {
  const engine = await gameHub.getEngine(Number(req.params.sessionId));
  assertHost(engine, req.user!.id);
  const participantId = Number((req.body as { participant_id: number }).participant_id);
  await engine.kickPlayer(participantId);
  res.status(204).send();
});