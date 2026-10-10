import WebSocket from 'ws';
import type { RowDataPacket } from 'mysql2/promise';
import { query } from '../db/mysql';
import {
  completeSession,
  earnPoints,
  findSessionById,
  listParticipants,
  markFinished,
  removeParticipant,
  saveAnswer,
  setAnsweredDeadlineReached,
  setCurrentQuestion,
  setSessionStarted,
  type SessionStatus,
} from '../modules/sessions/session.service';
import { getQuestionsForSession } from '../modules/questions/question.service';
import {
  mapParticipant,
  mapSession,
  type ParticipantRow,
  type SessionRow,
} from '../db/models';
import { HttpError } from '../utils/HttpError';

// ======================================================
// Types (mirror the frontend WS contract)
// ======================================================
export type GameState =
  | 'lobby'
  | 'question_active'
  | 'question_locked'
  | 'question_results'
  | 'completed'
  | 'cancelled';

export type WSServerEvent =
  | 'LOBBY_UPDATED'
  | 'PLAYER_JOINED'
  | 'PLAYER_REMOVED'
  | 'GAME_STARTED'
  | 'QUESTION_STARTED'
  | 'ANSWER_RECEIVED'
  | 'QUESTION_CLOSED'
  | 'QUESTION_RESULTS'
  | 'LEADERBOARD_UPDATED'
  | 'GAME_COMPLETED'
  | 'SESSION_STATE'
  | 'SESSION_ERROR';

export type WSClientEvent =
  | 'JOIN_SESSION'
  | 'SUBMIT_ANSWER'
  | 'REQUEST_STATE'
  | 'HEARTBEAT';

export interface WSMessage<T = unknown> {
  event: WSServerEvent | WSClientEvent;
  data: T;
  timestamp: string;
}

interface ClientConnection {
  ws: WebSocket;
  role: 'host' | 'player';
  participantId: number | null;
}

interface QuestionWithOptions {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  position: number;
  time_limit_seconds: number;
  base_points: number;
  image_url: string | null;
  explanation: string | null;
  options: {
    id: number;
    question_id: number;
    option_text: string;
    position: number;
    is_correct: boolean;
  }[];
}

interface AnswerState {
  participantId: number;
  optionId: number | null;
  isCorrect: boolean;
  points: number;
  responseTimeMs: number;
}

interface LeaderboardEntry {
  rank: number;
  participant_id: number;
  nickname: string;
  total_score: number;
  correct_count: number;
  streak: number;
}

// ======================================================
// Live engine: one instance per active game session
// ======================================================
export class LiveEngine {
  readonly sessionId: number;
  session: SessionRow;
  questions: QuestionWithOptions[] = [];
  state: GameState = 'lobby';
  currentIndex = -1;
  clients = new Map<WebSocket, ClientConnection>();
  participants = new Map<number, ParticipantRow>();
  private answers = new Map<number, AnswerState[]>();
  private questionTimer: NodeJS.Timeout | null = null;
  private questionDeadline: Date | null = null;
  lastLeaderboard: LeaderboardEntry[] = [];

  constructor(sessionId: number) {
    this.sessionId = sessionId;
    this.session = {} as SessionRow;
  }

  async load(): Promise<LiveEngine> {
    const session = await findSessionById(this.sessionId);
    if (!session) throw HttpError.notFound('Session not found');
    this.session = session;

    const [questionRows, participantRows] = await Promise.all([
      getQuestionsForSession(session.quiz_id),
      listParticipants(session.id),
    ]);
    this.questions = questionRows as unknown as QuestionWithOptions[];
    for (const p of participantRows) this.participants.set(p.id, p);

    // Resume from persisted state
    this.currentIndex = session.current_question_index ?? -1;
    if (session.status === 'completed' || session.status === 'cancelled') {
      this.state = session.status as GameState;
    } else if (session.status === 'running') {
      this.state =
        session.question_deadline_at && new Date(session.question_deadline_at) > new Date()
          ? 'question_active'
          : 'question_results';
    } else {
      this.state = 'lobby';
    }
    return this;
  }

  // ------------------------------------------------------
  // Connection management
  // ------------------------------------------------------
  registerHost(ws: WebSocket): void {
    this.clients.set(ws, { ws, role: 'host', participantId: null });
  }

