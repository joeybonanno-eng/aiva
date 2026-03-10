import type { WSMessage } from "@/types";

type MessageHandler = (message: WSMessage) => void;

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/alerts";

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_BACKOFF_MULTIPLIER = 2;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private globalListeners: Set<MessageHandler> = new Set();
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose: boolean = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect(token: string): void {
    this.token = token;
    this.isIntentionalClose = false;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.createConnection();
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.cleanup();
  }

  private createConnection(): void {
    if (typeof window === "undefined") return;

    this.cleanup();

    const url = `${WS_URL}?token=${encodeURIComponent(this.token || "")}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;

      // Send keepalive pings every 30 seconds
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({ type: "ping", payload: {} });
        }
      }, 30000);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      let message: WSMessage;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      // Skip pong responses
      if (message.type === "pong") return;

      // Notify global listeners
      this.globalListeners.forEach((handler) => {
        try {
          handler(message);
        } catch (err) {
          console.error("[WS] Global listener error:", err);
        }
      });

      // Notify type-specific listeners
      const typeListeners = this.listeners.get(message.type);
      if (typeListeners) {
        typeListeners.forEach((handler) => {
          try {
            handler(message);
          } catch (err) {
            console.error(`[WS] Listener error for type "${message.type}":`, err);
          }
        });
      }
    };

    this.ws.onclose = () => {
      this.clearPingInterval();
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, reconnection handled there
    };
  }

  private scheduleReconnect(): void {
    if (this.isIntentionalClose) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, this.reconnectDelay);

    // Exponential backoff with cap
    this.reconnectDelay = Math.min(
      this.reconnectDelay * RECONNECT_BACKOFF_MULTIPLIER,
      MAX_RECONNECT_DELAY
    );
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private cleanup(): void {
    this.clearPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  send(message: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Subscribe to messages of a specific type.
   * Returns an unsubscribe function.
   */
  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(handler);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to all messages regardless of type.
   * Returns an unsubscribe function.
   */
  onAnyMessage(handler: MessageHandler): () => void {
    this.globalListeners.add(handler);
    return () => {
      this.globalListeners.delete(handler);
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
