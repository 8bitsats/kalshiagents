import { ClobClient, OrderType, Side, ApiKeyCreds } from "@polymarket/clob-client";
import { Wallet } from "ethers";
import type { Config } from "../config.js";
import type { Side as FusedSide } from "@packages/types/fused.js";

export type LiveFill = {
  t: number;
  leg: FusedSide;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  orderId?: string;
  txHash?: string;
  status?: string;
  error?: string;
  ref?: string;
  reason?: string;
  strategy?: string;
  tier?: 1 | 2 | 3;
};

export class LiveExecutor {
  private client: ClobClient | null = null;
  private fills: LiveFill[] = [];
  private tickSizes: Map<string, string> = new Map();
  private negRisk: Map<string, boolean> = new Map();

  constructor(private cfg: Config) {}

  async initialize(): Promise<void> {
    if (!this.cfg.POLYMARKET_PRIVATE_KEY) {
      throw new Error("POLYMARKET_PRIVATE_KEY required for live trading");
    }

    const signer = new Wallet(this.cfg.POLYMARKET_PRIVATE_KEY);

    // Create or derive API credentials
    const tempClient = new ClobClient({
      host: this.cfg.POLYMARKET_HOST,
      chainId: this.cfg.POLYMARKET_CHAIN_ID,
      signer,
    });

    let creds: ApiKeyCreds;
    if (this.cfg.POLYMARKET_API_KEY && this.cfg.POLYMARKET_API_SECRET && this.cfg.POLYMARKET_API_PASSPHRASE) {
      // Use provided API credentials
      creds = {
        key: this.cfg.POLYMARKET_API_KEY,
        secret: this.cfg.POLYMARKET_API_SECRET,
        passphrase: this.cfg.POLYMARKET_API_PASSPHRASE,
      };
    } else {
      // Create or derive API credentials
      creds = await tempClient.createOrDeriveApiKey();
      console.log("✅ Created/derived API credentials for live trading");
    }

    // Initialize the main client
    this.client = new ClobClient({
      host: this.cfg.POLYMARKET_HOST,
      chainId: this.cfg.POLYMARKET_CHAIN_ID,
      signer,
      creds,
      signatureType: this.cfg.POLYMARKET_SIGNATURE_TYPE,
      funderAddress: this.cfg.POLYMARKET_FUNDER,
    });

    // Pre-fetch tick sizes and neg risk for both tokens
    await this.prefetchMarketData();

    console.log("✅ Live trading executor initialized");
  }

  private async prefetchMarketData(): Promise<void> {
    if (!this.client) return;

    try {
      // Fetch tick sizes and neg risk for both tokens
      const [upTickSize, downTickSize, upNegRisk, downNegRisk] = await Promise.all([
        this.client.getTickSize(this.cfg.POLYMARKET_TOKEN_UP_ID).catch(() => ({ tickSize: "0.001" })),
        this.client.getTickSize(this.cfg.POLYMARKET_TOKEN_DOWN_ID).catch(() => ({ tickSize: "0.001" })),
        this.client.getNegRisk(this.cfg.POLYMARKET_TOKEN_UP_ID).catch(() => false),
        this.client.getNegRisk(this.cfg.POLYMARKET_TOKEN_DOWN_ID).catch(() => false),
      ]);

      this.tickSizes.set(this.cfg.POLYMARKET_TOKEN_UP_ID, upTickSize.tickSize || "0.001");
      this.tickSizes.set(this.cfg.POLYMARKET_TOKEN_DOWN_ID, downTickSize.tickSize || "0.001");
      this.negRisk.set(this.cfg.POLYMARKET_TOKEN_UP_ID, upNegRisk);
      this.negRisk.set(this.cfg.POLYMARKET_TOKEN_DOWN_ID, downNegRisk);

      console.log(`📊 Market data prefetched: UP tick=${upTickSize.tickSize}, negRisk=${upNegRisk}, DOWN tick=${downTickSize.tickSize}, negRisk=${downNegRisk}`);
    } catch (error: any) {
      console.warn("⚠️  Could not prefetch market data:", error.message);
      // Set defaults
      this.tickSizes.set(this.cfg.POLYMARKET_TOKEN_UP_ID, "0.001");
      this.tickSizes.set(this.cfg.POLYMARKET_TOKEN_DOWN_ID, "0.001");
      this.negRisk.set(this.cfg.POLYMARKET_TOKEN_UP_ID, false);
      this.negRisk.set(this.cfg.POLYMARKET_TOKEN_DOWN_ID, false);
    }
  }

