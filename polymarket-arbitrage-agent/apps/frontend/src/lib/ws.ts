import type { FusedState, StrategyDecision } from "./api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";

export type TickMessage = {
  type: "tick";
  state: FusedState;
  decision: StrategyDecision | null;
  risk: {
    flags: string[];
    killSwitch: boolean;
  };
  proposals?: Array<any>;
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private listeners: Set<(msg: TickMessage) => void> = new Set();
  private onConnectListeners: Set<() => void> = new Set();
  private onDisconnectListeners: Set<() => void> = new Set();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        this.onConnectListeners.forEach((cb) => cb());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "tick") {
            this.listeners.forEach((cb) => cb(data as TickMessage));
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.onDisconnectListeners.forEach((cb) => cb());
        this.attemptReconnect();
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onTick(callback: (msg: TickMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onConnect(callback: () => void) {
    this.onConnectListeners.add(callback);
    return () => this.onConnectListeners.delete(callback);
  }

  onDisconnect(callback: () => void) {
    this.onDisconnectListeners.add(callback);
    return () => this.onDisconnectListeners.delete(callback);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();

