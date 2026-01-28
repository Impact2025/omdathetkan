import type { WSMessage, WSTypingIndicator } from '@pureliefde/shared';

interface WebSocketWithId extends WebSocket {
  id?: string;
  userId?: string;
}

// ChatRoom Durable Object for WebSocket connections
export class ChatRoom {
  private connections: Map<string, WebSocketWithId> = new Map();
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal broadcast endpoint
    if (url.pathname === '/broadcast') {
      const message = await request.json() as WSMessage;
      this.broadcast(message);
      return new Response('OK');
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Expected WebSocket', { status: 426 });
  }

  private handleWebSocket(request: Request): Response {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocketWithId];

    server.id = crypto.randomUUID();
    server.userId = userId;

    this.state.acceptWebSocket(server);
    this.connections.set(server.id!, server);

    // Notify others that user is online
    this.broadcast({
      type: 'presence:online',
      payload: { userId, lastSeen: new Date() },
      timestamp: Date.now(),
    }, server.id);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocketWithId, message: string) {
    try {
      const data = JSON.parse(message) as WSMessage<WSTypingIndicator>;

      switch (data.type) {
        case 'typing:start':
        case 'typing:stop':
          // Broadcast typing indicator to other users
          this.broadcast({
            type: data.type,
            payload: {
              userId: ws.userId,
              coupleId: data.payload.coupleId,
            },
            timestamp: Date.now(),
          }, ws.id);
          break;

        default:
          // Echo back unknown messages (for debugging)
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Unknown message type' },
            timestamp: Date.now(),
          }));
      }
    } catch {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid message format' },
        timestamp: Date.now(),
      }));
    }
  }

  async webSocketClose(ws: WebSocketWithId) {
    this.connections.delete(ws.id!);

    // Notify others that user is offline
    this.broadcast({
      type: 'presence:offline',
      payload: { userId: ws.userId, lastSeen: new Date() },
      timestamp: Date.now(),
    });
  }

  async webSocketError(ws: WebSocketWithId) {
    this.connections.delete(ws.id!);
  }

  private broadcast(message: WSMessage, excludeId?: string) {
    const messageStr = JSON.stringify(message);

    for (const [id, ws] of this.connections) {
      if (id !== excludeId) {
        try {
          ws.send(messageStr);
        } catch {
          // Connection failed, will be cleaned up by webSocketClose
          this.connections.delete(id);
        }
      }
    }
  }
}
