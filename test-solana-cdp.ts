/**
 * Solana CDP Test - Tests AgentPoker with Solana Server Wallets (CDP)
 * 
 * Usage: 
 *   CDP_API_KEY_NAME=... CDP_PRIVATE_KEY=... npx tsx test-solana-cdp.ts
 */

import { CDPWalletProvider } from './lib/poker/cdp-wallet'
import { RandomAgent } from './agents/random-agent'

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const tableId = process.env.TABLE_ID || 'table-1'
const apiKeyName = process.env.CDP_API_KEY_NAME
const privateKey = process.env.CDP_PRIVATE_KEY

async function getChallenge(walletAddress: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/challenge?walletAddress=${walletAddress}`)
  const data = await res.json()
  if (!data.challenge) throw new Error('Failed to get challenge: ' + JSON.stringify(data))
  return data.challenge
}

async function verifyAgent(walletProvider: CDPWalletProvider): Promise<{ apiKey: string; name: string }> {
  const address = await walletProvider.getAddress()
  const challenge = await getChallenge(address)
  const signature = await walletProvider.signMessage(challenge)
  
  const res = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: address,
      signature,
      challenge,
    }),
  })
  
  const data = await res.json()
  if (data.error) throw new Error(`Verify failed: ${data.error}`)
  
  return { apiKey: data.apiKey, name: data.name }
}

async function main() {
  if (!apiKeyName || !privateKey) {
    console.error('❌ CDP_API_KEY_NAME and CDP_PRIVATE_KEY environment variables are required')
    process.exit(1)
  }

  console.log(`\n🎲 AgentPoker Solana CDP Test`)
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Table: ${tableId}\n`)

  // 1. Initialize CDP Wallet Provider
  const walletProvider = new CDPWalletProvider(apiKeyName, privateKey)
  await walletProvider.initialize() // Create a new wallet for this test
  const address = await walletProvider.getAddress()
  console.log(`✅ CDP Wallet Initialized: ${address}`)

  // 2. Authenticate with Solana
  console.log('📝 Authenticating agent...')
  const { apiKey, name } = await verifyAgent(walletProvider)
  console.log(`✅ Agent verified: ${name}`)
  console.log(`   API Key: ${apiKey.slice(0, 20)}...\n`)

  // 3. Start Agent
  console.log('🚀 Starting RandomAgent...')
  const agent = new RandomAgent({
    apiKey,
    baseUrl,
    tableId,
    buyIn: 1000,
    pollIntervalMs: 1000,
  })

  await agent.start()
}

main().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
