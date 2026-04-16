/**
 * Gemini 3-Agent Test for AgentPoker
 *
 * Spawns 3 AI agents powered by Google Gemini 2.0 Flash Lite (free tier).
 * API key is read from OpenClaw's auth-profiles at runtime.
 *
 * Usage:
 *   npx tsx test-gemini-agents.ts
 *   BASE_URL=http://localhost:3000 TABLE_ID=table-1 npx tsx test-gemini-agents.ts
 */

import { GeminiAgent } from './agents/gemini-agent'
import { privateKeyToAccount } from 'viem/accounts'
import path from 'path'
import fs from 'fs'
import os from 'os'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TABLE_ID = process.env.TABLE_ID || 'table-1'
const AGENT_COUNT = parseInt(process.env.AGENT_COUNT || '3')
const BUY_IN = 50
// Stagger agent starts so they don't all poll simultaneously
const AGENT_START_DELAY_MS = 800

// ── Load API keys from OpenClaw auth-profiles ─────────────────────────────────

interface ApiKeys {
  googleApiKey?: string
  openrouterToken?: string
}

function loadApiKeys(): ApiKeys {
  const profilePaths = [
    path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json'),
    path.join(os.homedir(), '.openclaw', 'agents', 'system-agent', 'agent', 'auth-profiles.json'),
  ]

  for (const p of profilePaths) {
    try {
      const raw = fs.readFileSync(p, 'utf8')
      const profiles = JSON.parse(raw)?.profiles ?? {}
      const googleKey = profiles['google:default']?.key
      const openrouterToken =
        profiles['openrouter:manual']?.token ?? profiles['openrouter:default']?.token
      if (googleKey || openrouterToken) {
        console.log(`   API keys loaded from: ${p}`)
        return { googleApiKey: googleKey, openrouterToken }
      }
    } catch {
      // try next
    }
  }

  // Fallback to env vars
  return {
    googleApiKey: process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openrouterToken: process.env.OPENROUTER_TOKEN ?? process.env.OPENROUTER_API_KEY,
  }
}

// ── Deterministic test wallets ────────────────────────────────────────────────

function getTestPrivateKey(index: number): `0x${string}` {
  // Deterministic keys for testing — each index produces a unique key
  const hex = (index + 1).toString(16).padStart(64, '0')
  return `0x${hex}` as `0x${string}`
}

// ── Auth: challenge → sign → API key ─────────────────────────────────────────

interface AuthResult {
  apiKey: string
  name: string
  tokenBalance: number
  walletAddress: string
}

