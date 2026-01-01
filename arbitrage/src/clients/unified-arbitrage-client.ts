import { SolanaToEVMBridge } from "../lib/solana-to-evm-bridge";
import { KalshiClient } from "./kalshi-client";
import { PolymarketClient } from "./polymarket-client";
import { Connection, PublicKey } from "@solana/web3.js";
import { Wallet } from "ethers";

/**
 * Unified Arbitrage Client
 * Orchestrates trading across Kalshi, Polymarket, and Solana
 */
export interface ArbitrageOpportunity {
  kalshiTicker: string;
  polymarketTokenId: string;
  kalshiYesPrice: number;
  kalshiNoPrice: number;
  polymarketYesPrice: number;
  polymarketNoPrice: number;
  spread: number; // Percentage spread
  estimatedProfit: number;
  timestamp: number;
}

export interface MarketData {
  kalshi: {
    yesPrice: number;
    noPrice: number;
    volume: number;
  };
  polymarket: {
    yesPrice: number;
    noPrice: number;
    volume: number;
  };
  spread: number;
}

export class UnifiedArbitrageClient {
  private kalshiClient: KalshiClient;
  private polymarketClient: PolymarketClient;
  private bridge: SolanaToEVMBridge | null = null;
  private solanaConnection: Connection | null = null;

  constructor(
    kalshiApiKey: string,
    kalshiPrivateKeyPath: string,
    polymarketHost: string,
    polymarketChainId: number,
    evmSigner: Wallet,
    solanaRpcUrl?: string
  ) {
    // Initialize Kalshi client
    this.kalshiClient = new KalshiClient(kalshiApiKey, kalshiPrivateKeyPath);

    // Initialize Polymarket client
    this.polymarketClient = new PolymarketClient(
      polymarketHost,
      polymarketChainId as any,
      evmSigner
    );

    // Initialize Solana connection if provided
    if (solanaRpcUrl) {
      this.solanaConnection = new Connection(solanaRpcUrl, "confirmed");
    }
  }

  /**
   * Set the Solana-to-EVM bridge
   */
  setBridge(bridge: SolanaToEVMBridge): void {
    this.bridge = bridge;
    // Update Polymarket client with bridged signer
    this.polymarketClient = new PolymarketClient(
      this.polymarketClient["host"],
      this.polymarketClient["chainId"],
      bridge.getEVMSigner()
    );
  }

  /**
   * Compare prices between Kalshi and Polymarket for the same event
   */
  async findArbitrageOpportunity(
    kalshiTicker: string,
    polymarketTokenId: string
  ): Promise<ArbitrageOpportunity | null> {
    try {
      // Fetch Kalshi orderbook
      const kalshiOrderbook = await this.kalshiClient.getOrderbook(kalshiTicker);
      const kalshiYesPrice = parseFloat(kalshiOrderbook.yes_bid || "0");
      const kalshiNoPrice = parseFloat(kalshiOrderbook.no_bid || "0");

      // Fetch Polymarket orderbook
      const polyOrderbook = await this.polymarketClient.getOrderbook(polymarketTokenId);
      const polyBestAsk = polyOrderbook.asks?.[0]?.price 
        ? parseFloat(polyOrderbook.asks[0].price) 
        : 0;
      const polyBestBid = polyOrderbook.bids?.[0]?.price 
        ? parseFloat(polyOrderbook.bids[0].price) 
        : 0;

      // Calculate spread
      const spread = Math.abs(kalshiYesPrice - polyBestAsk) / Math.max(kalshiYesPrice, polyBestAsk) * 100;

      // Only return if spread is significant (e.g., > 2%)
      if (spread < 2) {
        return null;
      }

      return {
        kalshiTicker,
        polymarketTokenId,
        kalshiYesPrice,
        kalshiNoPrice,
        polymarketYesPrice: polyBestAsk,
        polymarketNoPrice: polyBestBid,
        spread,
        estimatedProfit: spread * 0.01, // Simplified profit calculation
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error finding arbitrage opportunity:", error);
      return null;
    }
  }

  /**
   * Execute arbitrage trade
   * Buys on the cheaper exchange, sells on the more expensive one
   */
  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<{
    kalshiOrder?: any;
    polymarketOrder?: any;
    success: boolean;
  }> {
    try {
      // Determine which exchange is cheaper
      const kalshiCheaper = opportunity.kalshiYesPrice < opportunity.polymarketYesPrice;

      let kalshiOrder = null;
      let polymarketOrder = null;

      if (kalshiCheaper) {
        // Buy on Kalshi, sell on Polymarket
        // Note: Kalshi order placement requires server-side execution
        // This is a placeholder - actual execution should go through server routes
        
        // Sell on Polymarket
        polymarketOrder = await this.polymarketClient.createOrder({
          tokenID: opportunity.polymarketTokenId,
          price: opportunity.polymarketYesPrice,
          side: "SELL" as any,
          size: 10, // Example size
        });
      } else {
        // Buy on Polymarket, sell on Kalshi
        polymarketOrder = await this.polymarketClient.createOrder({
          tokenID: opportunity.polymarketTokenId,
          price: opportunity.polymarketYesPrice,
          side: "BUY" as any,
          size: 10,
        });
      }

      return {
        kalshiOrder,
        polymarketOrder,
        success: true,
      };
    } catch (error) {
      console.error("Error executing arbitrage:", error);
      return {
        success: false,
      };
    }
  }

  /**
   * Get market data for comparison
   */
  async getMarketData(
    kalshiTicker: string,
    polymarketTokenId: string
  ): Promise<MarketData> {
    const kalshiOrderbook = await this.kalshiClient.getOrderbook(kalshiTicker);
    const polyOrderbook = await this.polymarketClient.getOrderbook(polymarketTokenId);

    const kalshiYesPrice = parseFloat(kalshiOrderbook.yes_bid || "0");
    const kalshiNoPrice = parseFloat(kalshiOrderbook.no_bid || "0");
    const polyYesPrice = parseFloat(polyOrderbook.asks?.[0]?.price || "0");
    const polyNoPrice = parseFloat(polyOrderbook.bids?.[0]?.price || "0");

    return {
      kalshi: {
        yesPrice: kalshiYesPrice,
        noPrice: kalshiNoPrice,
        volume: 0, // Would need to fetch from market data
      },
      polymarket: {
        yesPrice: polyYesPrice,
        noPrice: polyNoPrice,
        volume: 0,
      },
      spread: Math.abs(kalshiYesPrice - polyYesPrice) / Math.max(kalshiYesPrice, polyYesPrice) * 100,
    };
  }

  /**
   * Get Kalshi client for direct access
   */
  getKalshiClient(): KalshiClient {
    return this.kalshiClient;
  }

  /**
   * Get Polymarket client for direct access
   */
  getPolymarketClient(): PolymarketClient {
    return this.polymarketClient;
  }
}

