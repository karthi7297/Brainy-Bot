import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  GameSession,
  GameState,
  LeaderboardEntry,
  Participant,
  Question,
  QuestionResult,
} from '../types';
import { api, wsUrl } from '../lib/api';

const HOST_SESSION_KEY = 'brainybot_host_session';
const PLAYER_KEY = 'brainybot_player';

/** A player's join credentials, persisted so a refresh can reattach. */
export interface PlayerSession {
  token: string;
  sessionId: number;
  participant: Participant;
  session: GameSession;
}

interface SessionStatePayload {
  session: GameSession;
  state: GameState;
  current_index: number;
  total_questions: number;
  question_deadline_at: string | null;
  time_remaining_ms: number | null;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
  question: Question | null;
  player?: Participant | null;
}

interface QuestionStartedPayload {
  question: Question & { time_remaining?: number };
  question_index: number;
  deadline_at: string;
  session: GameSession;
}

interface QuestionResultPayload {
  question_result: QuestionResult;
}

type WSMessage = { event: string; data: unknown; timestamp: string };

interface GameContextType {
  // --- Session ---
  session: GameSession | null;
  gameState: GameState;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];

  // --- Current question ---
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  questionResult: QuestionResult | null;
  answeredCount: number;
  totalPlayers: number;

  // --- Connection ---
  connected: boolean;
  error: string | null;
  clearError: () => void;

  // --- Host controls ---
  createSession: (quizId: number) => Promise<GameSession>;
  connectHost: (sessionId: number) => void;
  startGame: () => Promise<void>;
  nextQuestion: () => Promise<void>;
  closeQuestion: () => Promise<void>;
  endGame: () => Promise<void>;
  kickPlayer: (participantId: number) => Promise<void>;
  resetSession: () => void;

  // --- Player ---
  player: Participant | null;
  playerSession: PlayerSession | null;
  joinGame: (pin: string, nickname: string) => Promise<PlayerSession>;
  connectPlayer: (playerSession: PlayerSession) => void;
  submitAnswer: (optionId: number) => void;
  playerPointsAwarded: number | null;
  playerIsCorrect: boolean | null;
  clearPlayer: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(null);
  const [playerIsCorrect, setPlayerIsCorrect] = useState<boolean | null>(null);
  const [playerPointsAwarded, setPlayerPointsAwarded] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const roleRef = useRef<'host' | 'player'>('host');
  const deadlineRef = useRef<number | null>(null);
  const questionStartedRef = useRef<number | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore a player session from a previous page load.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PLAYER_KEY);
      if (raw) setPlayerSession(JSON.parse(raw) as PlayerSession);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetPlayerFeedback = useCallback(() => {
    setPlayerIsCorrect(null);
    setPlayerPointsAwarded(null);
  }, []);

  // ------------------------------------------------------
  // WebSocket message handling
  // ------------------------------------------------------
  const handleMessage = useCallback(
    (raw: string) => {
      let message: WSMessage;
      try {
        message = JSON.parse(raw) as WSMessage;
      } catch {
        return;
      }

      switch (message.event) {
        case 'SESSION_STATE': {
          const data = message.data as SessionStatePayload;
          setSession(data.session);
          setGameState(data.state);
          setParticipants(data.participants ?? []);
          setLeaderboard(data.leaderboard ?? []);
          setCurrentQuestion(data.question ?? null);
          setCurrentQuestionIndex(data.current_index ?? -1);
          setTotalQuestions(data.total_questions ?? 0);
          deadlineRef.current = data.question_deadline_at
            ? new Date(data.question_deadline_at).getTime()
            : null;
          if (data.state !== 'question_active') setTimeRemaining(0);
          break;
        }

        case 'LOBBY_UPDATED': {
          const data = message.data as { session: GameSession; participants: Participant[] };
          setSession(data.session);
          setParticipants(data.participants ?? []);
          break;
        }

        case 'GAME_STARTED': {
          const data = message.data as { session: GameSession };
          setSession(data.session);
          setGameState('question_active');
          setQuestionResult(null);
          resetPlayerFeedback();
          break;
        }

        case 'QUESTION_STARTED': {
          const data = message.data as QuestionStartedPayload;
          setCurrentQuestion(data.question ?? null);
          setCurrentQuestionIndex(data.question_index);
          setGameState('question_active');
          setQuestionResult(null);
          setAnsweredCount(0);
          resetPlayerFeedback();
          deadlineRef.current = data.deadline_at ? new Date(data.deadline_at).getTime() : null;
          questionStartedRef.current = Date.now();
          break;
        }

        case 'ANSWER_RECEIVED': {
          const data = message.data as {
            participant_id: number;
            answered_count?: number;
            total?: number;
            is_correct?: boolean;
            points_awarded?: number;
          };
          if (roleRef.current === 'player') {
            // Ack directed at this player.
            if (playerSession && data.participant_id === playerSession.participant.id) {
              setPlayerIsCorrect(Boolean(data.is_correct));
              setPlayerPointsAwarded(data.points_awarded ?? 0);
            }
          } else if (typeof data.answered_count === 'number') {
            setAnsweredCount(data.answered_count);
          }
          break;
        }

        case 'QUESTION_CLOSED': {
          setGameState('question_results');
          deadlineRef.current = null;
          setTimeRemaining(0);
          break;
        }

        case 'QUESTION_RESULTS': {
          const data = message.data as QuestionResultPayload;
          setQuestionResult(data.question_result ?? null);
          setGameState('question_results');
          break;
        }

        case 'LEADERBOARD_UPDATED': {
          const data = message.data as { leaderboard: LeaderboardEntry[] };
          setLeaderboard(data.leaderboard ?? []);
          break;
        }

        case 'GAME_COMPLETED': {
          const data = message.data as {
            session: GameSession;
            leaderboard: LeaderboardEntry[];
          };
          setSession(data.session);
          setLeaderboard(data.leaderboard ?? []);
          setGameState('completed');
          deadlineRef.current = null;
          setTimeRemaining(0);
          break;
        }

        case 'SESSION_ERROR': {
          const data = message.data as { message?: string };
          setError(data.message || 'Session error');
          break;
        }

        default:
          break;
      }
    },
    [playerSession, resetPlayerFeedback],
  );

  // ------------------------------------------------------
  // Connection management
  // ------------------------------------------------------
  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const openSocket = useCallback(
    (query: string, role: 'host' | 'player') => {
      disconnect();
      roleRef.current = role;

      const socket = new WebSocket(`${wsUrl()}?${query}`);
      wsRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => handleMessage(String(event.data));
      socket.onerror = () => setError('Realtime connection error');
      socket.onclose = () => {
        setConnected(false);
        if (wsRef.current === socket) wsRef.current = null;
      };

      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ event: 'HEARTBEAT', data: {}, timestamp: new Date().toISOString() }));
        }
      }, 25000);
    },
    [disconnect, handleMessage],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  const connectHost = useCallback(
    (sessionId: number) => {
      const token = localStorage.getItem('brainybot_token');
      if (!token) {
        setError('You must be logged in to host a game');
        return;
      }
      sessionStorage.setItem(HOST_SESSION_KEY, String(sessionId));
      openSocket(`token=${encodeURIComponent(token)}&sessionId=${sessionId}`, 'host');
    },
    [openSocket],
  );

  const connectPlayer = useCallback(
    (ps: PlayerSession) => {
      setPlayerSession(ps);
      sessionStorage.setItem(PLAYER_KEY, JSON.stringify(ps));
      openSocket(`token=${encodeURIComponent(ps.token)}`, 'player');
    },
    [openSocket],
  );

  // ------------------------------------------------------
  // Timer countdown driven by the server-provided deadline
  // ------------------------------------------------------
  useEffect(() => {
    const tick = () => {
      if (gameState !== 'question_active' || deadlineRef.current === null) return;
      const remainingMs = deadlineRef.current - Date.now();
      setTimeRemaining(remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [gameState]);

  // ------------------------------------------------------
  // Host REST controls
  // ------------------------------------------------------
  const createSession = useCallback(async (quizId: number) => {
    const res = await api.post<{ session: GameSession }>('/sessions', { quiz_id: quizId });
    setSession(res.session);
    setGameState('lobby');
    setParticipants([]);
    setLeaderboard([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(-1);
    setQuestionResult(null);
    return res.session;
  }, []);

  const startGame = useCallback(async () => {
    if (!session) return;
    await api.post(`/sessions/${session.id}/start`);
  }, [session]);

  const nextQuestion = useCallback(async () => {
    if (!session) return;
    setQuestionResult(null);
    resetPlayerFeedback();
    await api.post(`/sessions/${session.id}/next`);
  }, [session, resetPlayerFeedback]);

  const closeQuestion = useCallback(async () => {
    if (!session) return;
    await api.post(`/sessions/${session.id}/lock`);
  }, [session]);

  const endGame = useCallback(async () => {
    if (!session) return;
    await api.post(`/sessions/${session.id}/end`);
  }, [session]);

  const kickPlayer = useCallback(
    async (participantId: number) => {
      if (!session) return;
      await api.post(`/sessions/${session.id}/kick`, { participant_id: participantId });
    },
    [session],
  );

  const resetSession = useCallback(() => {
    disconnect();
    sessionStorage.removeItem(HOST_SESSION_KEY);
    setSession(null);
    setGameState('lobby');
    setParticipants([]);
    setLeaderboard([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(-1);
    setQuestionResult(null);
    setAnsweredCount(0);
  }, [disconnect]);

  // ------------------------------------------------------
  // Player actions
  // ------------------------------------------------------
  const joinGame = useCallback(async (pin: string, nickname: string) => {
    const res = await api.post<{
      session: GameSession;
      participant: Participant;
      token: string;
    }>('/sessions/join', { pin, nickname });

    const ps: PlayerSession = {
      token: res.token,
      sessionId: res.session.id,
      participant: res.participant,
      session: res.session,
    };
    setSession(res.session);
    setParticipants((prev) => {
      const others = prev.filter((p) => p.id !== res.participant.id);
      return [...others, res.participant];
    });
    return ps;
  }, []);

  const submitAnswer = useCallback(
    (optionId: number) => {
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (!currentQuestion) return;
      if (playerIsCorrect !== null || playerPointsAwarded !== null) return; // already answered

      const startedAt = questionStartedRef.current ?? Date.now();
      const responseTimeMs = Math.max(0, Date.now() - startedAt);

      socket.send(
        JSON.stringify({
          event: 'SUBMIT_ANSWER',
          data: {
            question_id: currentQuestion.id,
            option_id: optionId,
            response_time_ms: responseTimeMs,
          },
          timestamp: new Date().toISOString(),
        }),
      );
    },
    [currentQuestion, playerIsCorrect, playerPointsAwarded],
  );

  const clearPlayer = useCallback(() => {
    disconnect();
    sessionStorage.removeItem(PLAYER_KEY);
    setPlayerSession(null);
    resetPlayerFeedback();
  }, [disconnect, resetPlayerFeedback]);

  const totalPlayers = participants.filter((p) => p.status !== 'removed').length;

  return (
    <GameContext.Provider
      value={{
        session,
        gameState,
        participants,
        leaderboard,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        timeRemaining,
        questionResult,
        answeredCount,
        totalPlayers,
        connected,
        error,
        clearError,
        createSession,
        connectHost,
        startGame,
        nextQuestion,
        closeQuestion,
        endGame,
        kickPlayer,
        resetSession,
        player: playerSession?.participant ?? null,
        playerSession,
        joinGame,
        connectPlayer,
        submitAnswer,
        playerPointsAwarded,
        playerIsCorrect,
        clearPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function getStoredHostSessionId(): number | null {
  const raw = sessionStorage.getItem(HOST_SESSION_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
