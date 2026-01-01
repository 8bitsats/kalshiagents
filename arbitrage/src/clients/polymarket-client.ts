import { ClobClient, ApiKeyCreds, Side, OrderType, Chain } from "@polymarket/clob-client";
import { Wallet } from "ethers";

/**
 * Unified Polymarket CLOB Client
 * Wraps the official CLOB client with enhanced functionality
 */
export class PolymarketClient {
  private clobClient: ClobClient;
  private creds: ApiKeyCreds | null = null;
  private initialized: boolean = false;

  constructor(
    private host: string,
    private chainId: Chain,
    private signer: Wallet,
    private funder?: string,
    private signatureType: 0 | 1 = 1
  ) {
    this.clobClient = new ClobClient(host, chainId, signer);
  }

  /**
   * Initialize and authenticate with Polymarket
   * Creates or derives API keys
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.creds = await this.clobClient.createOrDeriveApiKey();
      
      // Re-instantiate client with credentials
      this.clobClient = new ClobClient(
        this.host,
        this.chainId,
        this.signer,
        this.creds,
        this.signatureType,
        this.funder
      );

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Polymarket client: ${error}`);
    }
  }

  /**
   * Get orderbook for a token
   */
  async getOrderbook(tokenId: string) {
    await this.ensureInitialized();
    return await this.clobClient.getOrderBook(tokenId);
  }

  /**
   * Get market information
   */
  async getMarket(tokenId: string) {
    await this.ensureInitialized();
    // Use Gamma Markets API or CLOB endpoint
    // This is a placeholder - actual implementation depends on available endpoints
    return await this.clobClient.getOrderBook(tokenId);
  }

  /**
   * Create and post an order
   */
  async createOrder(params: {
    tokenID: string;
    price: number;
    side: Side;
    size: number;
  }, options?: {
    tickSize?: string;
    negRisk?: boolean;
  }) {
    await this.ensureInitialized();

    const orderType = OrderType.GTC;
    const tickSize = options?.tickSize || "0.001";
    const negRisk = options?.negRisk || false;

    try {
      const response = await this.clobClient.createAndPostOrder(
        {
          tokenID: params.tokenID,
          price: params.price,
          side: params.side,
          size: params.size,
        },
        { tickSize, negRisk },
        orderType
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string) {
    await this.ensureInitialized();
    return await this.clobClient.cancelOrder(orderId);
  }

  /**
   * Get user orders
   */
  async getOrders() {
    await this.ensureInitialized();
    return await this.clobClient.getOrders();
  }

  /**
   * Get user fills
   */
  async getFills() {
    await this.ensureInitialized();
    return await this.clobClient.getFills();
  }

  /**
   * Get user balance
   */
  async getBalance() {
    await this.ensureInitialized();
    return await this.clobClient.getBalance();
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the underlying CLOB client for advanced operations
   */
  getClobClient(): ClobClient {
    return this.clobClient;
  }
}