async function authenticateAgent(index: number): Promise<AuthResult> {
  const privateKey = getTestPrivateKey(index)
  const account = privateKeyToAccount(privateKey)
  const walletAddress = account.address

  // 1. Get challenge
  const challengeRes = await fetch(
    `${BASE_URL}/api/auth/challenge?walletAddress=${walletAddress}`
  )
  const challengeData = await challengeRes.json()
  if (!challengeData.challenge) {
    throw new Error(`Challenge failed: ${JSON.stringify(challengeData)}`)
  }

  // 2. Sign challenge
  const signature = await account.signMessage({ message: challengeData.challenge })

  // 3. Verify → get API key
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, challenge: challengeData.challenge }),
  })
  const verifyData = await verifyRes.json()
  if (verifyData.error) throw new Error(`Verify failed: ${verifyData.error}`)

  return {
    apiKey: verifyData.apiKey,
    name: verifyData.name,
    tokenBalance: verifyData.tokenBalance,
    walletAddress,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎲 AgentPoker — Gemini 3-Agent Test')
  console.log('=====================================')
  console.log(`   Target : ${BASE_URL}`)
  console.log(`   Table  : ${TABLE_ID}`)
  console.log(`   Agents : ${AGENT_COUNT}`)
  console.log(`   Model  : gemini-2.0-flash-lite (free tier)\n`)

  // 1. Server health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/tables`)
    const health = await healthRes.json()
    const tables: any[] = health.tables ?? []
    console.log(`✅ Server online — ${tables.length} table(s)`)
    tables.forEach((t) => console.log(`   • ${t.name} (${t.id}) — ${t.playerCount} players`))
    console.log()
  } catch {
    console.error(`❌ Cannot reach server at ${BASE_URL}`)
    console.error('   Start the dev server: cd ~/.openclaw/workspace/agent-poker && npm run dev')
    process.exit(1)
  }

  // 2. Load API keys
  const apiKeys = loadApiKeys()
  const { googleApiKey, openrouterToken } = apiKeys

  if (!googleApiKey && !openrouterToken) {
    console.error('❌ No API keys found in OpenClaw auth-profiles or environment variables.')
    console.error('   Expected: ~/.openclaw/agents/main/agent/auth-profiles.json')
    process.exit(1)
  }

  // Prefer OpenRouter for free models (Google quota may be exhausted)
  const backend: 'google' | 'openrouter' = openrouterToken ? 'openrouter' : 'google'
  // Use llama-3.2-3b — small, fast, fewer upstream rate limits than Gemma
  const modelId =
    backend === 'openrouter' ? 'meta-llama/llama-3.2-3b-instruct:free' : 'gemini-2.0-flash-lite'

  console.log(`✅ Backend: ${backend} | Model: ${modelId}\n`)

  // 3. Quick LLM connectivity check
  console.log(`🔍 Testing ${backend} API connectivity...`)
  try {
    let reply = ''
    if (backend === 'openrouter') {
      const testRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterToken}`,
          'HTTP-Referer': 'https://agent-poker',
          'X-Title': 'AgentPoker',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Say "ready" in one word.' }],
          max_tokens: 10,
        }),
      })
      if (testRes.status === 429) {
        console.log('⚠️  LLM rate-limited on check — will use random fallback as needed\n')
      } else {
        if (!testRes.ok) throw new Error(`${testRes.status}: ${await testRes.text().then(t => t.slice(0, 200))}`)
        const d = await testRes.json()
        reply = d.choices?.[0]?.message?.content?.trim() ?? ''
        console.log(`✅ LLM reachable — response: "${reply}"\n`)
      }
    } else {
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "ready" in one word.' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      )
      if (!testRes.ok) throw new Error(`${testRes.status}: ${await testRes.text().then(t => t.slice(0, 200))}`)
      const d = await testRes.json()
      reply = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
      console.log(`✅ LLM reachable — response: "${reply}"\n`)
    }
  } catch (err: any) {
    console.error(`❌ ${backend} API test failed:`, err.message)
    process.exit(1)
  }

  // 4. Authenticate agents
  console.log(`🔐 Authenticating ${AGENT_COUNT} agents...`)
  const authResults: AuthResult[] = []
  for (let i = 0; i < AGENT_COUNT; i++) {
    try {
      const auth = await authenticateAgent(i)
      authResults.push(auth)
      console.log(`   ✅ ${auth.name} (${auth.walletAddress.slice(0, 10)}...) — ${auth.tokenBalance} tokens`)
    } catch (err: any) {
      console.error(`   ❌ Agent ${i + 1} auth failed:`, err.message)
    }
  }

  if (authResults.length < 2) {
    console.error('\n❌ Need at least 2 authenticated agents. Aborting.')
    process.exit(1)
  }
  console.log()

  // 5. Create Gemini agents
  const personalities = [
    "You are an aggressive poker player who likes to bluff and put pressure on opponents.",
    "You are a tight-passive poker player who only plays premium hands and rarely bluffs.",
    "You are a loose-aggressive player who plays many hands and bets frequently.",
  ]

  let roundCompleted = false
  let completedHandNumber = -1

  const agents = authResults.map((auth, i) =>
    new GeminiAgent({
      apiKey: auth.apiKey,
      baseUrl: BASE_URL,
      tableId: TABLE_ID,
      buyIn: BUY_IN,
      pollIntervalMs: 4000,  // slow poll keeps us under 16 req/min free limit
      backend,
      model: modelId,
      googleApiKey,
      openrouterToken,
      personality: personalities[i % personalities.length],
      agentName: auth.name,
    })
  )

  // Set round-complete callbacks on all agents
  agents.forEach((agent, i) => {
    agent.onRoundComplete = (handNumber) => {
      if (!roundCompleted) {
        roundCompleted = true
        completedHandNumber = handNumber
        console.log(`\n🎉 Round ${handNumber} completed successfully!`)
        console.log('   All agents played through a full hand.\n')

        // Stop all agents gracefully
        setTimeout(() => {
          agents.forEach((a) => a.stop())
          console.log('✅ Test passed — agents completed a round without errors.')
          process.exit(0)
        }, 2000)
      }
    }
  })

  // Graceful shutdown on Ctrl+C
  let stopping = false
  process.on('SIGINT', () => {
    if (stopping) return
    stopping = true
    console.log('\n\n🛑 Interrupted — stopping agents...')
    agents.forEach((a) => a.stop())
    setTimeout(() => {
      if (roundCompleted) {
        console.log(`✅ Test passed before interrupt (hand ${completedHandNumber})`)
        process.exit(0)
      } else {
        console.log('⚠️  Test stopped before a round completed.')
        process.exit(1)
      }
    }, 1500)
  })

  // 6. Clear the table first so we start fresh
  await fetch(`${BASE_URL}/api/debug/clear-table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId: TABLE_ID }),
  }).catch(() => {})

  // 7. Run all agents, staggered so they don't all poll at the same moment
  console.log('🎮 Starting gameplay — waiting for agents to complete a full round...')
  console.log('   Press Ctrl+C to stop early\n')

  await Promise.all(
    agents.map(async (agent, i) => {
      if (i > 0) await new Promise(r => setTimeout(r, AGENT_START_DELAY_MS * i))
      try {
        await agent.start()
      } catch (err: any) {
        console.error(`\n❌ ${authResults[i].name} crashed:`, err.message)
      }
    })
  )
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
