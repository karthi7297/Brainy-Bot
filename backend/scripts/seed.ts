/**
 * Seeds demo data: a host account and one published quiz.
 *
 *   npm run db:seed
 *
 * Demo login (matches the frontend demo banner):
 *   email    : alex@brainybot.com
 *   password : password123
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

async function main(): Promise<void> {
  const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 5,
  });

  try {
    // --- Demo user ---
    let userRows = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [
      'alex@brainybot.com',
    ]) as unknown as [{ [key: string]: unknown }[], unknown];
    let userId: number;

    if ((userRows[0] as unknown[]).length === 0) {
      const hash = await bcrypt.hash('password123', 10);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        ['Alex Thompson', 'alex@brainybot.com', hash],
      );
      userId = (result as { insertId: number }).insertId;
      console.log(`Created demo user "Alex Thompson" (id=${userId})`);
    } else {
      userId = Number((userRows[0] as unknown as { [key: string]: unknown }[])[0].id);
      console.log(`Demo user already exists (id=${userId})`);
    }

    // --- Demo quiz (skip if one already exists for this owner) ---
    const quizRows = await pool.query(
      'SELECT id FROM quizzes WHERE owner_id = ? AND title = ? LIMIT 1',
      [userId, 'World Geography Challenge'],
    ) as unknown as [{ [key: string]: unknown }[], unknown];

    if ((quizRows[0] as unknown[]).length > 0) {
      console.log('Demo quiz already exists - nothing to do.');
      return;
    }

    const [quizResult] = await pool.execute(
      `INSERT INTO quizzes (owner_id, title, description, visibility, status)
       VALUES (?, ?, ?, 'public', 'published')`,
      [userId, 'World Geography Challenge', 'Test your knowledge of countries, capitals, and landmarks around the world!'],
    );
    const quizId = (quizResult as { insertId: number }).insertId;
    console.log(`Created demo quiz (id=${quizId})`);

    const questions = [
      {
        text: 'What is the capital city of Japan?',
        time: 20,
        points: 1000,
        explanation: 'Tokyo has been the capital of Japan since 1868.',
        options: [
          ['Seoul', 0], ['Tokyo', 1], ['Beijing', 0], ['Bangkok', 0],
        ],
      },
      {
        text: 'The Amazon River is the longest river in the world.',
        type: 'true_false',
        time: 10,
        points: 500,
        explanation: 'The Nile is traditionally considered the longest, though some measurements put the Amazon close.',
        options: [
          ['True', 0], ['False', 1],
        ],
      },
      {
        text: 'What is the smallest country in the world by area?',
        time: 15,
        points: 800,
        explanation: 'Vatican City is only about 44 hectares (110 acres).',
        options: [
          ['Monaco', 0], ['Vatican City', 1], ['San Marino', 0], ['Liechtenstein', 0],
        ],
      },
    ];

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const [qResult] = await pool.execute(
        `INSERT INTO questions
           (quiz_id, question_text, question_type, position, time_limit_seconds, base_points, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          q.text,
          q.type ?? 'multiple_choice',
          i + 1,
          q.time,
          q.points,
          q.explanation,
        ],
      );
      const questionId = (qResult as { insertId: number }).insertId;

      for (let o = 0; o < q.options.length; o += 1) {
        const [text, correct] = q.options[o];
        await pool.execute(
          'INSERT INTO answer_options (question_id, option_text, position, is_correct) VALUES (?, ?, ?, ?)',
          [questionId, text, o + 1, correct],
        );
      }
    }

    console.log(`Demo quiz with ${questions.length} questions created.`);
    console.log('Done. You can now log in with alex@brainybot.com / password123');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed database:', error.message ?? error);
  process.exit(1);
});