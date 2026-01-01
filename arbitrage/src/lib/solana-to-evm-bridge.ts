import { Keypair, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Enterprise Bridge: Links Solana Identity to EVM Identity.
 * 
 * Cryptographic logic:
 * 1. Signs a constant message with the Solana Key (Ed25519).
 * 2. Hashes that signature to generate a 32-byte entropy seed.
 * 3. Uses that seed to generate a compliant Ethereum Wallet (Secp256k1).
 */
export class SolanaToEVMBridge {
  private solanaKeypair: Keypair;
  public evmWallet: ethers.Wallet;

  private static BRIDGE_MESSAGE = "POLYMARKET_ARBITRAGE_VISION_ACCESS_V1";

  constructor(solanaPrivateKeyBase58: string) {
    // 1. Initialize Solana Identity
    this.solanaKeypair = Keypair.fromSecretKey(
      bs58.decode(solanaPrivateKeyBase58)
    );

    // 2. Derive EVM Identity Deterministically
    this.evmWallet = this.deriveEVMWallet();
  }

  /**
   * Alternative constructor for use with wallet adapter signMessage function
   */
  static async fromSignMessage(
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<SolanaToEVMBridge> {
    const messageBytes = new TextEncoder().encode(SolanaToEVMBridge.BRIDGE_MESSAGE);
    const signature = await signMessage(messageBytes);
    
    // Hash the signature to create a compatible 32-byte Private Key for Ethereum
    // ethers.keccak256 accepts Uint8Array (BytesLike) and returns hex string
    const entropy = ethers.keccak256(signature);
    const evmWallet = new ethers.Wallet(entropy);
    
    // Create a bridge instance (we'll need to store the derived wallet)
    const bridge = Object.create(SolanaToEVMBridge.prototype);
    bridge.evmWallet = evmWallet;
    return bridge;
  }

  private deriveEVMWallet(): ethers.Wallet {
    const messageBytes = new TextEncoder().encode(SolanaToEVMBridge.BRIDGE_MESSAGE);
    
    // Sign message with Solana Key
    const signature = nacl.sign.detached(
      messageBytes, 
      this.solanaKeypair.secretKey
    );

    // Hash the signature to create a compatible 32-byte Private Key for Ethereum
    // ethers.keccak256 accepts Uint8Array (BytesLike) and returns hex string
    const entropy = ethers.keccak256(signature);
    
    // Create Ethers Wallet (keccak256 returns hex string which is valid private key format)
    return new ethers.Wallet(entropy);
  }

  public getSolanaAddress(): string {
    return this.solanaKeypair.publicKey.toBase58();
  }

  public getEVMAddress(): string {
    return this.evmWallet.address;
  }

  /**
   * Get the EVM wallet signer for use with Polymarket CLOB
   */
  public getEVMSigner(): ethers.Wallet {
    return this.evmWallet;
  }
}

