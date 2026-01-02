import fs from "node:fs";
import path from "node:path";
import type { FusedState } from "../../../packages/types/src/fused.js";

export type Snapshot = {
  type: "tick";
  t: number;
  roundId: string;
  secRemaining: number;
  upToken: string;
  downToken: string;
  upAsk: number;
  downAsk: number;
  upBid: number;
  downBid: number;
  strategy?: {
    name: string;
    phase?: string;
    leg1?: any;
    leg2?: any;
  };
};

export type TradeEvent = {
  type: "trade";
  t: number;
  roundId: string;
  strategy: string;
  leg: 1 | 2;
  side: "UP" | "DOWN";
  shares: number;
  px: number;
  reason?: string;
};

export class Recorder {
  private stream?: fs.WriteStream;
  private isRecording = false;

  constructor(private dir = "./data") {
    fs.mkdirSync(dir, { recursive: true });
  }

  private filePathForDay(t: number): string {
    const d = new Date(t);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return path.join(this.dir, `snapshots-${y}-${m}-${day}.ndjson`);
  }

  start() {
    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
    this.stream?.end();
    this.stream = undefined;
  }

  write(state: FusedState, strategyState?: any) {
    if (!this.isRecording) return;

    const s: Snapshot = {
      type: "tick",
      t: state.ts,
      roundId: state.pm.roundId,
      secRemaining: state.pm.secondsRemaining,
      upToken: state.pm.up.tokenId,
      downToken: state.pm.down.tokenId,
      upAsk: state.pm.up.ask,
      downAsk: state.pm.down.ask,
      upBid: state.pm.up.bid,
      downBid: state.pm.down.bid,
      strategy: strategyState
        ? {
            name: strategyState.name || "unknown",
            phase: strategyState.phase,
            leg1: strategyState.leg1,
            leg2: strategyState.leg2,
          }
        : undefined,
    };

    const fp = this.filePathForDay(s.t);
    if (!this.stream || (this.stream.path as string) !== fp) {
      this.stream?.end();
      this.stream = fs.createWriteStream(fp, { flags: "a" });
    }
    this.stream.write(JSON.stringify(s) + "\n");
  }

  writeTrade(trade: TradeEvent) {
    if (!this.isRecording) return;

    const fp = this.filePathForDay(trade.t);
    if (!this.stream || (this.stream.path as string) !== fp) {
      this.stream?.end();
      this.stream = fs.createWriteStream(fp, { flags: "a" });
    }
    this.stream.write(JSON.stringify(trade) + "\n");
  }

  close() {
    this.stop();
  }
}

