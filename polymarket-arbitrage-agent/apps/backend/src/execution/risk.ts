export type RiskFlags = {
  maxSharesPerRound: boolean;
  maxTradesPerDay: boolean;
  maxDailyDrawdown: boolean;
  killSwitch: boolean;
  flags: string[];
};

export class RiskManager {
  private sharesThisRound = 0;
  private tradesToday = 0;
  private dailyPnL = 0;
  private lastResetDate = new Date().toDateString();

  constructor(
    private maxSharesPerRound: number,
    private maxTradesPerDay: number,
    private maxDailyDrawdown: number,
    private killSwitch: boolean
  ) {}

  check(action: { shares?: number; side?: "UP" | "DOWN" }): RiskFlags {
    const flags: string[] = [];

    // Reset daily counters if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.tradesToday = 0;
      this.dailyPnL = 0;
      this.lastResetDate = today;
    }

    // Check max shares per round
    const shares = action.shares ?? 0;
    if (this.sharesThisRound + shares > this.maxSharesPerRound) {
      flags.push(`MAX_SHARES_PER_ROUND: ${this.sharesThisRound + shares} > ${this.maxSharesPerRound}`);
    }

    // Check max trades per day
    if (this.tradesToday >= this.maxTradesPerDay) {
      flags.push(`MAX_TRADES_PER_DAY: ${this.tradesToday} >= ${this.maxTradesPerDay}`);
    }

    // Check daily drawdown
    if (this.dailyPnL <= this.maxDailyDrawdown) {
      flags.push(`MAX_DAILY_DRAWDOWN: ${this.dailyPnL.toFixed(2)} <= ${this.maxDailyDrawdown}`);
    }

    // Kill switch
    if (this.killSwitch && flags.length > 0) {
      flags.push("KILL_SWITCH_ACTIVE");
    }

    return {
      maxSharesPerRound: this.sharesThisRound + shares > this.maxSharesPerRound,
      maxTradesPerDay: this.tradesToday >= this.maxTradesPerDay,
      maxDailyDrawdown: this.dailyPnL <= this.maxDailyDrawdown,
      killSwitch: this.killSwitch && flags.length > 0,
      flags,
    };
  }

  recordTrade(shares: number) {
    this.sharesThisRound += shares;
    this.tradesToday += 1;
  }

  recordPnL(pnl: number) {
    this.dailyPnL += pnl;
  }

  resetRound() {
    this.sharesThisRound = 0;
  }

  getDailyStats() {
    return {
      tradesToday: this.tradesToday,
      dailyPnL: this.dailyPnL,
    };
  }
}

