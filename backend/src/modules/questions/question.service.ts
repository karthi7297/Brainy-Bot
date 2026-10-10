import type { RowDataPacket } from 'mysql2/promise';
import { execute, query, withTransaction } from '../../db/mysql';
import type { OptionRow, QuestionRow } from '../../db/models';
import { HttpError } from '../../utils/HttpError';
import type { CreateQuestionInput, UpdateQuestionInput } from './question.schemas';

async function assertQuizOwnership(quizId: number, userId: number): Promise<void> {
  const rows = await query<RowDataPacket[]>(
    'SELECT id FROM quizzes WHERE id = ? AND owner_id = ? LIMIT 1',
    [quizId, userId],
  );
  if (rows.length === 0) {
    throw HttpError.notFound('Quiz not found or you do not own it');
  }
}

async function assertQuestionOwnership(questionId: number, userId: number): Promise<QuestionRow> {
  const rows = await query<QuestionRow[]>(
    'SELECT q.* FROM questions q JOIN quizzes z ON z.id = q.quiz_id WHERE q.id = ? AND z.owner_id = ? LIMIT 1',
    [questionId, userId],
  );
  if (rows.length === 0) {
    throw HttpError.notFound('Question not found or you do not own it');
  }
  return rows[0];
}

function nextPosition(quizId: number): Promise<number> {
  return query<RowDataPacket[]>(
    'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM questions WHERE quiz_id = ?',
    [quizId],
  ).then((rows) => Number(rows[0].next_pos));
}

export async function addQuestion(quizId: number, userId: number, data: CreateQuestionInput) {
  await assertQuizOwnership(quizId, userId);
  const position = await nextPosition(quizId);

  return withTransaction(async (tx) => {
    const insert = await tx.execute(
      `INSERT INTO questions
         (quiz_id, question_text, question_type, position, time_limit_seconds, base_points, image_url, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quizId,
        data.question_text,
        data.question_type,
        position,
        data.time_limit_seconds,
        data.base_points,
        data.image_url || null,
        data.explanation || null,
      ],
    );
    const questionId = insert.insertId;

    let optPosition = 1;
    for (const opt of data.options) {
      await tx.execute(
        'INSERT INTO answer_options (question_id, option_text, position, is_correct) VALUES (?, ?, ?, ?)',
        [questionId, opt.option_text, opt.position ?? optPosition, opt.is_correct ? 1 : 0],
      );
      optPosition += 1;
    }

    const rows = await tx.query<QuestionRow[]>(
      'SELECT * FROM questions WHERE id = ? LIMIT 1',
      [questionId],
    );
    const optionRows = await tx.query<OptionRow[]>(
      'SELECT * FROM answer_options WHERE question_id = ? ORDER BY position ASC, id ASC',
      [questionId],
    );
    return { ...rows[0], options: optionRows };
  });
}

export async function updateQuestion(questionId: number, userId: number, data: UpdateQuestionInput) {
  await assertQuestionOwnership(questionId, userId);

  return withTransaction(async (tx) => {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (data.question_text !== undefined) { fields.push('question_text = ?'); params.push(data.question_text); }
    if (data.question_type !== undefined) { fields.push('question_type = ?'); params.push(data.question_type); }
    if (data.time_limit_seconds !== undefined) { fields.push('time_limit_seconds = ?'); params.push(data.time_limit_seconds); }
    if (data.base_points !== undefined) { fields.push('base_points = ?'); params.push(data.base_points); }
    if (data.image_url !== undefined) { fields.push('image_url = ?'); params.push(data.image_url || null); }
    if (data.explanation !== undefined) { fields.push('explanation = ?'); params.push(data.explanation || null); }
    if (data.position !== undefined) { fields.push('position = ?'); params.push(data.position); }

    if (fields.length > 0) {
      await tx.execute(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`, [...params, questionId]);
    }

    if (data.options) {
      await tx.execute('DELETE FROM answer_options WHERE question_id = ?', [questionId]);
      let optPosition = 1;
      for (const opt of data.options) {
        await tx.execute(
          'INSERT INTO answer_options (question_id, option_text, position, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, opt.option_text, opt.position ?? optPosition, opt.is_correct ? 1 : 0],
        );
        optPosition += 1;
      }
    }

    const rows = await tx.query<QuestionRow[]>(
      'SELECT * FROM questions WHERE id = ? LIMIT 1',
      [questionId],
    );
    const optionRows = await tx.query<OptionRow[]>(
      'SELECT * FROM answer_options WHERE question_id = ? ORDER BY position ASC, id ASC',
      [questionId],
    );
    return { ...rows[0], options: optionRows };
  });
}

export async function deleteQuestion(questionId: number, userId: number): Promise<void> {
  await assertQuestionOwnership(questionId, userId);
  await execute('DELETE FROM questions WHERE id = ?', [questionId]);
}

export async function reorderQuestions(quizId: number, userId: number, order: number[]): Promise<void> {
  await assertQuizOwnership(quizId, userId);

  const rows = await query<RowDataPacket[]>(
    'SELECT id FROM questions WHERE quiz_id = ?',
    [quizId],
  );
  const existingIds = new Set(rows.map((r) => Number(r.id)));
  if (order.length !== existingIds.size || order.some((id) => !existingIds.has(id))) {
    throw HttpError.badRequest('Order must contain exactly the question ids of this quiz');
  }

  return withTransaction(async (tx) => {
    for (let i = 0; i < order.length; i += 1) {
      await tx.execute('UPDATE questions SET position = ? WHERE id = ? AND quiz_id = ?', [
        i + 1,
        order[i],
        quizId,
      ]);
    }
  });
}

export async function getQuestionsForSession(quizId: number) {
  const questionRows = await query<QuestionRow[]>(
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC, id ASC',
    [quizId],
  );
  const ids = questionRows.map((q) => q.id);
  const optionRows = ids.length > 0
    ? await query<OptionRow[]>(
        `SELECT * FROM answer_options WHERE question_id IN (${ids.map(() => '?').join(',')}) ORDER BY position ASC, id ASC`,
        ids,
      )
    : [];

  const optionsByQuestion = new Map<number, OptionRow[]>();
  for (const opt of optionRows) {
    const list = optionsByQuestion.get(opt.question_id) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.question_id, list);
  }

  return questionRows.map((q) => ({ ...q, options: optionsByQuestion.get(q.id) ?? [] }));
}