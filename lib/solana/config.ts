import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'

// Network configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'

export const CLUSTER_ENDPOINT = 
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  clusterApiUrl(SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta')

// Create connection singleton
let connection: Connection | null = null

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(CLUSTER_ENDPOINT, 'confirmed')
  }
  return connection
}

// Escrow wallet (in production, this would be a program-derived address)
export const ESCROW_WALLET = new PublicKey(
  process.env.NEXT_PUBLIC_ESCROW_WALLET || 
  '11111111111111111111111111111111' // System program as placeholder
)

// Minimum deposit amounts (in lamports)
export const MIN_DEPOSIT_LAMPORTS = 0.01 * 1e9 // 0.01 SOL
export const MAX_DEPOSIT_LAMPORTS = 10 * 1e9   // 10 SOL

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9)
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1e9
}

// Format SOL amount for display
export function formatSol(lamports: number, decimals: number = 4): string {
  return lamportsToSol(lamports).toFixed(decimals)
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}
