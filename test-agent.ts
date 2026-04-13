/**
 * Quick Test Agent - Deploys subagents to test AgentPoker
 * 
 * Usage: 
 *   LOCAL:  BASE_URL=http://localhost:3000 npx tsx test-agent.ts
 *   PROD:   BASE_URL=https://agent-poker-theta.vercel.app npx tsx test-agent.ts
 */

import { RandomAgent } from './agents/random-agent'

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const tableId = process.env.TABLE_ID || 'table-1'

// Test wallet for local testing (no real funds needed)
const TEST_WALLET = '0x742d35cc90d9cF1D0b8cB55c3b7a9E5e6aF9021a'

interface AgentInstance {
  id: number
  name: string
  apiKey: string
  agent: RandomAgent
}

async function getChallenge(walletAddress: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/challenge?walletAddress=${walletAddress}`)
  const data = await res.json()
  if (!data.challenge) throw new Error('Failed to get challenge: ' + JSON.stringify(data))
  return data.challenge
}

async function verifyAgent(walletAddress: string): Promise<{ apiKey: string; tokenBalance: number }> {
  // For testing, we simulate signature verification
  // In production, agents would actually sign with their private key
  const challenge = await getChallenge(walletAddress)
  
  // Mock signature (in production, use viem/signMessage)
  const mockSignature = '0x' + 'a'.repeat(130)
  
  const res = await fetch(`${baseUrl}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      signature: mockSignature,
      challenge,
    }),
  })
  
  const data = await res.json()
  if (data.error) throw new Error(`Verify failed: ${data.error}`)
  
  console.log(`✅ Agent verified: ${data.name}`)
  console.log(`   API Key: ${data.apiKey.slice(0, 20)}...`)
  console.log(`   Token Balance: ${data.tokenBalance}`)
  
  return { apiKey: data.apiKey, tokenBalance: data.tokenBalance }
}

async function spawnTestAgents(count: number): Promise<AgentInstance[]> {
  const agents: AgentInstance[] = []
  
  for (let i = 0; i < count; i++) {
    // Create unique wallet per agent
    const walletAddress = `0x${(i + 1).toString(16).padStart(40, '0')}`
    
    try {
      const { apiKey, tokenBalance } = await verifyAgent(walletAddress)
      
      const agent = new RandomAgent({
        apiKey,
        baseUrl,
        tableId,
        buyIn: 1000,
        pollIntervalMs: 1000,
      })
      
      agents.push({
        id: i + 1,
        name: `TestAgent-${i + 1}`,
        apiKey,
        agent,
      })
      
      console.log(`🤖 Spawned TestAgent-${i + 1} with ${tokenBalance} tokens\n`)
    } catch (error) {
      console.error(`❌ Failed to spawn agent ${i + 1}:`, error)
    }
  }
  
  return agents
}

async function main() {
  console.log(`\n🎲 AgentPoker Test Suite`)
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Table: ${tableId}\n`)
  
  // 1. Check if server is reachable
  try {
    const health = await fetch(`${baseUrl}/api/tables`)
    if (!health.ok) throw new Error('Server not responding')
    const tables = await health.json()
    console.log(`✅ Server online - ${tables.tables?.length || 0} tables available\n`)
  } catch (error) {
    console.error(`❌ Cannot reach server at ${baseUrl}`)
    console.error('   Make sure the server is running or use correct BASE_URL\n')
    process.exit(1)
  }
  
  // 2. Spawn test agents
  const agentCount = parseInt(process.env.AGENT_COUNT || '2')
  console.log(`🚀 Spawning ${agentCount} test agents...\n`)
  
  const agents = await spawnTestAgents(agentCount)
  
  if (agents.length < 2) {
    console.error('❌ Need at least 2 agents to test poker game')
    process.exit(1)
  }
  
  // 3. Start all agents
  console.log(`\n🎮 Starting gameplay...\n`)
  
  await Promise.all(
    agents.map(({ agent, name }) =>
      agent.start().catch(err => {
        console.error(`Agent ${name} crashed:`, err)
      })
    )
  )
}

main().catch(console.error)
