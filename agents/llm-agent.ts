/**
 * LLM Agent - An AI-powered poker agent using language models
 * 
 * This agent uses an LLM (via AI SDK) to reason about poker decisions.
 * It provides the LLM with the game state and asks it to choose an action.
 */

import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

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
  status: string
  currentBet: number
}

interface GameState {
  phase: string
  players: Player[]
  communityCards: Card[]
  pots: Array<{ amount: number }>
  currentBet: number
  bigBlind: number
  handNumber: number
}

interface AgentConfig {
  apiKey: string
  baseUrl: string
  tableId: string
  buyIn: number
  pollIntervalMs?: number
  model?: string
  personality?: string
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

export class LLMAgent {
  private config: AgentConfig
  private running = false
  private personality: string

  constructor(config: AgentConfig) {
    this.config = {
      pollIntervalMs: 1000, // Slower to account for LLM latency
      model: 'openai/gpt-4o-mini',
      ...config,
    }
    
    this.personality = config.personality || `You are a skilled poker player participating in a Texas Hold'em game.
You analyze the situation carefully and make strategic decisions.
You consider pot odds, position, opponent behavior, and hand strength.
You're not afraid to bluff occasionally but generally play solid poker.`
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
          const action = await this.selectAction(state.gameState, state.legalActions)
          console.log(`Taking action: ${action.type}${action.amount ? ` ${action.amount}` : ''}`)
          
          await this.submitAction(action.type, action.amount)
          
          // Send a chat message with reasoning
          if (action.reasoning) {
            await this.sendChat(action.reasoning)
          }
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

  private async selectAction(
    gameState: GameState | null,
    legalActions: LegalAction[]
  ): Promise<{ type: string; amount?: number; reasoning?: string }> {
    if (!gameState) {
      const checkAction = legalActions.find(a => a.type === 'check')
      if (checkAction) return { type: 'check' }
      return { type: 'fold' }
    }

    try {
      const prompt = this.buildPrompt(gameState, legalActions)
      
      const { text } = await generateText({
        model: gateway(this.config.model!),
        prompt,
        maxTokens: 300,
      })

      return this.parseResponse(text, legalActions)
    } catch (error) {
      console.error('LLM error, falling back to random:', error)
      // Fallback to random action
      const action = legalActions[Math.floor(Math.random() * legalActions.length)]
      return { type: action.type, amount: action.minAmount }
    }
  }

  private buildPrompt(gameState: GameState, legalActions: LegalAction[]): string {
    const myPlayer = gameState.players.find(p => p.holeCards && p.holeCards.length === 2)
    const holeCards = myPlayer?.holeCards || []
    const myChips = myPlayer?.chips || 0
    const pot = gameState.pots.reduce((s, p) => s + p.amount, 0)
    
    const holeCardsStr = holeCards.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(' ')
    const communityStr = gameState.communityCards.map(c => `${c.rank}${SUIT_SYMBOLS[c.suit]}`).join(' ')
    
    const opponents = gameState.players
      .filter(p => p.id !== myPlayer?.id && p.status !== 'folded' && p.status !== 'out')
      .map(p => `${p.name}: ${p.chips} chips, bet ${p.currentBet}`)
      .join('\n')

    const actionsStr = legalActions
      .map(a => {
        if (a.minAmount && a.maxAmount) {
          return `${a.type} (min: ${a.minAmount}, max: ${a.maxAmount})`
        }
        return a.type
      })
      .join(', ')

    return `${this.personality}

Current Game State:
- Phase: ${gameState.phase}
- Hand #${gameState.handNumber}
- Your hole cards: ${holeCardsStr || 'Unknown'}
- Community cards: ${communityStr || 'None yet'}
- Pot: ${pot}
- Your chips: ${myChips}
- Current bet to match: ${gameState.currentBet}
- Big blind: ${gameState.bigBlind}

Opponents still in hand:
${opponents || 'None'}

Legal actions: ${actionsStr}

Analyze the situation and decide your action. Respond in this exact format:
ACTION: <action_type>
AMOUNT: <amount or 0>
REASONING: <brief explanation in 1-2 sentences>

Choose one action from: ${legalActions.map(a => a.type).join(', ')}`
  }

  private parseResponse(
    response: string,
    legalActions: LegalAction[]
  ): { type: string; amount?: number; reasoning?: string } {
    const lines = response.split('\n')
    let action = 'fold'
    let amount: number | undefined
    let reasoning: string | undefined

    for (const line of lines) {
      const upperLine = line.toUpperCase().trim()
      
      if (upperLine.startsWith('ACTION:')) {
        const actionStr = line.split(':')[1]?.trim().toLowerCase()
        if (actionStr && legalActions.some(a => a.type === actionStr)) {
          action = actionStr
        }
      }
      
      if (upperLine.startsWith('AMOUNT:')) {
        const amountStr = line.split(':')[1]?.trim()
        const parsed = parseInt(amountStr)
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed
        }
      }
      
      if (upperLine.startsWith('REASONING:')) {
        reasoning = line.split(':').slice(1).join(':').trim()
      }
    }

    // Validate action is legal
    const legalAction = legalActions.find(a => a.type === action)
    if (!legalAction) {
      // Fallback to check or fold
      const checkAction = legalActions.find(a => a.type === 'check')
      if (checkAction) return { type: 'check', reasoning }
      return { type: 'fold', reasoning }
    }

    // Validate amount for bet/raise
    if ((action === 'bet' || action === 'raise') && legalAction.minAmount) {
      if (!amount || amount < legalAction.minAmount) {
        amount = legalAction.minAmount
      }
      if (legalAction.maxAmount && amount > legalAction.maxAmount) {
        amount = legalAction.maxAmount
      }
    }

    return { type: action, amount, reasoning }
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

  private async sendChat(message: string): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          message: message.slice(0, 280),
        }),
      })
    } catch {
      // Ignore chat errors
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI runner
if (typeof process !== 'undefined' && process.argv[1]?.includes('llm-agent')) {
  const apiKey = process.env.AGENT_API_KEY
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const tableId = process.env.TABLE_ID || 'table-1'
  const buyIn = parseInt(process.env.BUY_IN || '1000')
  const model = process.env.MODEL || 'openai/gpt-4o-mini'

  if (!apiKey) {
    console.error('AGENT_API_KEY environment variable is required')
    process.exit(1)
  }

  const agent = new LLMAgent({ apiKey, baseUrl, tableId, buyIn, model })
  agent.start()

  process.on('SIGINT', () => {
    console.log('Stopping agent...')
    agent.stop()
    process.exit(0)
  })
}
