import type { RowDataPacket } from 'mysql2/promise';
import { execute, query, withTransaction } from '../../db/mysql';
import { mapQuestion, mapQuiz, mapOption, type OptionRow, type QuestionRow, type QuizRow } from '../../db/models';
import { HttpError } from '../../utils/HttpError';

export type Visibility = 'private' | 'public';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface QuizInput {
  title?: string;
  description?: string;
  visibility?: Visibility;
  cover_image_url?: string | null;
}

async function assertQuizOwnership(quizId: number, userId: number): Promise<QuizRow> {
  const rows = await query<QuizRow[]>(
    `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
     FROM quizzes q WHERE q.id = ? LIMIT 1`,
    [quizId],
  );
  if (rows.length === 0) {
    throw HttpError.notFound('Quiz not found');
  }
  if (rows[0].owner_id !== userId) {
    throw HttpError.forbidden('You do not own this quiz');
  }
  return rows[0];
}

export async function listQuizzes(
  userId: number,
  opts: { scope?: 'mine' | 'public'; search?: string; status?: QuizStatus; visibility?: Visibility } = {},
): Promise<QuizRow[]> {
  const { scope = 'mine', search = '', status, visibility } = opts;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (scope === 'public') {
    conditions.push("q.visibility = 'public'");
    conditions.push("q.status = 'published'");
  } else {
    conditions.push('q.owner_id = ?');
    params.push(userId);
  }

  if (status) {
    conditions.push('q.status = ?');
    params.push(status);
  }
  if (visibility) {
    conditions.push('q.visibility = ?');
    params.push(visibility);
  }
  if (search) {
    conditions.push('(q.title LIKE ? OR q.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const sql = `
    SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
    FROM quizzes q
    WHERE ${conditions.join(' AND ')}
    ORDER BY q.updated_at DESC`;
  return query<QuizRow[]>(sql, params);
}

export async function createQuiz(userId: number, data: QuizInput): Promise<QuizRow> {
  const title = data.title ?? 'Untitled Quiz';
  const description = data.description ?? '';
  const visibility = data.visibility ?? 'private';
  const coverImage = data.cover_image_url || null;

  const result = await execute(
    'INSERT INTO quizzes (owner_id, title, description, visibility, cover_image_url) VALUES (?, ?, ?, ?, ?)',
    [userId, title, description, visibility, coverImage],
  );

  const rows = await query<QuizRow[]>(
    'SELECT q.*, 0 AS question_count FROM quizzes q WHERE q.id = ? LIMIT 1',
    [result.insertId],
  );
  return rows[0];
}

export async function getQuiz(row: QuizRow) {
  return mapQuiz(row);
}

export async function getQuizDetail(quizId: number, userId?: number) {
  const rows = await query<QuizRow[]>(
    `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
     FROM quizzes q WHERE q.id = ? LIMIT 1`,
    [quizId],
  );
  if (rows.length === 0) {
    throw HttpError.notFound('Quiz not found');
  }
  const quizRow = rows[0];

  const isOwner = userId !== undefined && quizRow.owner_id === userId;
  const isPublicPublished =
    quizRow.visibility === 'public' && quizRow.status === 'published';

  if (!isOwner && !isPublicPublished) {
    throw HttpError.forbidden('This quiz is not available');
  }

  const questionRows = await query<QuestionRow[]>(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC, id ASC',
    [quizId],
  );

  const optionsByQuestion = new Map<number, OptionRow[]>();
  if (questionRows.length > 0) {
    const ids = questionRows.map((q) => q.id);
    const optionRows = await query<OptionRow[]>(
      `SELECT * FROM answer_options WHERE question_id IN (${ids.map(() => '?').join(',')}) ORDER BY position ASC, id ASC`,
      ids,
    );
    for (const opt of optionRows) {
      const list = optionsByQuestion.get(opt.question_id) ?? [];
      list.push(opt);
      optionsByQuestion.set(opt.question_id, list);
    }
  }

  const questions = questionRows.map((q) => {
    const opts = optionsByQuestion.get(q.id) ?? [];
    const question = mapQuestion(q, opts);
    if (!isOwner) {
      // Never leak correct answers to non-owners.
      question.options = question.options.map((o) => ({ ...o, is_correct: false }));
    }
    return question;
  });

  return { ...mapQuiz(quizRow), questions };
}

export async function updateQuiz(quizId: number, userId: number, data: QuizInput): Promise<QuizRow> {
  const existing = await assertQuizOwnership(quizId, userId);

  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.visibility !== undefined) { fields.push('visibility = ?'); params.push(data.visibility); }
  if (data.cover_image_url !== undefined) { fields.push('cover_image_url = ?'); params.push(data.cover_image_url || null); }

  if (fields.length > 0) {
    await execute(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`, [...params, quizId]);
  }

  const rows = await query<QuizRow[]>(
    `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
     FROM quizzes q WHERE q.id = ? LIMIT 1`,
    [quizId],
  );
  return { ...rows[0], ...(existing.owner_id !== undefined ? {} : {}) };
}

export async function setQuizStatus(quizId: number, userId: number, status: QuizStatus): Promise<QuizRow> {
  await assertQuizOwnership(quizId, userId);
  await execute('UPDATE quizzes SET status = ? WHERE id = ?', [status, quizId]);

  const rows = await query<QuizRow[]>(
    `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
     FROM quizzes q WHERE q.id = ? LIMIT 1`,
    [quizId],
  );
  return rows[0];
}

export async function deleteQuiz(quizId: number, userId: number): Promise<void> {
  await assertQuizOwnership(quizId, userId);
  await execute('DELETE FROM quizzes WHERE id = ?', [quizId]);
}

export async function duplicateQuiz(quizId: number, userId: number): Promise<QuizRow> {
  const source = await assertQuizOwnership(quizId, userId);

  return withTransaction(async (tx) => {
    const insert = await tx.execute(
      `INSERT INTO quizzes (owner_id, title, description, visibility, status, cover_image_url)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
      [
        userId,
        `${source.title} (copy)`,
        source.description,
        source.visibility,
        source.cover_image_url,
      ],
    );
    const newQuizId = insert.insertId;

    const questionRows = await tx.query<QuestionRow[]>(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC, id ASC',
      [quizId],
    );

    for (const q of questionRows) {
      const qInsert = await tx.execute(
        `INSERT INTO questions (quiz_id, question_text, question_type, position, time_limit_seconds, base_points, image_url, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newQuizId,
          q.question_text,
          q.question_type,
          q.position,
          q.time_limit_seconds,
          q.base_points,
          q.image_url,
          q.explanation,
        ],
      );
      const newQuestionId = qInsert.insertId;

      const optionRows = await tx.query<OptionRow[]>(
        'SELECT * FROM answer_options WHERE question_id = ? ORDER BY position ASC, id ASC',
        [q.id],
      );
      for (const o of optionRows) {
        await tx.execute(
          'INSERT INTO answer_options (question_id, option_text, position, is_correct) VALUES (?, ?, ?, ?)',
          [newQuestionId, o.option_text, o.position, o.is_correct],
        );
      }
    }

    const rows = await tx.query<QuizRow[]>(
      `SELECT q.*, (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
       FROM quizzes q WHERE q.id = ? LIMIT 1`,
      [newQuizId],
    );
    return rows[0];
  });
}