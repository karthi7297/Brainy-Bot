import type { RowDataPacket } from 'mysql2/promise';

// ======================================================
// Raw DB row shapes (snake_case, matching the SQL schema)
// ======================================================

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuizRow extends RowDataPacket {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  visibility: 'private' | 'public';
  status: 'draft' | 'published' | 'archived';
  cover_image_url: string | null;
  created_at: Date;
  updated_at: Date;
  question_count?: number;
}

export interface QuestionRow extends RowDataPacket {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  position: number;
  time_limit_seconds: number;
  base_points: number;
  image_url: string | null;
  explanation: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OptionRow extends RowDataPacket {
  id: number;
  question_id: number;
  option_text: string;
  position: number;
  is_correct: number | boolean;
  created_at: Date;
}

export interface SessionRow extends RowDataPacket {
  id: number;
  quiz_id: number;
  host_id: number;
  game_pin: string;
  status: 'lobby' | 'running' | 'completed' | 'cancelled';
  current_question_id: number | null;
  current_question_index: number;
  question_started_at: Date | null;
  question_deadline_at: Date | null;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  quiz_title?: string;
  total_questions?: number;
}

export interface ParticipantRow extends RowDataPacket {
  id: number;
  session_id: number;
  nickname: string;
  total_score: number;
  status: 'connected' | 'disconnected' | 'removed' | 'finished';
  joined_at: Date;
  left_at: Date | null;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
}

export interface AnswerRow extends RowDataPacket {
  id: number;
  session_id: number;
  participant_id: number;
  question_id: number;
  selected_option_id: number | null;
  is_correct: number | boolean;
  points_awarded: number;
  response_time_ms: number;
  submitted_at: Date;
}

// ======================================================
// Mappers -> API DTOs (snake_case, matching the frontend types)
// ======================================================

export function toIso(value: Date | string | null): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: toIso(row.created_at),
  };
}

export function mapQuiz(row: QuizRow) {
  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    description: row.description ?? '',
    visibility: row.visibility,
    status: row.status,
    cover_image_url: row.cover_image_url ?? undefined,
    question_count: Number(row.question_count ?? 0),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export function mapOption(row: OptionRow) {
  return {
    id: row.id,
    question_id: row.question_id,
    option_text: row.option_text,
    position: row.position,
    is_correct: Boolean(row.is_correct),
  };
}

export function mapQuestion(row: QuestionRow, options: OptionRow[]) {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    question_text: row.question_text,
    question_type: row.question_type,
    position: row.position,
    time_limit_seconds: row.time_limit_seconds,
    base_points: row.base_points,
    image_url: row.image_url ?? undefined,
    explanation: row.explanation ?? undefined,
    options: options.map(mapOption),
  };
}

export function mapSession(row: SessionRow) {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    host_id: row.host_id,
    game_pin: row.game_pin,
    status: row.status,
    current_question_id: row.current_question_id ?? undefined,
    current_question_index: row.current_question_index,
    question_started_at: toIso(row.question_started_at) ?? undefined,
    question_deadline_at: toIso(row.question_deadline_at) ?? undefined,
    started_at: toIso(row.started_at) ?? undefined,
    ended_at: toIso(row.ended_at) ?? undefined,
    created_at: toIso(row.created_at),
    quiz_title: row.quiz_title ?? '',
    total_questions: Number(row.total_questions ?? 0),
  };
}

export function mapParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    session_id: row.session_id,
    nickname: row.nickname,
    total_score: row.total_score,
    status: row.status,
    joined_at: toIso(row.joined_at),
    correct_count: row.correct_count !== undefined ? Number(row.correct_count) : undefined,
    incorrect_count: row.incorrect_count !== undefined ? Number(row.incorrect_count) : undefined,
    unanswered_count: row.unanswered_count !== undefined ? Number(row.unanswered_count) : undefined,
  };
}
