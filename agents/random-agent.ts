/**
 * Random Agent - A baseline poker agent that plays random legal actions
 * 
 * This agent serves as a baseline for testing and comparison.
 * It simply picks a random legal action each time it's its turn.
 */

interface LegalAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'
  minAmount?: number
  maxAmount?: number
}

interface GameState {
  phase: string
  players: Array<{
    id: string
    name: string
    chips: number
    holeCards: Array<{ rank: string; suit: string }>
  }>
  communityCards: Array<{ rank: string; suit: string }>
  pots: Array<{ amount: number }>
}

interface AgentConfig {
  apiKey: string
  baseUrl: string
  tableId: string
  buyIn: number
  pollIntervalMs?: number
}

export class RandomAgent {
  private config: AgentConfig
  private running = false

  constructor(config: AgentConfig) {
    this.config = {
      pollIntervalMs: 500,
      ...config,
    }
  }

  async start(): Promise<void> {
    this.running = true
    
    // Join the table
    const joinResult = await this.joinTable()
    if (!joinResult.success) {
      console.error('Failed to join table:', joinResult.error)
      return
    }
    console.log(`Joined table at seat ${joinResult.seatIndex}`)

    // Main game loop
    while (this.running) {
      try {
        const state = await this.getGameState()
        
        if (state.actionRequired && state.legalActions.length > 0) {
          const action = this.selectAction(state.legalActions)
          console.log(`Taking action: ${action.type}${action.amount ? ` ${action.amount}` : ''}`)
          
          await this.submitAction(action.type, action.amount)
        }
      } catch (error) {
        console.error('Error in game loop:', error)
      }

      await this.sleep(this.config.pollIntervalMs!)
    }
  }

  stop(): void {
    this.running = false
  }

  private selectAction(legalActions: LegalAction[]): { type: string; amount?: number } {
    // Pick a random action
    const action = legalActions[Math.floor(Math.random() * legalActions.length)]
    
    // For bet/raise, pick a random amount within the allowed range
    let amount: number | undefined
    if ((action.type === 'bet' || action.type === 'raise') && action.minAmount && action.maxAmount) {
      // Randomly choose between min, mid, or max bet
      const choices = [
        action.minAmount,
        Math.floor((action.minAmount + action.maxAmount) / 2),
        action.maxAmount,
      ]
      amount = choices[Math.floor(Math.random() * choices.length)]
    }

    return { type: action.type, amount }
  }

  private async joinTable(): Promise<{ success: boolean; seatIndex?: number; error?: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'join',
        buyIn: this.config.buyIn,
      }),
    })

    return response.json()
  }

  private async getGameState(): Promise<{
    gameState: GameState | null
    actionRequired: boolean
    legalActions: LegalAction[]
  }> {
    const response = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    })

    return response.json()
  }

  private async submitAction(action: string, amount?: number): Promise<{ success: boolean }> {
    const response = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'action',
        action,
        amount,
      }),
    })

    return response.json()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI runner
if (typeof process !== 'undefined' && process.argv[1]?.includes('random-agent')) {
  const apiKey = process.env.AGENT_API_KEY
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const tableId = process.env.TABLE_ID || 'table-1'
  const buyIn = parseInt(process.env.BUY_IN || '1000')

  if (!apiKey) {
    console.error('AGENT_API_KEY environment variable is required')
    process.exit(1)
  }

  const agent = new RandomAgent({ apiKey, baseUrl, tableId, buyIn })
  agent.start()

  process.on('SIGINT', () => {
    console.log('Stopping agent...')
    agent.stop()
    process.exit(0)
  })
}
