import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  GameSession,
  Participant,
  Question,
  QuestionResult,
  LeaderboardEntry,
  GameState,
} from '../types';
import { mockQuestions, mockQuestionResults, mockLeaderboard } from '../data/mockData';

interface GameContextType {
  // Session
  session: GameSession | null;
  gameState: GameState;
  // Host
  setSession: (s: GameSession | null) => void;
  startGame: () => void;
  nextQuestion: () => void;
  closeQuestion: () => void;
  endGame: () => void;
  // Participants
  participants: Participant[];
  addParticipant: (nickname: string) => void;
  removeParticipant: (id: number) => void;
  // Current question
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  // Results
  questionResult: QuestionResult | null;
  leaderboard: LeaderboardEntry[];
  // Player
  playerParticipant: Participant | null;
  setPlayerParticipant: (p: Participant | null) => void;
  selectedOptionId: number | null;
  submitAnswer: (optionId: number) => void;
  playerPointsAwarded: number;
  playerIsCorrect: boolean | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerParticipant, setPlayerParticipant] = useState<Participant | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [playerPointsAwarded, setPlayerPointsAwarded] = useState(0);
  const [playerIsCorrect, setPlayerIsCorrect] = useState<boolean | null>(null);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

  const questions = session ? mockQuestions[session.quiz_id] || [] : [];
  const totalQuestions = questions.length;

  const startTimer = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerRef(interval);
    return interval;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
  }, [timerRef]);

  const startGame = useCallback(() => {
    setGameState('question_active');
    const q = questions[0];
    if (q) {
      setCurrentQuestionIndex(0);
      setCurrentQuestion(q);
      setSelectedOptionId(null);
      setPlayerIsCorrect(null);
      setPlayerPointsAwarded(0);
      startTimer(q.time_limit_seconds);
    }
  }, [questions, startTimer]);

  const nextQuestion = useCallback(() => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questions.length) {
      const q = questions[nextIdx];
      setCurrentQuestionIndex(nextIdx);
      setCurrentQuestion(q);
      setGameState('question_active');
      setSelectedOptionId(null);
      setPlayerIsCorrect(null);
      setPlayerPointsAwarded(0);
      setQuestionResult(null);
      startTimer(q.time_limit_seconds);
    }
  }, [currentQuestionIndex, questions, startTimer]);

  const closeQuestion = useCallback(() => {
    stopTimer();
    setGameState('question_results');
    // Simulate results
    const result = mockQuestionResults[currentQuestionIndex % mockQuestionResults.length];
    if (result && currentQuestion) {
      setQuestionResult({ ...result, question_id: currentQuestion.id, question_text: currentQuestion.question_text });
    }
    setLeaderboard(mockLeaderboard);
  }, [stopTimer, currentQuestionIndex, currentQuestion]);

  const endGame = useCallback(() => {
    stopTimer();
    setGameState('completed');
    setLeaderboard(mockLeaderboard);
  }, [stopTimer]);

  const addParticipant = useCallback((nickname: string) => {
    const newP: Participant = {
      id: Date.now(),
      session_id: session?.id || 0,
      nickname,
      total_score: 0,
      status: 'connected',
      joined_at: new Date().toISOString(),
    };
    setParticipants((prev) => [...prev, newP]);
  }, [session]);

  const removeParticipant = useCallback((id: number) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const submitAnswer = useCallback((optionId: number) => {
    if (selectedOptionId !== null) return; // already submitted
    setSelectedOptionId(optionId);
    // Check correctness
    if (currentQuestion) {
      const correct = currentQuestion.options.find((o) => o.is_correct);
      const isCorrect = correct?.id === optionId;
      setPlayerIsCorrect(isCorrect);
      if (isCorrect) {
        const ratio = Math.max(0, Math.min(1, timeRemaining / currentQuestion.time_limit_seconds));
        const pts = Math.round(currentQuestion.base_points * (0.5 + 0.5 * ratio));
        setPlayerPointsAwarded(pts);
        setPlayerParticipant((prev) =>
          prev ? { ...prev, total_score: prev.total_score + pts } : prev
        );
      } else {
        setPlayerPointsAwarded(0);
      }
    }
  }, [selectedOptionId, currentQuestion, timeRemaining]);

  return (
    <GameContext.Provider
      value={{
        session,
        gameState,
        setSession,
        startGame,
        nextQuestion,
        closeQuestion,
        endGame,
        participants,
        addParticipant,
        removeParticipant,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        timeRemaining,
        questionResult,
        leaderboard,
        playerParticipant,
        setPlayerParticipant,
        selectedOptionId,
        submitAnswer,
        playerPointsAwarded,
        playerIsCorrect,
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
