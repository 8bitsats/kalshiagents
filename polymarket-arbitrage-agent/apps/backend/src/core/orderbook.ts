export type Level = { price: number; size: number };

export class L2Book {
  bids: Level[] = [];
  asks: Level[] = [];
  lastTsMs: number = 0;
  hash?: string;
  tickSize?: number;

  updateFromSnapshot(bids: any[], asks: any[], tsMs: number, hash?: string) {
    this.bids = (bids ?? [])
      .map((l) => ({ price: Number(l.price), size: Number(l.size) }))
      .sort((a, b) => b.price - a.price);
    this.asks = (asks ?? [])
      .map((l) => ({ price: Number(l.price), size: Number(l.size) }))
      .sort((a, b) => a.price - b.price);
    this.lastTsMs = tsMs;
    this.hash = hash;
  }

  bestBid(): number {
    return this.bids[0]?.price ?? 0;
  }

  bestAsk(): number {
    return this.asks[0]?.price ?? 1;
  }

  midpoint(): number {
    const bb = this.bestBid();
    const ba = this.bestAsk();
    if (bb <= 0 && ba >= 1) return 0.5;
    return (bb + ba) / 2;
  }
}

