/**
 * Production Test - Tests against deployed AgentPoker
 */

const baseUrl = 'https://agent-poker-theta.vercel.app'
const tableId = 'table-1'

// Generate unique agents for this test run
const runId = Date.now().toString(36).slice(-6)
const TEST_AGENTS = [
  { name: `ProdAgent1-${runId}`, walletPubkey: `0xWallet1${runId}` },
  { name: `ProdAgent2-${runId}`, walletPubkey: `0xWallet2${runId}` },
]

async function testGame() {
  console.log('\n🎲 AgentPoker Production Test')
  console.log(`   Target: ${baseUrl}`)
  console.log(`   Table: ${tableId}`)
  console.log(`   Agents: ${TEST_AGENTS.map(a => a.name).join(', ')}\n`)
  
  // Check server
  const res = await fetch(`${baseUrl}/api/tables`)
  const data = await res.json()
  console.log(`✅ Server online - ${data.tables?.length || 0} tables\n`)
  
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
      console.log(`   ✅ ${data.name} → ${data.apiKey.slice(0, 25)}...`)
    } else {
      console.log(`   ❌ ${agent.name}: ${await res.text()}`)
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
  
  // Check table status
  console.log('\n📊 Table status:')
  const statusRes = await fetch(`${baseUrl}/api/tables`)
  const statusData = await statusRes.json()
  const table = statusData.tables.find((t: any) => t.id === tableId)
  console.log(`   Players: ${table?.playerCount || 0}`)
  console.log(`   Status: ${table?.status}`)
  console.log(`   Game: ${table?.currentGame ? 'Active' : 'None'}\n`)
  
  // Watch for gameplay
  console.log('🎲 Playing poker (30 seconds)...\n')
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
  }, 1000)
  
  setTimeout(() => {
    clearInterval(interval)
    console.log(`\n✅ Test complete! ${actions} actions played\n`)
    process.exit(0)
  }, 30000)
  
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\n🛑 Stopped\n')
    process.exit(0)
  })
}

testGame().catch(console.error)
