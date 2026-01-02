import WebSocket from "ws";
import { EventEmitter } from "node:events";

type AggTrade = {
  e: "aggTrade";
  p: string;
  q: string;
  m: boolean;
  T: number;
};

type DepthUpdate = {
  e: "depthUpdate";
  b: [string, string][];
  a: [string, string][];
  T: number;
};

export class BinanceFuturesWS extends EventEmitter {
  private ws?: WebSocket;

  constructor(private base: string, private symbol: string) {
    super();
  }

  connect() {
    const s = this.symbol.toLowerCase();
    const url = `${this.base}?streams=${s}@aggTrade/${s}@depth@100ms`;
    this.ws = new WebSocket(url);

    this.ws.on("message", (b) => {
      let m: any;
      try {
        m = JSON.parse(b.toString());
      } catch {
        return;
      }
      const data = m?.data;
      if (!data) return;

      if (data.e === "aggTrade") this.emit("aggTrade", data as AggTrade);
      if (data.e === "depthUpdate") this.emit("depth", data as DepthUpdate);
    });

    this.ws.on("open", () => this.emit("log", "Binance WS connected"));
    this.ws.on("error", (e) => this.emit("log", `Binance WS error: ${String(e)}`));
    this.ws.on("close", () => this.emit("log", "Binance WS closed"));
  }

  disconnect() {
    this.ws?.close();
  }
}

