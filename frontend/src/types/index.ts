// ==========================================
// Brainy Bot - Core Types
// ==========================================

// --- User & Auth ---
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// --- Quiz ---
export type QuizVisibility = 'private' | 'public';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface Quiz {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  visibility: QuizVisibility;
  status: QuizStatus;
  cover_image_url?: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

// --- Question ---
export type QuestionType = 'multiple_choice' | 'true_false';

export interface AnswerOption {
  id: number;
  question_id: number;
  option_text: string;
  position: number;
  is_correct: boolean;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: QuestionType;
  position: number;
  time_limit_seconds: number;
  base_points: number;
  image_url?: string;
  explanation?: string;
  options: AnswerOption[];
}

// --- Game Session ---
export type SessionStatus = 'lobby' | 'running' | 'completed' | 'cancelled';
export type GameState =
  | 'lobby'
  | 'question_active'
  | 'question_locked'
  | 'question_results'
  | 'completed'
  | 'cancelled';

export interface GameSession {
  id: number;
  quiz_id: number;
  host_id: number;
  game_pin: string;
  status: SessionStatus;
  current_question_id?: number;
  current_question_index?: number;
  question_started_at?: string;
  question_deadline_at?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  quiz_title: string;
  total_questions: number;
}

// --- Participant ---
export type ParticipantStatus = 'connected' | 'disconnected' | 'removed' | 'finished';

export interface Participant {
  id: number;
  session_id: number;
  nickname: string;
  total_score: number;
  status: ParticipantStatus;
  joined_at: string;
  rank?: number;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
}

// --- Answer Submission ---
export interface AnswerSubmission {
  id: number;
  session_id: number;
  participant_id: number;
  question_id: number;
  selected_option_id: number | null;
  is_correct: boolean;
  points_awarded: number;
  response_time_ms: number;
  submitted_at: string;
}

// --- Question Results ---
export interface OptionDistribution {
  option_id: number;
  option_text: string;
  count: number;
  percentage: number;
  is_correct: boolean;
}

export interface QuestionResult {
  question_id: number;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_participants: number;
  distribution: OptionDistribution[];
  correct_option_id: number;
  correct_option_text: string;
}

// --- Leaderboard ---
export interface LeaderboardEntry {
  rank: number;
  participant_id: number;
  nickname: string;
  total_score: number;
  correct_count: number;
  streak: number;
}

// --- Report ---
export interface SessionReport {
  session_id: number;
  quiz_title: string;
  host_name: string;
  started_at: string;
  ended_at: string;
  participant_count: number;
  total_questions: number;
  average_accuracy: number;
  participants: Participant[];
  question_results: QuestionResult[];
}

// --- WebSocket Events ---
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

// --- Navigation ---
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}
