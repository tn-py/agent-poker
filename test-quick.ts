/**
 * Quick Test - Clears table before testing
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const tableId = 'table-1'

// Generate unique agents for this test run
const runId = Date.now().toString(36).slice(-6)
const TEST_AGENTS = [
  { name: `Agent1-${runId}`, walletPubkey: `0xWallet1${runId}` },
  { name: `Agent2-${runId}`, walletPubkey: `0xWallet2${runId}` },
]

async function testGame() {
  console.log('\n🎲 AgentPoker Quick Test')
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Table: ${tableId}`)
  console.log(`   Agents: ${TEST_AGENTS.map(a => a.name).join(', ')}\n`)
  
  // Check server
  const res = await fetch(`${baseUrl}/api/tables`)
  const data = await res.json()
  console.log(`✅ Server online - ${data.tables?.length || 0} tables\n`)
  
  // Clear the table via debug API
  console.log('🧹 Clearing table...')
  await fetch(`${baseUrl}/api/debug/clear-table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId }),
  }).catch(() => {}) // Ignore errors
  console.log('   ✅ Table cleared\n')
  
  // Register agents
  console.log('📝 Registering agents...\n')
  const registeredAgents = []
  for (const agent of TEST_AGENTS) {
    const res = await fetch(`${baseUrl}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    })
    if (res.ok) {
      const data = await res.json()
      registeredAgents.push({ id: data.id, name: data.name, apiKey: data.apiKey })
      console.log(`   ✅ ${data.name} → ${data.apiKey.slice(0, 20)}...`)
    } else {
      console.log(`   ❌ ${agent.name}`)
    }
  }
  
  if (registeredAgents.length < 2) {
    console.log('\n❌ Need 2 agents to play')
    process.exit(1)
  }
  
  // Join table
  console.log('\n🎮 Joining table...\n')
  for (const agent of registeredAgents) {
    const res = await fetch(`${baseUrl}/api/tables/${tableId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agent.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'join', buyIn: 1000 }),
    })
    const result = await res.json()
    if (result.success) {
      console.log(`   ✅ ${agent.name} → seat ${result.seatIndex}`)
    } else {
      console.log(`   ❌ ${agent.name}: ${result.error}`)
    }
  }
  
  // Start the game manually (since we bypassed agentJoinTable)
  console.log('\n🚀 Starting game...')
  const startRes = await fetch(`${baseUrl}/api/tables/${tableId}/action`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${registeredAgents[0].apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'start' }),
  }).catch(() => ({ ok: false }))
  if (startRes.ok) {
    console.log('   ✅ Game started')
  } else {
    console.log('   ⚠️  Game may auto-start or start action not supported')
  }
  
  // Wait for game to initialize
  await new Promise(r => setTimeout(r, 2000))
  
  // Watch for gameplay
  console.log('\n🎲 Playing poker (20 seconds)...\n')
  let actions = 0
  
  const interval = setInterval(async () => {
    for (const agent of registeredAgents) {
      try {
        const res = await fetch(`${baseUrl}/api/tables/${tableId}/action`, {
          headers: { 'Authorization': `Bearer ${agent.apiKey}` },
        })
        const state = await res.json()
        
        if (state.actionRequired && state.legalActions?.length > 0) {
          const action = state.legalActions[Math.floor(Math.random() * state.legalActions.length)]
          actions++
          console.log(`   [${actions}] ${agent.name}: ${action.type}${action.minAmount ? ` ${action.minAmount}` : ''}`)
          
          await fetch(`${baseUrl}/api/tables/${tableId}/action`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${agent.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'action',
              action: action.type,
              amount: action.minAmount > 0 ? action.minAmount : undefined,
            }),
          })
        }
      } catch (e) {}
    }
  }, 800)
  
  setTimeout(() => {
    clearInterval(interval)
    console.log(`\n✅ Test complete! ${actions} actions played\n`)
    process.exit(0)
  }, 20000)
  
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\n🛑 Stopped\n')
    process.exit(0)
  })
}

testGame().catch(console.error)
