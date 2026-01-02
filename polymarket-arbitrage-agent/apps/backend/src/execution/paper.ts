import type { Side } from "../../../packages/types/src/fused.js";

export type Fill = {
  t: number;
  leg: Side;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  ref?: string;
  reason?: string;
  strategy?: string;
  tier?: 1 | 2 | 3;
};

export type Position = {
  shares: number;
  avg: number;
  cost: number;
  mark: number;
  pnl: number;
};

export class PaperSim {
  fills: Fill[] = [];
  up: Position = { shares: 0, avg: 0, cost: 0, mark: 0, pnl: 0 };
  down: Position = { shares: 0, avg: 0, cost: 0, mark: 0, pnl: 0 };

  setMarks(upMid: number, downMid: number) {
    this.up.mark = upMid;
    this.down.mark = downMid;
    this.up.pnl = (this.up.mark - this.up.avg) * this.up.shares;
    this.down.pnl = (this.down.mark - this.down.avg) * this.down.shares;
  }

  buy(leg: Side, price: number, size: number, reason?: string, strategy?: string, tier?: 1 | 2 | 3) {
    const p = leg === "UP" ? this.up : this.down;
    const newCost = p.cost + price * size;
    const newShares = p.shares + size;
    p.avg = newShares > 0 ? newCost / newShares : 0;
    p.cost = newCost;
    p.shares = newShares;

    this.fills.unshift({
      t: Date.now(),
      leg,
      side: "BUY",
      price,
      size,
      ref: "paper",
      reason,
      strategy,
      tier,
    });
    this.fills = this.fills.slice(0, 100); // keep last 100
  }

  totalPnL(): number {
    return this.up.pnl + this.down.pnl;
  }

  totalCost(): number {
    return this.up.cost + this.down.cost;
  }

  pairs(): number {
    return Math.min(this.up.shares, this.down.shares);
  }

  delta(): number {
    return this.up.shares - this.down.shares;
  }
}

