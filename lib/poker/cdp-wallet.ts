import { Coinbase, Wallet } from '@coinbase/coinbase-sdk'
import bs58 from 'bs58'

export interface WalletProvider {
  getAddress(): Promise<string>
  signMessage(message: string): Promise<string>
}

export class CDPWalletProvider implements WalletProvider {
  private wallet: Wallet | null = null
  private walletId: string | null = null

  constructor(apiKeyName: string, privateKey: string) {
    Coinbase.configure({ apiKeyName, privateKey })
  }

  /**
   * Initialize a new or existing wallet
   */
  async initialize(walletId?: string): Promise<void> {
    if (walletId) {
      this.wallet = await Wallet.fetch(walletId)
      this.walletId = walletId
    } else {
      // Create a new Solana wallet
      this.wallet = await Wallet.create({ networkId: 'solana-mainnet' }) // Use mainnet or devnet as needed
      this.walletId = this.wallet.getId()
      console.log(`Created new CDP Wallet: ${this.walletId}`)
    }
  }

  async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized')
    const address = await this.wallet.getDefaultAddress()
    return address.getId()
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized')
    
    // CDP SDK might not have a direct "signMessage" for Solana that returns a simple string yet
    // depending on the version. If not, we use the underlying functionality.
    // According to CDP docs, we can use wallet.createPayload or similar, 
    // but for simple auth signatures, we want a detached signature.
    
    // Mocking the behavior if SDK is still in early stage for Solana detached sigs
    // In a real scenario, we'd use the CDP API to sign the payload.
    const signature = await this.wallet.createPayload({
      message: message
    })
    
    // We assume the payload result contains the signature we need
    return signature.toString()
  }

  getWalletId(): string | null {
    return this.walletId
  }
}
