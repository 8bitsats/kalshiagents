import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Load .env from project root (not from apps/backend)
// In ES modules, we need to use import.meta.url to get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

const schema = z.object({
  PAPER_TRADING: z.coerce.boolean().default(true),
  LIVE_TRADING: z.coerce.boolean().default(false),

  POLYMARKET_WS_URL: z.string().default("wss://ws-subscriptions-clob.polymarket.com/ws/"),
  POLYMARKET_HOST: z.string().default("https://clob.polymarket.com"),
  POLYMARKET_CHAIN_ID: z.coerce.number().default(137),
  POLYMARKET_MARKET_SLUG: z.string().default("btc-updown-15m"),
  POLYMARKET_TOKEN_UP_ID: z.string().min(1, "POLYMARKET_TOKEN_UP_ID required"),
  POLYMARKET_TOKEN_DOWN_ID: z.string().min(1, "POLYMARKET_TOKEN_DOWN_ID required"),

  POLYMARKET_API_KEY: z.string().optional(),
  POLYMARKET_API_SECRET: z.string().optional(),
  POLYMARKET_API_PASSPHRASE: z.string().optional(),
  POLYMARKET_PRIVATE_KEY: z.string().optional(),
  POLYMARKET_FUNDER: z.string().optional(),
  POLYMARKET_SIGNATURE_TYPE: z.coerce.number().default(1),

  BINANCE_FUTURES_WS: z.string().default("wss://fstream.binance.com/ws"),
  BINANCE_SYMBOL: z.string().default("btcusdt"),

  ENGINE_HZ: z.coerce.number().positive().default(4),
  RECORDER_HZ: z.coerce.number().positive().default(4),

  ORDER_SIZE_SHARES: z.coerce.number().positive().default(20),
  SUM_TARGET: z.coerce.number().positive().default(0.95),
  MOVE_PCT: z.coerce.number().positive().default(0.15),
  WINDOW_MIN: z.coerce.number().positive().default(2),
  COOLDOWN_SECONDS: z.coerce.number().positive().default(10),
  TARGET_PAIR_COST: z.coerce.number().positive().default(0.95),

  MAX_SHARES_PER_ROUND: z.coerce.number().positive().default(200),
  MAX_TRADES_PER_DAY: z.coerce.number().positive().default(200),
  MAX_DAILY_DRAWDOWN: z.coerce.number().default(-250),
  KILL_SWITCH: z.coerce.boolean().default(true),

  GROK_MODEL: z.string().default("grok-4.1"),
  GROK_API_KEY: z.string().optional(),
  LIVE_SEARCH: z.coerce.boolean().default(true),

  // Strategy selection
  STRATEGY: z.string().default("pair_arbitrage"), // pair_arbitrage, statistical_arbitrage, spread_farming, autocycle_dump_hedge, open_leg_dislocation_pair

  // Pair arbitrage params
  PAIR_ARB_MAX_COST: z.coerce.number().default(0.99),
  PAIR_ARB_MIN_COST: z.coerce.number().optional(),
  PAIR_ARB_SHARES: z.coerce.number().default(250),
  PAIR_ARB_COOLDOWN_MS: z.coerce.number().default(1000),
  PAIR_ARB_MAX_PAIRS: z.coerce.number().default(10),

  // Statistical arbitrage params
  STAT_ARB_MIN_SPREAD: z.coerce.number().default(0.04),
  STAT_ARB_MAX_SPREAD: z.coerce.number().default(0.07),
  STAT_ARB_SHARES: z.coerce.number().default(200),
  STAT_ARB_CONVERGENCE: z.coerce.number().default(0.01),
  STAT_ARB_COOLDOWN_MS: z.coerce.number().default(2000),

  // Spread farming params
  SPREAD_FARM_MIN_BPS: z.coerce.number().default(5),
  SPREAD_FARM_SHARES: z.coerce.number().default(100),
  SPREAD_FARM_MAX_POS: z.coerce.number().default(20),
  SPREAD_FARM_COOLDOWN_MS: z.coerce.number().default(500),

  // Terminal UI
  ENABLE_TERMINAL_UI: z.coerce.boolean().default(false),

  PORT: z.coerce.number().default(3001),
  WS_PORT: z.coerce.number().default(3002),
});

export type Config = z.infer<typeof schema>;

export function getConfig(): Config {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.errors;
    const missingTokens = errors.filter(
      (e) => e.path.includes("POLYMARKET_TOKEN_UP_ID") || e.path.includes("POLYMARKET_TOKEN_DOWN_ID")
    );

    if (missingTokens.length > 0) {
      console.error("\n❌ Missing required environment variables:\n");
      missingTokens.forEach((e) => {
        console.error(`   - ${e.path.join(".")}: ${e.message}`);
      });
      console.error("\n📝 To fix:");
      console.error("   1. Create .env file in the project root:");
      console.error("      cd /Users/8bit/Downloads/agents/polymarket-arbitrage-agent");
      console.error("      touch .env");
      console.error("   2. Add these lines to .env:");
      console.error("      POLYMARKET_TOKEN_UP_ID=your_up_token_id_here");
      console.error("      POLYMARKET_TOKEN_DOWN_ID=your_down_token_id_here");
      console.error("\n💡 Get token IDs:");
      console.error("   - Visit Polymarket website");
      console.error("   - Open DevTools → Network → WS tab");
      console.error("   - Look for WebSocket messages with 'asset_id' fields");
      console.error("   - Copy the UP and DOWN token IDs");
      console.error("\n   Quick fix: See FIX_MISSING_TOKEN_IDS.md");
      console.error("   Detailed: See GET_TOKEN_IDS.md or EXTRACT_TOKEN_IDS_NETWORK_TAB.md\n");
      process.exit(1);
    }

    // For other errors, show them
    console.error("\n❌ Configuration errors:\n");
    errors.forEach((e) => {
      console.error(`   - ${e.path.join(".")}: ${e.message}`);
    });
    process.exit(1);
  }

  const cfg = parsed.data;

  // Validate token IDs are set (double-check)
  if (!cfg.POLYMARKET_TOKEN_UP_ID || !cfg.POLYMARKET_TOKEN_DOWN_ID) {
    console.error("\n❌ POLYMARKET_TOKEN_UP_ID and POLYMARKET_TOKEN_DOWN_ID are required\n");
    console.error("📝 Create .env file and add these variables\n");
    console.error("💡 See GET_TOKEN_IDS.md for instructions\n");
    process.exit(1);
  }

  if (!cfg.PAPER_TRADING && cfg.LIVE_TRADING) {
    const missing: string[] = [];
    if (!cfg.POLYMARKET_PRIVATE_KEY) missing.push("POLYMARKET_PRIVATE_KEY");
    if (!cfg.POLYMARKET_API_KEY) missing.push("POLYMARKET_API_KEY");
    if (!cfg.POLYMARKET_API_SECRET) missing.push("POLYMARKET_API_SECRET");
    if (!cfg.POLYMARKET_API_PASSPHRASE) missing.push("POLYMARKET_API_PASSPHRASE");
    if (missing.length) {
      throw new Error(
        `Missing trading env vars (set PAPER_TRADING=true to run without trading): ${missing.join(", ")}`
      );
    }
  }

  return cfg;
}

