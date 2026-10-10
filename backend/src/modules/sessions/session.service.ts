import type { RowDataPacket } from 'mysql2/promise';
import { execute, query } from '../../db/mysql';
import { mapSession, mapParticipant, type ParticipantRow, type SessionRow } from '../../db/models';
import { HttpError } from '../../utils/HttpError';
import { generateUniquePin } from '../../utils/pin';

export type SessionStatus = 'lobby' | 'running' | 'completed' | 'cancelled';

const SESSION_SELECT = `
  SELECT s.*, z.title AS quiz_title,
    (SELECT COUNT(*) FROM questions WHERE quiz_id = s.quiz_id) AS total_questions
  FROM game_sessions s
  JOIN quizzes z ON z.id = s.quiz_id`;

// ----------------------------------------------------------
// Finders
// ----------------------------------------------------------
export async function findSessionById(id: number): Promise<SessionRow | null> {
  const rows = await query<SessionRow[]>(`${SESSION_SELECT} WHERE s.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

export async function findSessionByPin(pin: string): Promise<SessionRow | null> {
  const rows = await query<SessionRow[]>(`${SESSION_SELECT} WHERE s.game_pin = ? LIMIT 1`, [pin]);
  return rows[0] ?? null;
}

export async function findSessionByQuizAndHost(quizId: number, hostId: number): Promise<SessionRow | null> {
  const rows = await query<SessionRow[]>(
    `${SESSION_SELECT} WHERE s.quiz_id = ? AND s.host_id = ? AND s.status IN ('lobby','running') LIMIT 1`,
    [quizId, hostId],
  );
  return rows[0] ?? null;
}

export function getSessionPublic(row: SessionRow) {
  return mapSession(row);
}

export async function listHostedSessions(hostId: number): Promise<SessionRow[]> {
  return query<SessionRow[]>(
    `${SESSION_SELECT} WHERE s.host_id = ? ORDER BY s.created_at DESC LIMIT 100`,
    [hostId],
  );
}

// ----------------------------------------------------------
// Creation & joining
// ----------------------------------------------------------
export async function createSession(hostId: number, quizId: number): Promise<SessionRow> {
  const quizRows = await query<RowDataPacket[]>(
    'SELECT id, title, owner_id, visibility, status FROM quizzes WHERE id = ? LIMIT 1',
    [quizId],
  );
  if (quizRows.length === 0) {
    throw HttpError.notFound('Quiz not found');
  }
  const quiz = quizRows[0];
  const canHost =
    quiz.owner_id === hostId || (quiz.visibility === 'public' && quiz.status === 'published');
  if (!canHost) {
    throw HttpError.forbidden('You cannot host this quiz');
  }

  const questionCount = await query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM questions WHERE quiz_id = ?',
    [quizId],
  );
  if (Number(questionCount[0].n) === 0) {
    throw HttpError.badRequest('This quiz has no questions yet');
  }

  const pin = await generateUniquePin();
  const result = await execute(
    "INSERT INTO game_sessions (quiz_id, host_id, game_pin) VALUES (?, ?, ?)",
    [quizId, hostId, pin],
  );

  const session = await findSessionById(result.insertId);
  if (!session) throw HttpError.notFound('Session creation failed');
  return session;
}

export async function joinParticipant(session: SessionRow, nickname: string): Promise<ParticipantRow> {
  if (session.status !== 'lobby' && session.status !== 'running') {
    throw HttpError.forbidden('This game is no longer accepting players');
  }

  const result = await execute(
    'INSERT INTO participants (session_id, nickname) VALUES (?, ?)',
    [session.id, nickname],
  );
  const rows = await query<ParticipantRow[]>(
    'SELECT * FROM participants WHERE id = ? LIMIT 1',
    [result.insertId],
  );
  return rows[0];
}

export async function listParticipants(sessionId: number): Promise<ParticipantRow[]> {
  return query<ParticipantRow[]>(
    'SELECT * FROM participants WHERE session_id = ? ORDER BY joined_at ASC',
    [sessionId],
  );
}

export async function findParticipantById(id: number): Promise<ParticipantRow | null> {
  const rows = await query<ParticipantRow[]>(
    'SELECT * FROM participants WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] ?? null;
}

// ----------------------------------------------------------
// Mutations used by the live game engine
// ----------------------------------------------------------
export async function setSessionStatus(id: number, status: SessionStatus): Promise<void> {
  await execute('UPDATE game_sessions SET status = ? WHERE id = ?', [status, id]);
}

export async function setSessionStarted(id: number, startedAt: Date): Promise<void> {
  await execute(
    "UPDATE game_sessions SET status = 'running', started_at = ?, current_question_index = -1, current_question_id = NULL WHERE id = ?",
    [startedAt, id],
  );
}

export async function setCurrentQuestion(
  id: number,
  questionId: number | null,
  index: number,
  questionStartedAt: Date | null,
  deadlineAt: Date | null,
): Promise<void> {
  await execute(
    `UPDATE game_sessions
     SET current_question_id = ?, current_question_index = ?, question_started_at = ?, question_deadline_at = ?
     WHERE id = ?`,
    [questionId, index, questionStartedAt, deadlineAt, id],
  );
}

export async function setAnsweredDeadlineReached(id: number): Promise<void> {
  await execute(
    'UPDATE game_sessions SET question_deadline_at = NULL WHERE id = ?',
    [id],
  );
}

export async function completeSession(id: number, endedAt: Date): Promise<void> {
  await execute(
    "UPDATE game_sessions SET status = 'completed', ended_at = ?, question_deadline_at = NULL WHERE id = ?",
    [endedAt, id],
  );
}

export async function markFinished(sessionId: number): Promise<void> {
  await execute(
    "UPDATE participants SET status = 'finished' WHERE session_id = ? AND status != 'removed'",
    [sessionId],
  );
}

export async function removeParticipant(participantId: number): Promise<void> {
  await execute("UPDATE participants SET status = 'removed', left_at = NOW() WHERE id = ?", [participantId]);
}

export async function saveAnswer(input: {
  sessionId: number;
  participantId: number;
  questionId: number;
  optionId: number | null;
  isCorrect: boolean;
  points: number;
  responseTimeMs: number;
  submittedAt: Date;
}): Promise<void> {
  await execute(
    `INSERT INTO answer_submissions
       (session_id, participant_id, question_id, selected_option_id, is_correct, points_awarded, response_time_ms, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       selected_option_id = VALUES(selected_option_id),
       is_correct = VALUES(is_correct),
       points_awarded = VALUES(points_awarded),
       response_time_ms = VALUES(response_time_ms),
       submitted_at = VALUES(submitted_at)`,
    [
      input.sessionId,
      input.participantId,
      input.questionId,
      input.optionId,
      input.isCorrect ? 1 : 0,
      input.points,
      input.responseTimeMs,
      input.submittedAt,
    ],
  );
}

export async function earnPoints(participantId: number, points: number): Promise<void> {
  await execute('UPDATE participants SET total_score = total_score + ? WHERE id = ?', [points, participantId]);
}

export async function setParticipantScore(participantId: number, totalScore: number): Promise<void> {
  await execute('UPDATE participants SET total_score = ? WHERE id = ?', [totalScore, participantId]);
}

export { mapParticipant };