  async buy(
    side: FusedSide,
    price: number,
    size: number,
    reason?: string,
    strategy?: string,
    tier?: 1 | 2 | 3
  ): Promise<LiveFill> {
    if (!this.client) {
      throw new Error("Live executor not initialized. Call initialize() first.");
    }

    const tokenId = side === "UP" ? this.cfg.POLYMARKET_TOKEN_UP_ID : this.cfg.POLYMARKET_TOKEN_DOWN_ID;
    const tickSize = this.tickSizes.get(tokenId) || "0.001";
    const negRisk = this.negRisk.get(tokenId) || false;

    try {
      const response = await this.client.createAndPostOrder(
        {
          tokenID: tokenId,
          price: price,
          side: Side.BUY,
          size: size,
        },
        {
          tickSize,
          negRisk,
        },
        OrderType.GTC // Good-Til-Cancelled
      );

      const fill: LiveFill = {
        t: Date.now(),
        leg: side,
        side: "BUY",
        price: price,
        size: size,
        orderId: response.orderID,
        status: response.status || "live",
        ref: "live",
        reason,
        strategy,
        tier,
      };

      this.fills.unshift(fill);
      this.fills = this.fills.slice(0, 100); // Keep last 100

      console.log(`✅ LIVE BUY ${side}: ${size} @ ${price.toFixed(4)} (orderId: ${response.orderID})`);
      return fill;
    } catch (error: any) {
      const fill: LiveFill = {
        t: Date.now(),
        leg: side,
        side: "BUY",
        price: price,
        size: size,
        error: error.message || String(error),
        ref: "live",
        reason,
        strategy,
        tier,
      };

      this.fills.unshift(fill);
      console.error(`❌ LIVE BUY ${side} FAILED: ${error.message}`);
      throw error;
    }
  }

  async sell(
    side: FusedSide,
    price: number,
    size: number,
    reason?: string,
    strategy?: string,
    tier?: 1 | 2 | 3
  ): Promise<LiveFill> {
    if (!this.client) {
      throw new Error("Live executor not initialized. Call initialize() first.");
    }

    const tokenId = side === "UP" ? this.cfg.POLYMARKET_TOKEN_UP_ID : this.cfg.POLYMARKET_TOKEN_DOWN_ID;
    const tickSize = this.tickSizes.get(tokenId) || "0.001";
    const negRisk = this.negRisk.get(tokenId) || false;

    try {
      const response = await this.client.createAndPostOrder(
        {
          tokenID: tokenId,
          price: price,
          side: Side.SELL,
          size: size,
        },
        {
          tickSize,
          negRisk,
        },
        OrderType.GTC
      );

      const fill: LiveFill = {
        t: Date.now(),
        leg: side,
        side: "SELL",
        price: price,
        size: size,
        orderId: response.orderID,
        status: response.status || "live",
        ref: "live",
        reason,
        strategy,
        tier,
      };

      this.fills.unshift(fill);
      this.fills = this.fills.slice(0, 100);

      console.log(`✅ LIVE SELL ${side}: ${size} @ ${price.toFixed(4)} (orderId: ${response.orderID})`);
      return fill;
    } catch (error: any) {
      const fill: LiveFill = {
        t: Date.now(),
        leg: side,
        side: "SELL",
        price: price,
        size: size,
        error: error.message || String(error),
        ref: "live",
        reason,
        strategy,
        tier,
      };

      this.fills.unshift(fill);
      console.error(`❌ LIVE SELL ${side} FAILED: ${error.message}`);
      throw error;
    }
  }

  getFills(): LiveFill[] {
    return this.fills;
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (!this.client) {
      throw new Error("Live executor not initialized");
    }

    try {
      await this.client.cancel(orderId);
      console.log(`✅ Cancelled order: ${orderId}`);
    } catch (error: any) {
      console.error(`❌ Failed to cancel order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async cancelAllOrders(): Promise<void> {
    if (!this.client) {
      throw new Error("Live executor not initialized");
    }

    try {
      await this.client.cancelAll();
      console.log(`✅ Cancelled all orders`);
    } catch (error: any) {
      console.error(`❌ Failed to cancel all orders: ${error.message}`);
      throw error;
    }
  }

  async getActiveOrders(): Promise<any[]> {
    if (!this.client) {
      return [];
    }

    try {
      const orders = await this.client.getOrders({
        market: undefined, // Get all orders
      });
      return orders || [];
    } catch (error: any) {
      console.error(`❌ Failed to get active orders: ${error.message}`);
      return [];
    }
  }
}

