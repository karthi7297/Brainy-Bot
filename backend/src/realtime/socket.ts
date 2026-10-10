import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { gameHub, type LiveEngine, type WSMessage } from './gameHub';
import { verifyPlayerToken } from './playerToken';

interface SessionClient {
  role: 'host' | 'player';
  participantId: number | null;
  engine: LiveEngine;
}

const clients = new Map<WebSocket, SessionClient>();

function parseQuery(url: string): Record<string, string> {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};
  const params = new URLSearchParams(url.slice(queryIndex + 1));
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function connectSession(ws: WebSocket): void {
  const query = parseQuery(ws.url ?? '');

  // Player connections carry a signed player token.
  if (query.token) {
    try {
      const payload = verifyPlayerToken(query.token);
      gameHub.getEngine(payload.sid).then(async (engine) => {
        try {
          await engine.registerPlayer(ws, payload.sub);
          clients.set(ws, { role: 'player', participantId: payload.sub, engine });
          ws.send(JSON.stringify(snapshotMessage(engine, 'player', payload.sub)));
        } catch (error) {
          sendError(ws, error instanceof Error ? error.message : 'Failed to join session');
        }
      });
      return;
    } catch {
      // not a player token; fall through to host handling
    }
  }

  // Host connections carry a normal user token + sessionId.
  void (async () => {
    try {
      const sessionId = Number(query.sessionId);
      if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new Error('Missing or invalid sessionId');
      }
      if (!query.token) {
        throw new Error('Missing token');
      }
      const payload = verifyToken(query.token);

      const engine = await gameHub.getEngine(sessionId);
      if (engine.session.host_id !== payload.sub) {
        ws.close(4003, 'Not the host of this session');
        return;
      }
      engine.registerHost(ws);
      clients.set(ws, { role: 'host', participantId: null, engine });
      ws.send(JSON.stringify(snapshotMessage(engine, 'host', null)));
    } catch (error) {
      sendError(ws, error instanceof Error ? error.message : 'Unauthorized');
    }
  })();
}

function snapshotMessage(engine: LiveEngine, role: 'host' | 'player', participantId: number | null) {
  return {
    event: 'SESSION_STATE',
    data: engine.snapshotFor(role, participantId),
    timestamp: new Date().toISOString(),
  };
}

function sendError(ws: WebSocket, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    const msg: WSMessage = { event: 'SESSION_ERROR', data: { message }, timestamp: new Date().toISOString() };
    ws.send(JSON.stringify(msg));
  }
}

function handleMessage(ws: WebSocket, raw: string): void {
  const client = clients.get(ws);
  if (!client) {
    sendError(ws, 'Not registered');
    return;
  }

  let message: WSMessage;
  try {
    message = JSON.parse(raw) as WSMessage;
  } catch {
    sendError(ws, 'Malformed message');
    return;
  }

  const engine = client.engine;
  const { event, data } = message;

  switch (event) {
    case 'HEARTBEAT':
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'HEARTBEAT', data: { pong: true }, timestamp: new Date().toISOString() }));
      }
      break;

    case 'REQUEST_STATE':
      void engine
        .computeLeaderboard()
        .then((leaderboard) => {
          engine.lastLeaderboard = leaderboard;
          ws.send(JSON.stringify(snapshotMessage(engine, client.role, client.participantId)));
        })
        .catch(() => sendError(ws, 'Could not load state'));
      break;

    case 'SUBMIT_ANSWER':
      if (client.role !== 'player' || client.participantId === null) {
        sendError(ws, 'Only players can submit answers');
        break;
      }
      void (async () => {
        try {
          const { question_id, option_id, response_time_ms } = data as {
            question_id: number;
            option_id: number | null;
            response_time_ms: number;
          };
          await engine.submitAnswer(client.participantId!, {
            question_id,
            option_id: option_id ?? null,
            response_time_ms,
          });
        } catch (error) {
          sendError(ws, error instanceof Error ? error.message : 'Answer rejected');
        }
      })();
      break;

    case 'JOIN_SESSION':
      ws.send(JSON.stringify(snapshotMessage(engine, client.role, client.participantId)));
      break;

    default:
      sendError(ws, `Unknown event: ${String(event)}`);
  }
}

export function initRealtime(server: HttpServer): void {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true,
  });

  wss.on('connection', (ws) => {
    connectSession(ws);

    ws.on('message', (raw) => {
      handleMessage(ws, raw.toString());
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        client.engine.unregister(ws);
        clients.delete(ws);
        setTimeout(() => {
          if (client.engine.clients.size === 0) {
            gameHub.cleanup(client.engine.sessionId, client.engine);
          }
        }, 100);
      }
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  console.log(`[realtime] WebSocket listening on path /ws (origin: ${env.CORS_ORIGIN.join(', ')})`);
}