  async registerPlayer(ws: WebSocket, participantId: number): Promise<void> {
    let participant = this.participants.get(participantId);
    if (!participant) {
      const rows = await query<ParticipantRow[]>(
        'SELECT * FROM participants WHERE id = ? AND session_id = ? LIMIT 1',
        [participantId, this.sessionId],
      );
      if (rows.length === 0) {
        throw HttpError.notFound('Participant not found in this session');
      }
      participant = rows[0];
      this.participants.set(participantId, participant);
    }
    this.clients.set(ws, { ws, role: 'player', participantId });

    await query('UPDATE participants SET status = ? WHERE id = ?', ['connected', participantId]);
    participant.status = 'connected';

    this.broadcastToHosts('PLAYER_JOINED', { participant: mapParticipant(participant) });
    this.broadcastLobby();
  }

  unregister(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;
    this.clients.delete(ws);
    this.broadcastLobby();
  }

  get participantCount(): number {
    return [...this.participants.values()].filter((p) => p.status !== 'removed').length;
  }

  // ------------------------------------------------------
  // Broadcast helpers
  // ------------------------------------------------------
  private send(ws: WebSocket, event: WSServerEvent, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      const message: WSMessage = { event, data, timestamp: new Date().toISOString() };
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastAll(event: WSServerEvent, data: unknown): void {
    for (const client of this.clients.values()) this.send(client.ws, event, data);
  }

  private broadcastToHosts(event: WSServerEvent, data: unknown): void {
    for (const client of this.clients.values()) {
      if (client.role === 'host') this.send(client.ws, event, data);
    }
  }

  private broadcastToPlayers(event: WSServerEvent, data: unknown): void {
    for (const client of this.clients.values()) {
      if (client.role === 'player') this.send(client.ws, event, data);
    }
  }

  broadcastLobby(): void {
    const participants = [...this.participants.values()]
      .map(mapParticipant)
      .sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? ''));
    this.broadcastAll('LOBBY_UPDATED', {
      session: mapSession(this.session),
      participants,
    });
  }

  private sanitizeQuestion(question: QuestionWithOptions) {
    return {
      ...question,
      options: question.options.map((o) => ({ ...o, is_correct: undefined })),
    };
  }

  // ------------------------------------------------------
  // Snapshot for a newly connected (or re-requesting) client
  // ------------------------------------------------------
  snapshotFor(role: 'host' | 'player', participantId: number | null) {
    const currentQuestion =
      this.currentIndex >= 0 && this.currentIndex < this.questions.length
        ? this.questions[this.currentIndex]
        : null;

    const base = {
      session: mapSession(this.session),
      state: this.state,
      current_index: this.currentIndex,
      total_questions: this.questions.length,
      question_deadline_at: this.questionDeadline?.toISOString() ?? null,
      time_remaining_ms: this.timeRemainingMs(),
      participants: [...this.participants.values()]
        .map((p) => mapParticipant(p))
        .sort((a, b) => (a.joined_at ?? '').localeCompare(b.joined_at ?? '')),
      leaderboard: this.lastLeaderboard,
      question: currentQuestion ? (role === 'host' ? currentQuestion : this.sanitizeQuestion(currentQuestion)) : null,
    };

    if (role === 'player' && participantId !== null) {
      return {
        ...base,
        player: this.participants.get(participantId)
          ? mapParticipant(this.participants.get(participantId)!)
          : null,
      };
    }
    return base;
  }

  private timeRemainingMs(): number | null {
    if (!this.questionDeadline) return null;
    const ms = this.questionDeadline.getTime() - Date.now();
    return ms > 0 ? ms : 0;
  }

  // ------------------------------------------------------
  // Host game-flow controls
  // ------------------------------------------------------
  async startGame(): Promise<void> {
    if (this.state !== 'lobby') throw HttpError.badRequest('Game already started');
    if (this.questions.length === 0) throw HttpError.badRequest('Quiz has no questions');
    if (this.participantCount === 0) throw HttpError.badRequest('No players have joined');

    this.state = 'question_active';
    this.currentIndex = 0;
    await setSessionStarted(this.sessionId, new Date());
    this.session = (await findSessionById(this.sessionId))!;

    this.broadcastAll('GAME_STARTED', { session: mapSession(this.session) });
    await this.startCurrentQuestion();
  }

  private async startCurrentQuestion(): Promise<void> {
    const question = this.questions[this.currentIndex];
    if (!question) throw HttpError.badRequest('Question not found');

    this.answers.set(question.id, []);
    this.state = 'question_active';

    const now = new Date();
    const deadline = new Date(now.getTime() + question.time_limit_seconds * 1000);
    this.questionDeadline = deadline;
    await setCurrentQuestion(this.sessionId, question.id, this.currentIndex, now, deadline);
    this.session = (await findSessionById(this.sessionId))!;

    const payload = {
      question: {
        ...question,
        time_remaining: question.time_limit_seconds,
      },
      question_index: this.currentIndex,
      deadline_at: deadline.toISOString(),
      session: mapSession(this.session),
    };
    this.broadcastToHosts('QUESTION_STARTED', payload);
    this.broadcastToPlayers('QUESTION_STARTED', {
      ...payload,
      question: this.sanitizeQuestion(payload.question),
    });

    this.clearQuestionTimer();
    this.questionTimer = setTimeout(() => {
      void this.lockQuestion();
    }, question.time_limit_seconds * 1000);
  }

  async nextQuestion(): Promise<void> {
    if (this.state === 'completed' || this.state === 'cancelled') {
      throw HttpError.badRequest('Game already finished');
    }
    if (this.currentIndex + 1 >= this.questions.length) {
      await this.endGame();
      return;
    }
    this.currentIndex += 1;
    await this.startCurrentQuestion();
  }

  async lockQuestion(): Promise<void> {
    if (this.state !== 'question_active') return;
    this.clearQuestionTimer();
    this.state = 'question_results';
    this.questionDeadline = null;
    await setAnsweredDeadlineReached(this.sessionId);

    const question = this.questions[this.currentIndex];
    const result = await this.computeQuestionResult(question);

    this.broadcastAll('QUESTION_CLOSED', {
      question_id: question.id,
      correct_option_id: result.correct_option_id,
    });
    this.broadcastAll('QUESTION_RESULTS', { question_result: result });

    const leaderboard = await this.computeLeaderboard();
    this.lastLeaderboard = leaderboard;
    this.broadcastAll('LEADERBOARD_UPDATED', { leaderboard });
  }

  async endGame(): Promise<void> {
    if (this.state === 'completed' || this.state === 'cancelled') return;
    this.clearQuestionTimer();
    this.state = 'completed';
    this.questionDeadline = null;

    await completeSession(this.sessionId, new Date());
    await markFinished(this.sessionId);
    this.session = (await findSessionById(this.sessionId))!;
    for (const p of this.participants.values()) {
      if (p.status !== 'removed') p.status = 'finished';
    }

    const leaderboard = await this.computeLeaderboard();
    this.lastLeaderboard = leaderboard;
    this.broadcastAll('GAME_COMPLETED', {
      session: mapSession(this.session),
      quiz_title: this.session.quiz_title,
      leaderboard,
    });
    this.broadcastAll('LEADERBOARD_UPDATED', { leaderboard });
  }

  async setSessionStatus(status: SessionStatus): Promise<void> {
    const { setSessionStatus: persist } = await import('../modules/sessions/session.service');
    await persist(this.sessionId, status);
    this.session = (await findSessionById(this.sessionId))!;
  }

  async kickPlayer(participantId: number): Promise<void> {
    await removeParticipant(participantId);
    const participant = this.participants.get(participantId);
    if (participant) participant.status = 'removed';
    this.participants.delete(participantId);

    for (const client of this.clients.values()) {
      if (client.participantId === participantId) {
        this.send(client.ws, 'PLAYER_REMOVED', { participant_id: participantId });
        client.ws.close(4000, 'removed');
      }
    }
    this.broadcastToHosts('PLAYER_REMOVED', { participant_id: participantId });
    this.broadcastLobby();
  }

  // ------------------------------------------------------
  // Player actions
  // ------------------------------------------------------
  async submitAnswer(
    participantId: number,
    input: { question_id: number; option_id: number | null; response_time_ms: number },
  ): Promise<void> {
    if (this.state !== 'question_active') {
      throw HttpError.badRequest('This question is no longer accepting answers');
    }
    const question = this.questions[this.currentIndex];
    if (!question || question.id !== input.question_id) {
      throw HttpError.badRequest('Question is not active');
    }

    const existing = this.answers.get(question.id) ?? [];
    if (existing.some((a) => a.participantId === participantId)) {
      throw HttpError.badRequest('Answer already submitted');
    }

    const selectedOption = question.options.find((o) => o.id === input.option_id);
    const isCorrect = input.option_id !== null && selectedOption?.is_correct === true;

    let points = 0;
    if (isCorrect) {
      // Faster answers earn more: points scale with time remaining.
      const totalMs = question.time_limit_seconds * 1000;
      const elapsedMs = Math.min(input.response_time_ms, totalMs);
      const ratio = Math.max(0, Math.min(1, (totalMs - elapsedMs) / totalMs));
      points = Math.round(question.base_points * (0.5 + 0.5 * ratio));
    }

    const answer: AnswerState = {
      participantId,
      optionId: input.option_id,
      isCorrect,
      points,
      responseTimeMs: input.response_time_ms,
    };
    existing.push(answer);
    this.answers.set(question.id, existing);

    await saveAnswer({
      sessionId: this.sessionId,
      participantId,
      questionId: question.id,
      optionId: input.option_id,
      isCorrect,
      points,
      responseTimeMs: input.response_time_ms,
      submittedAt: new Date(),
    });

    if (points > 0) {
      await earnPoints(participantId, points);
      const p = this.participants.get(participantId);
      if (p) p.total_score += points;
    }

    this.broadcastToHosts('ANSWER_RECEIVED', {
      participant_id: participantId,
      answered_count: existing.length,
      total: this.participantCount,
    });

    // Ack to the submitting player
    for (const client of this.clients.values()) {
      if (client.role === 'player' && client.participantId === participantId) {
        this.send(client.ws, 'ANSWER_RECEIVED', {
          participant_id: participantId,
          is_correct: isCorrect,
          points_awarded: points,
        });
      }
    }

    if (existing.length >= this.participantCount) {
      await this.lockQuestion();
    }
  }

  // ------------------------------------------------------
  // Computations
  // ------------------------------------------------------
  private async computeQuestionResult(question: QuestionWithOptions) {
    const answers = this.answers.get(question.id) ?? [];
    const total = this.participantCount;

    const distribution = question.options.map((option) => {
      const count = answers.filter((a) => a.optionId === option.id).length;
      return {
        option_id: option.id,
        option_text: option.option_text,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        is_correct: option.is_correct,
      };
    });

    const correctOption = question.options.find((o) => o.is_correct);
    const correct_count = answers.filter((a) => a.isCorrect).length;
    const answered_count = answers.length;
    const unanswered_count = Math.max(0, total - answered_count);

    return {
      question_id: question.id,
      question_text: question.question_text,
      correct_count,
      incorrect_count: answered_count - correct_count,
      unanswered_count,
      total_participants: total,
      distribution,
      correct_option_id: correctOption?.id ?? null,
      correct_option_text: correctOption?.option_text ?? '',
    };
  }

  async computeLeaderboard(): Promise<LeaderboardEntry[]> {
    const rows = await query<RowDataPacket[]>(
      `SELECT
         p.id AS participant_id,
         p.nickname,
         p.total_score,
         COUNT(CASE WHEN a.is_correct = 1 THEN 1 END) AS correct_count
       FROM participants p
       LEFT JOIN answer_submissions a ON a.participant_id = p.id AND a.session_id = p.session_id
       WHERE p.session_id = ? AND p.status != 'removed'
       GROUP BY p.id, p.nickname, p.total_score
       ORDER BY p.total_score DESC, correct_count DESC, p.id ASC`,
      [this.sessionId],
    );

    const streaks = await this.computeStreaks();

    return rows.map((row, index) => ({
      rank: index + 1,
      participant_id: Number(row.participant_id),
      nickname: row.nickname as string,
      total_score: Number(row.total_score),
      correct_count: Number(row.correct_count),
      streak: streaks.get(Number(row.participant_id)) ?? 0,
    }));
  }

  private async computeStreaks(): Promise<Map<number, number>> {
    const rows = await query<RowDataPacket[]>(
      `SELECT a.participant_id, a.is_correct
       FROM answer_submissions a
       JOIN questions q ON q.id = a.question_id
       WHERE a.session_id = ?
       ORDER BY a.participant_id, q.position ASC, a.id ASC`,
      [this.sessionId],
    );
    const streaks = new Map<number, number>();
    for (const row of rows) {
      const id = Number(row.participant_id);
      const isCorrect = Number(row.is_correct) === 1;
      streaks.set(id, isCorrect ? (streaks.get(id) ?? 0) + 1 : 0);
    }
    return streaks;
  }

  leaderboardValue(): LeaderboardEntry[] {
    return this.lastLeaderboard;
  }

  private clearQuestionTimer(): void {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }
  }
}

// ======================================================
// Manager: keeps live engines keyed by session id
// ======================================================
class GameHub {
  private engines = new Map<number, LiveEngine>();

  async getEngine(sessionId: number): Promise<LiveEngine> {
    let engine = this.engines.get(sessionId);
    if (!engine) {
      engine = new LiveEngine(sessionId);
      await engine.load();
      this.engines.set(sessionId, engine);
    }
    return engine;
  }

  hasEngine(sessionId: number): boolean {
    return this.engines.has(sessionId);
  }

  getEngineSync(sessionId: number): LiveEngine | undefined {
    return this.engines.get(sessionId);
  }

  cleanup(sessionId: number, engine: LiveEngine): void {
    // Tear down when nobody is connected and the game has finished.
    const finished = engine.state === 'completed' || engine.state === 'cancelled';
    if (finished && engine.clients.size === 0) {
      this.engines.delete(sessionId);
    }
  }
}

export const gameHub = new GameHub();