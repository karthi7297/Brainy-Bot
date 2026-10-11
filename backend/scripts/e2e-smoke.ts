/**
 * End-to-end smoke test for the live game loop.
 * Drives the running backend (http://localhost:4000) as a host + a player.
 *
 *   npx tsx scripts/e2e-smoke.ts
 */
import WebSocket from 'ws';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function api(path: string, opts: { method?: string; body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, json };
}

class TestClient {
  ws!: WebSocket;
  events: Array<{ event: string; data: any }> = [];
  private resolveWaiters: Array<(e: { event: string; data: any }) => void> = [];

  connect(query: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:4000/ws?${query}`);
      this.ws.on('open', () => resolve());
      this.ws.on('error', reject);
      this.ws.on('message', (raw) => {
        const msg = JSON.parse(String(raw));
        this.events.push(msg);
        const waiters = this.resolveWaiters.splice(0);
        for (const w of waiters) w(msg);
      });
    });
  }

  waitFor(event: string, timeoutMs = 8000): Promise<{ event: string; data: any }> {
    const existing = this.events.find((e) => e.event === event);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${event}. Received: ${this.events.map((e) => `${e.event}${e.data?.message ? `(${e.data.message})` : ''}`).join(', ') || '(none)'}`));
      }, timeoutMs);
      const handler = (msg: { event: string; data: any }) => {
        if (msg.event === event) {
          clearTimeout(timer);
          this.ws.off('message', handler);
          resolve(msg);
        }
      };
      this.ws.on('message', (raw) => handler(JSON.parse(String(raw))));
    });
  }

  send(event: string, data: unknown): void {
    this.ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
  }

  close(): void {
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  console.log('--- Brainy Bot E2E smoke test ---');

  // 1. Health
  const health = await api('/api/health');
  if (health.status !== 200) throw new Error('Health check failed');
  console.log('[ok] health');

  // 2. Login as demo host
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'alex@brainybot.com', password: 'password123' },
  });
  if (login.status !== 200) throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.json)}`);
  const hostToken = login.json.token as string;
  console.log('[ok] login as host', login.json.user.email);

  // 3. Ensure a host quiz with questions exists
  const quizzes = await api('/api/quizzes', { token: hostToken });
  let quiz = (quizzes.json.quizzes as any[]).find((q) => q.question_count > 0);
  if (!quiz) {
    // Create one on the fly.
    const created = await api('/api/quizzes', {
      method: 'POST',
      token: hostToken,
      body: { title: 'E2E Smoke Quiz', description: 'auto', visibility: 'public' },
    });
    quiz = created.json.quiz;
    await api(`/api/quizzes/${quiz.id}/questions`, {
      method: 'POST',
      token: hostToken,
      body: {
        question_text: 'What is 2 + 2?',
        question_type: 'multiple_choice',
        time_limit_seconds: 30,
        base_points: 1000,
        options: [
          { option_text: '3', position: 1, is_correct: false },
          { option_text: '4', position: 2, is_correct: true },
          { option_text: '5', position: 3, is_correct: false },
          { option_text: '6', position: 4, is_correct: false },
        ],
      },
    });
    await api(`/api/quizzes/${quiz.id}/publish`, { method: 'POST', token: hostToken });
  }
  console.log('[ok] host quiz ready:', quiz.id, quiz.title);

  // 4. Host creates a session
  const createRes = await api('/api/sessions', { method: 'POST', token: hostToken, body: { quiz_id: quiz.id } });
  if (createRes.status !== 201) throw new Error(`Create session failed: ${JSON.stringify(createRes.json)}`);
  const session = createRes.json.session;
  console.log('[ok] session created, pin =', session.game_pin);

  // 5. Player joins via PIN
  const joinRes = await api('/api/sessions/join', {
    method: 'POST',
    body: { pin: session.game_pin, nickname: 'SmokeTester' },
  });
  if (joinRes.status !== 201) throw new Error(`Join failed: ${JSON.stringify(joinRes.json)}`);
  const playerToken = joinRes.json.token as string;
  const playerId = joinRes.json.participant.id;
  console.log('[ok] player joined, id =', playerId);

  // 6. Connect host + player sockets
  const host = new TestClient();
  await host.connect(`token=${encodeURIComponent(hostToken)}&sessionId=${session.id}`);
  await host.waitFor('SESSION_STATE');
  console.log('[ok] host WS connected + snapshot');

  const player = new TestClient();
  await player.connect(`token=${encodeURIComponent(playerToken)}`);
  await player.waitFor('SESSION_STATE');
  console.log('[ok] player WS connected + snapshot');

  // 7. Host starts the game
  const startRes = await api(`/api/sessions/${session.id}/start`, { method: 'POST', token: hostToken });
  if (startRes.status !== 200) throw new Error(`Start failed: ${JSON.stringify(startRes.json)}`);
  console.log('[ok] game started');

  const playerQ = await player.waitFor('QUESTION_STARTED');
  const question = playerQ.data.question;
  if (!question) throw new Error('Player did not receive a question');
  // For players the correct answer must be hidden.
  const leaked = (question.options as any[]).some((o) => o.is_correct === true);
  if (leaked) throw new Error('SECURITY: correct answer leaked to player');
  console.log(`[ok] QUESTION_STARTED q#1 "${question.question_text}" (${question.options.length} options, correct hidden)`);

  // Player picks the correct option (id known from REST quiz detail).
  const detail = await api(`/api/quizzes/${quiz.id}`, { token: hostToken });
  const correctOptionId = (detail.json.quiz.questions[0].options as any[]).find((o) => o.is_correct)?.id;

  player.send('SUBMIT_ANSWER', {
    question_id: question.id,
    option_id: correctOptionId,
    response_time_ms: 1200,
  });
  const ack = await player.waitFor('ANSWER_RECEIVED');
  if (ack.data.is_correct !== true) throw new Error('Expected correct answer ack');
  console.log('[ok] SUBMIT_ANSWER -> ANSWER_RECEIVED correct, points =', ack.data.points_awarded);

  // 8. Lock the question (host) -> results + leaderboard
  const lockRes = await api(`/api/sessions/${session.id}/lock`, { method: 'POST', token: hostToken });
  if (lockRes.status !== 200) throw new Error(`Lock failed: ${JSON.stringify(lockRes.json)}`);
  const results = await player.waitFor('QUESTION_RESULTS');
  const correctCount = results.data.question_result.correct_count;
  if (correctCount !== 1) throw new Error(`Expected 1 correct, got ${correctCount}`);
  console.log('[ok] QUESTION_RESULTS correct_count =', correctCount);

  const lb = await player.waitFor('LEADERBOARD_UPDATED');
  const top = lb.data.leaderboard[0];
  if (top.total_score <= 0) throw new Error('Leaderboard score not awarded');
  console.log('[ok] LEADERBOARD_UPDATED top =', top.nickname, top.total_score, 'pts, rank', top.rank);

  // 9. End the game
  const endRes = await api(`/api/sessions/${session.id}/end`, { method: 'POST', token: hostToken });
  if (endRes.status !== 200) throw new Error(`End failed: ${JSON.stringify(endRes.json)}`);
  await player.waitFor('GAME_COMPLETED');
  console.log('[ok] GAME_COMPLETED');

  // 10. Host report
  const report = await api(`/api/reports/${session.id}`, { token: hostToken });
  if (report.status !== 200) throw new Error(`Report failed: ${JSON.stringify(report.json)}`);
  const r = report.json.report;
  console.log(
    `[ok] report: participants=${r.participant_count} accuracy=${r.average_accuracy}% top=${r.participants[0].nickname} score=${r.participants[0].total_score}`,
  );

  host.close();
  player.close();
  console.log('\n--- ALL E2E CHECKS PASSED ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n--- E2E FAILED ---');
  console.error(err);
  process.exit(1);
});
