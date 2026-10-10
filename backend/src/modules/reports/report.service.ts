import type { RowDataPacket } from 'mysql2/promise';
import { query } from '../../db/mysql';
import { findSessionById } from '../sessions/session.service';
import { getQuestionsForSession } from '../questions/question.service';
import { HttpError } from '../../utils/HttpError';

interface QuestionResult {
  question_id: number;
  question_text: string;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_participants: number;
  distribution: {
    option_id: number;
    option_text: string;
    count: number;
    percentage: number;
    is_correct: boolean;
  }[];
  correct_option_id: number | null;
  correct_option_text: string;
}

interface ParticipantStanding {
  id: number;
  nickname: string;
  total_score: number;
  status: string;
  joined_at: string;
  rank: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
}

export interface SessionReport {
  session_id: number;
  quiz_title: string;
  host_name: string;
  started_at: string | null;
  ended_at: string | null;
  participant_count: number;
  total_questions: number;
  average_accuracy: number;
  participants: ParticipantStanding[];
  question_results: QuestionResult[];
}

function toIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export async function getSessionReport(sessionId: number): Promise<SessionReport> {
  const session = await findSessionById(sessionId);
  if (!session) throw HttpError.notFound('Session not found');

  const hostRows = await query<RowDataPacket[]>(
    'SELECT name FROM users WHERE id = ? LIMIT 1',
    [session.host_id],
  );
  const hostName = hostRows[0]?.name ?? 'Unknown host';

  const questions = await getQuestionsForSession(session.quiz_id);
  const totalQuestions = questions.length;

  const participantRows = await query<RowDataPacket[]>(
    `SELECT p.id, p.nickname, p.total_score, p.status, p.joined_at,
            COUNT(CASE WHEN a.is_correct = 1 THEN 1 END) AS correct_count,
            COUNT(CASE WHEN a.is_correct = 0 THEN 1 END) AS incorrect_count
     FROM participants p
     LEFT JOIN answer_submissions a ON a.participant_id = p.id AND a.session_id = p.session_id
     WHERE p.session_id = ?
     GROUP BY p.id
     ORDER BY p.total_score DESC, p.id ASC`,
    [sessionId],
  );

  const participants: ParticipantStanding[] = participantRows.map((row, index) => {
    const correct = Number(row.correct_count);
    const incorrect = Number(row.incorrect_count);
    return {
      id: Number(row.id),
      nickname: row.nickname as string,
      total_score: Number(row.total_score),
      status: row.status as string,
      joined_at: toIso(row.joined_at) ?? '',
      rank: index + 1,
      correct_count: correct,
      incorrect_count: incorrect,
      unanswered_count: Math.max(0, totalQuestions - correct - incorrect),
    };
  });

  const participantCount = participants.length;
  const questionResults: QuestionResult[] = [];

  for (const question of questions) {
    const answerRows = await query<RowDataPacket[]>(
      `SELECT a.selected_option_id, a.is_correct, COUNT(*) AS cnt
       FROM answer_submissions a
       WHERE a.session_id = ? AND a.question_id = ?
       GROUP BY a.selected_option_id, a.is_correct`,
      [sessionId, question.id],
    );

    const countByOption = new Map<number, number>();
    let correctCount = 0;
    let answeredCount = 0;
    for (const row of answerRows) {
      const optionId = row.selected_option_id === null ? null : Number(row.selected_option_id);
      const count = Number(row.cnt);
      if (optionId !== null) {
        countByOption.set(optionId, (countByOption.get(optionId) ?? 0) + count);
      }
      if (Number(row.is_correct) === 1) correctCount += count;
      answeredCount += count;
    }

    const correctOption = question.options.find((o) => o.is_correct);
    const distribution = question.options.map((option) => {
      const count = countByOption.get(option.id) ?? 0;
      return {
        option_id: option.id,
        option_text: option.option_text,
        count,
        percentage: participantCount > 0 ? Math.round((count / participantCount) * 1000) / 10 : 0,
        is_correct: Boolean(option.is_correct),
      };
    });

    questionResults.push({
      question_id: question.id,
      question_text: question.question_text,
      correct_count: correctCount,
      incorrect_count: answeredCount - correctCount,
      unanswered_count: Math.max(0, participantCount - answeredCount),
      total_participants: participantCount,
      distribution,
      correct_option_id: correctOption?.id ?? null,
      correct_option_text: correctOption?.option_text ?? '',
    });
  }

  const totalAnswered = participants.reduce(
    (sum, p) => sum + p.correct_count + p.incorrect_count,
    0,
  );
  const totalCorrect = participants.reduce((sum, p) => sum + p.correct_count, 0);
  const averageAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 1000) / 10 : 0;

  return {
    session_id: session.id,
    quiz_title: session.quiz_title ?? '',
    host_name: hostName,
    started_at: toIso(session.started_at),
    ended_at: toIso(session.ended_at),
    participant_count: participantCount,
    total_questions: totalQuestions,
    average_accuracy: averageAccuracy,
    participants,
    question_results: questionResults,
  };
}