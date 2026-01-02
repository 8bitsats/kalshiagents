import WebSocket from "ws";
import { EventEmitter } from "node:events";

type BookMsg = {
  event_type: "book";
  asset_id: string;
  market: string;
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  timestamp: string;
  hash: string;
};

type TickMsg = {
  event_type: "tick_size_change";
  asset_id: string;
  tick_size: string;
};

type BestMsg = {
  event_type: "best_bid_ask";
  asset_id: string;
  best_bid: string;
  best_ask: string;
  timestamp: string;
};

export class PolymarketMarketWS extends EventEmitter {
  private ws?: WebSocket;
  private lastRxAt?: number;

  constructor(private readonly url: string) {
    super();
  }

  connect(assetIds: string[]) {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", () => {
      const sub = {
        type: "MARKET",
        asset_ids: assetIds,
        assets_ids: assetIds,
        custom_feature_enabled: false,
      };
      this.ws?.send(JSON.stringify(sub));
      this.emit("log", `Connecting WS for tokens: ${assetIds.join(", ")}`);
    });

    this.ws.on("message", (buf) => {
      this.lastRxAt = Date.now();
      let msg: any;
      try {
        msg = JSON.parse(buf.toString());
      } catch {
        return;
      }

      if (msg?.event_type === "book") this.emit("book", msg as BookMsg);
      if (msg?.event_type === "tick_size_change") this.emit("tick", msg as TickMsg);
      if (msg?.event_type === "best_bid_ask") this.emit("best", msg as BestMsg);
    });

    this.ws.on("close", () => this.emit("log", "WS closed"));
    this.ws.on("error", (e) => this.emit("log", `WS error: ${String(e)}`));

    const interval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const age = this.lastRxAt ? Date.now() - this.lastRxAt : Infinity;
      if (age > 30_000) {
        this.emit("log", `WS stale (${Math.round(age / 1000)}s without messages)`);
      }
    }, 5_000);

    this.ws.on("close", () => clearInterval(interval));
  }

  switchAssets(prev: string[], next: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ operation: "unsubscribe", asset_ids: prev, assets_ids: prev }));
    this.ws.send(JSON.stringify({ operation: "subscribe", asset_ids: next, assets_ids: next }));
  }
}

