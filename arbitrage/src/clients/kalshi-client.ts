import { Configuration, PortfolioApi, MarketsApi, ExchangeApi } from "kalshi-typescript";

/**
 * Unified Kalshi API Client
 * Handles authentication, market data, and order execution
 */
export class KalshiClient {
  private portfolioApi: PortfolioApi;
  private marketsApi: MarketsApi;
  private exchangeApi: ExchangeApi;
  private config: Configuration;

  constructor(apiKeyId: string, privateKeyPath?: string, privateKeyPem?: string) {
    this.config = new Configuration({
      apiKey: apiKeyId,
      privateKeyPath: privateKeyPath,
      privateKeyPem: privateKeyPem,
      basePath: "https://api.elections.kalshi.com/trade-api/v2",
    });

    this.portfolioApi = new PortfolioApi(this.config);
    this.marketsApi = new MarketsApi(this.config);
    this.exchangeApi = new ExchangeApi(this.config);
  }

  // ========== Portfolio Operations ==========

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    const response = await this.portfolioApi.getBalance();
    return (response.data.balance || 0) / 100; // Convert cents to dollars
  }

  /**
   * Get all positions
   */
  async getPositions(options?: {
    cursor?: string;
    limit?: number;
    ticker?: string;
    eventTicker?: string;
    countFilter?: string;
  }) {
    const response = await this.portfolioApi.getPositions(
      options?.cursor,
      options?.limit,
      options?.countFilter,
      options?.ticker,
      options?.eventTicker
    );
    return response.data;
  }

  /**
   * Get fills (trade history)
   */
  async getFills(options?: {
    ticker?: string;
    orderId?: string;
    minTs?: number;
    maxTs?: number;
    limit?: number;
    cursor?: string;
  }) {
    const response = await this.portfolioApi.getFills(
      options?.ticker,
      options?.orderId,
      options?.minTs,
      options?.maxTs,
      options?.limit,
      options?.cursor
    );
    return response.data;
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(params: {
    ticker: string;
    action: "buy" | "sell";
    side: "yes" | "no";
    count: number;
  }) {
    // This would typically use the ExchangeApi or a separate OrdersApi
    // For now, we'll create a generic order placement method
    // Note: Kalshi SDK may require direct API calls for order placement
    throw new Error("Order placement requires direct API integration - see server routes");
  }

  // ========== Market Data ==========

  /**
   * Get market by ticker
   */
  async getMarket(ticker: string) {
    const response = await this.marketsApi.getMarket(ticker);
    return response.data;
  }

  /**
   * Get market orderbook
   */
  async getOrderbook(ticker: string, depth: number = 10) {
    const response = await this.marketsApi.getMarketOrderbook(ticker, depth);
    return response.data;
  }

  /**
   * List markets with filters
   */
  async getMarkets(options?: {
    limit?: number;
    cursor?: string;
    eventTicker?: string;
    seriesTicker?: string;
    status?: string;
    tickers?: string;
    minCloseTs?: number;
    maxCloseTs?: number;
  }) {
    const response = await this.marketsApi.getMarkets(
      options?.limit,
      options?.cursor,
      options?.eventTicker,
      options?.seriesTicker,
      options?.maxCloseTs,
      options?.minCloseTs,
      options?.status,
      options?.tickers
    );
    return response.data;
  }

  /**
   * Get recent trades
   */
  async getTrades(options?: {
    limit?: number;
    cursor?: string;
    ticker?: string;
    minTs?: number;
    maxTs?: number;
  }) {
    const response = await this.marketsApi.getTrades(
      options?.limit,
      options?.cursor,
      options?.ticker,
      options?.minTs,
      options?.maxTs
    );
    return response.data;
  }

  // ========== Exchange Info ==========

  /**
   * Get exchange status
   */
  async getExchangeStatus() {
    const response = await this.exchangeApi.getExchangeStatus();
    return response.data;
  }
}

