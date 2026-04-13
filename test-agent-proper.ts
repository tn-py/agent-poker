/**
 * Proper Test Agent - Uses viem for real wallet signing
 * 
 * Creates test wallets on-the-fly and signs auth challenges
 * 
 * Usage:
 *   LOCAL:   npx tsx test-agent-proper.ts
 *   PROD:    BASE_URL=https://agent-poker-theta.vercel.app npx tsx test-agent-proper.ts
 */

import { RandomAgent } from './agents/random-agent'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const tableId = process.env.TABLE_ID || 'table-1'
const agentCount = parseInt(process.env.AGENT_COUNT || '2')

// Generate deterministic private keys from index for testing
function getTestPrivateKey(index: number): `0x${string}` {
  // Deterministic but "random-looking" keys for testing
  // In production, use proper secure key generation
  const basePrivateKey = '0x' + (index + 1).toString().padStart(64, 'abc123def456')
  return basePrivateKey as `0x${string}`
}

interface AgentInstance {
  id: number
  name: string
  walletAddress: string
  apiKey: string
  agent: RandomAgent
  tokenBalance: number
}

async function authenticateAgent(index: number): Promise<AgentInstance> {
  // Create wallet
  const privateKey = getTestPrivateKey(index)
  const account = privateKeyToAccount(privateKey)
  const walletAddress = account.address
  
  console.log(`\n🤖 Creating Agent ${index + 1}...`)
  console.log(`   Wallet: ${walletAddress}`)
  
  // 1. Get challenge
  const challengeRes = await fetch(`${baseUrl}/api/auth/challenge?walletAddress=${walletAddress}`)
  const challengeData = await challengeRes.json()
  
  if (!challengeData.challenge) {
    throw new Error(`Failed to get challenge: ${JSON.stringify(challengeData)}`)
  }
  
  console.log(`   Challenge received`)
  
  // 2. Sign challenge
  const signature = await account.signMessage({
    message: challengeData.challenge,
  })
  
  console.log(`   Signed challenge`)
  
  // 3. Verify and get API key
  const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      signature,
      challenge: challengeData.challenge,
    }),
  })
  
  const verifyData = await verifyRes.json()
  
  if (verifyData.error) {
    throw new Error(`Verification failed: ${verifyData.error}`)
  }
  
  console.log(`   ✅ Verified: ${verifyData.name}`)
  console.log(`   💰 Token Balance: ${verifyData.tokenBalance}`)
  
  // 4. Create agent instance
  const agent = new RandomAgent({
    apiKey: verifyData.apiKey,
    baseUrl,
    tableId,
    buyIn: 1000,
    pollIntervalMs: 1000,
  })
  
  return {
    id: index + 1,
    name: verifyData.name,
    walletAddress,
    apiKey: verifyData.apiKey,
    agent,
    tokenBalance: verifyData.tokenBalance,
  }
}

async function main() {
  console.log(`\n🎲 AgentPoker Test Suite`)
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Table: ${tableId}`)
  console.log(`   Agents: ${agentCount}\n`)
  
  // Check server health
  try {
    const health = await fetch(`${baseUrl}/api/tables`)
    const tables = await health.json()
    console.log(`✅ Server online - ${tables.tables?.length || 0} tables available`)
    console.log(`   Tables: ${tables.tables.map((t: any) => t.name).join(', ')}\n`)
  } catch (error) {
    console.error(`❌ Cannot reach server at ${baseUrl}`)
    process.exit(1)
  }
  
  // Authenticate all agents
  console.log(`🔐 Authenticating ${agentCount} agents...`)
  const agents: AgentInstance[] = []
  
  for (let i = 0; i < agentCount; i++) {
    try {
      const agent = await authenticateAgent(i)
      agents.push(agent)
    } catch (error) {
      console.error(`   ❌ Agent ${i + 1} failed:`, error)
    }
  }
  
  if (agents.length < 2) {
    console.error('\n❌ Need at least 2 agents to test poker')
    process.exit(1)
  }
  
  const totalTokens = agents.reduce((sum, a) => sum + a.tokenBalance, 0)
  console.log(`\n📊 ${agents.length} agents ready with ${totalTokens} total tokens`)
  
  // Start all agents
  console.log(`\n🎮 Starting gameplay...`)
  console.log(`   Press Ctrl+C to stop\n`)
  
  // Handle graceful shutdown
  let stopping = false
  process.on('SIGINT', () => {
    if (stopping) return
    stopping = true
    console.log('\n\n🛑 Stopping agents...')
    agents.forEach(a => a.agent.stop())
    setTimeout(() => process.exit(0), 1000)
  })
  
  // Run agents concurrently
  await Promise.all(
    agents.map(async ({ agent, name }) => {
      try {
        await agent.start()
      } catch (error) {
        console.error(`\n❌ Agent ${name} crashed:`, error)
      }
    })
  )
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
