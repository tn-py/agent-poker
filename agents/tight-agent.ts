/**
 * Tight Agent - A conservative poker agent that only plays premium hands
 */

interface Card {
  rank: string
  suit: string
}

interface LegalAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'
  minAmount?: number
  maxAmount?: number
}

interface Player {
  id: string
  name: string
  chips: number
  holeCards: Card[]
}

interface GameState {
  phase: string
  players: Player[]
  communityCards: Card[]
  pots: Array<{ amount: number }>
  currentBet: number
  bigBlind: number
}

interface AgentConfig {
  apiKey: string
  baseUrl: string
  tableId: string
  buyIn: number
  pollIntervalMs?: number
}

const PREMIUM_HANDS = new Set([
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
  'AKs', 'AQs', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs',
  'AKo', 'AQo', 'AJo',
])

const PLAYABLE_HANDS = new Set([
  ...PREMIUM_HANDS,
  '66', '55', '44', '33', '22',
  'KTs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s',
  'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'KQo', 'KJo', 'QJo',
])

export class TightAgent {
  private config: AgentConfig
  private running = false

  constructor(config: AgentConfig) {
    this.config = { pollIntervalMs: 500, ...config }
  }

  async start(): Promise<void> {
    this.running = true
    const joinResult = await this.joinTable()
    if (!joinResult.success) {
      console.error('Failed to join:', joinResult.error)
      return
    }

    while (this.running) {
      try {
        const state = await this.getGameState()
        if (state.actionRequired && state.legalActions.length > 0) {
          const action = this.selectAction(state.gameState, state.legalActions)
          await this.submitAction(action.type, action.amount)
        }
      } catch (error) {
        console.error('Error:', error)
      }
      await this.sleep(this.config.pollIntervalMs!)
    }
  }

  stop(): void {
    this.running = false
  }

  private selectAction(gameState: GameState | null, legalActions: LegalAction[]): { type: string; amount?: number } {
    if (!gameState) {
      const check = legalActions.find(a => a.type === 'check')
      return check ? { type: 'check' } : { type: 'fold' }
    }

    const holeCards = this.getMyHoleCards(gameState)
    
    if (gameState.phase === 'preflop') {
      return this.preflopStrategy(holeCards, legalActions, gameState)
    }
    return this.postflopStrategy(holeCards, gameState.communityCards, legalActions)
  }

  private preflopStrategy(holeCards: Card[], legalActions: LegalAction[], gameState: GameState): { type: string; amount?: number } {
    const strength = this.evaluateStartingHand(holeCards)
    
    if (strength === 'premium') {
      const raise = legalActions.find(a => a.type === 'raise')
      if (raise?.minAmount) {
        const amount = Math.min(gameState.bigBlind * 3, raise.maxAmount || gameState.bigBlind * 3)
        return { type: 'raise', amount }
      }
      return legalActions.find(a => a.type === 'call') ? { type: 'call' } : { type: 'check' }
    }

    if (strength === 'playable') {
      if (legalActions.find(a => a.type === 'call')) return { type: 'call' }
      if (legalActions.find(a => a.type === 'check')) return { type: 'check' }
    }

    return legalActions.find(a => a.type === 'check') ? { type: 'check' } : { type: 'fold' }
  }

  private postflopStrategy(holeCards: Card[], communityCards: Card[], legalActions: LegalAction[]): { type: string; amount?: number } {
    if (legalActions.find(a => a.type === 'check')) return { type: 'check' }
    
    if (this.hasPair(holeCards, communityCards)) {
      if (legalActions.find(a => a.type === 'call')) return { type: 'call' }
    }
    return { type: 'fold' }
  }

  private evaluateStartingHand(cards: Card[]): 'premium' | 'playable' | 'weak' {
    if (cards.length !== 2) return 'weak'
    const [c1, c2] = cards
    const ranks = [c1.rank, c2.rank].sort().reverse()
    const suited = c1.suit === c2.suit
    let key = ranks[0] === ranks[1] ? ranks[0] + ranks[1] : ranks[0] + ranks[1] + (suited ? 's' : 'o')
    key = key.replace(/10/g, 'T')
    if (PREMIUM_HANDS.has(key)) return 'premium'
    if (PLAYABLE_HANDS.has(key)) return 'playable'
    return 'weak'
  }

  private hasPair(holeCards: Card[], communityCards: Card[]): boolean {
    const counts = new Map<string, number>()
    for (const c of [...holeCards, ...communityCards]) {
      counts.set(c.rank, (counts.get(c.rank) || 0) + 1)
    }
    for (const count of counts.values()) {
      if (count >= 2) return true
    }
    return false
  }

  private getMyHoleCards(gameState: GameState): Card[] {
    for (const p of gameState.players) {
      if (p.holeCards?.length === 2) return p.holeCards
    }
    return []
  }

  private async joinTable(): Promise<{ success: boolean; seatIndex?: number; error?: string }> {
    const res = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join', buyIn: this.config.buyIn }),
    })
    return res.json()
  }

  private async getGameState(): Promise<{ gameState: GameState | null; actionRequired: boolean; legalActions: LegalAction[] }> {
    const res = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
    })
    return res.json()
  }

  private async submitAction(action: string, amount?: number): Promise<{ success: boolean }> {
    const res = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'action', action, amount }),
    })
    return res.json()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }
}
