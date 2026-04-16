/**
 * GeminiAgent - AI-powered poker agent using free LLM models
 *
 * Supports two backends:
 *   - Google Gemini direct API (gemini-2.0-flash-lite, etc.)
 *   - OpenRouter free models (google/gemma-4-31b-it:free, etc.)
 *
 * No @ai-sdk/gateway required.
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
  /** Google Gemini API key (used when backend='google') */
  googleApiKey?: string
  /** OpenRouter token (used when backend='openrouter') */
  openrouterToken?: string
  /** 'google' | 'openrouter' — defaults to 'openrouter' if googleApiKey absent */
  backend?: 'google' | 'openrouter'
  model?: string
  personality?: string
  agentName?: string
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export class GeminiAgent {
  private config: AgentConfig
  private running = false
  private lastHandNumber = -1
  public onRoundComplete?: (handNumber: number) => void

  constructor(config: AgentConfig) {
    // Default backend: openrouter if no googleApiKey, else google
    const backend = config.backend ?? (config.googleApiKey ? 'google' : 'openrouter')
    const defaultModel =
      backend === 'openrouter' ? 'google/gemma-4-31b-it:free' : 'gemini-2.0-flash-lite'

    this.config = {
      pollIntervalMs: 1500,
      backend,
      model: defaultModel,
      ...config,
    }
  }

  async start(): Promise<void> {
    this.running = true

    const joinResult = await this.joinTable()
    if (!joinResult.success) {
      console.error(`[${this.config.agentName}] Failed to join table:`, joinResult.error)
      return
    }
    console.log(`[${this.config.agentName}] Joined table at seat ${joinResult.seatIndex}`)

    while (this.running) {
      try {
        const state = await this.getGameState()

        // Detect round completion (hand number advanced)
        if (
          state.gameState &&
          state.gameState.handNumber > this.lastHandNumber &&
          this.lastHandNumber !== -1
        ) {
          console.log(`[${this.config.agentName}] Round ${this.lastHandNumber} complete!`)
          this.onRoundComplete?.(this.lastHandNumber)
        }
        if (state.gameState) {
          this.lastHandNumber = state.gameState.handNumber
        }

        // Debug: show what this agent sees on every poll
        const phase = state.gameState?.phase ?? 'no-game'
        const currentPlayerId = state.gameState?.players[state.gameState?.currentPlayerIndex ?? -1]?.id ?? 'none'
        console.log(
          `[${this.config.agentName}] poll phase=${phase} actionRequired=${state.actionRequired} currentPlayer=${currentPlayerId}`
        )

        if (state.actionRequired && state.legalActions.length > 0) {
          const action = await this.selectAction(state.gameState, state.legalActions)
          console.log(
            `[${this.config.agentName}] ${action.type}${action.amount ? ` ${action.amount}` : ''}` +
            (action.reasoning ? ` — ${action.reasoning}` : '')
          )
          await this.submitAction(action.type, action.amount)
        }
      } catch (error: any) {
        if (!this.running) break
        console.error(`[${this.config.agentName}] Game loop error:`, error.message)
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
      const checkAction = legalActions.find((a) => a.type === 'check')
      return checkAction ? { type: 'check' } : { type: 'fold' }
    }

    try {
      const prompt = this.buildPrompt(gameState, legalActions)
      const text = await this.callGemini(prompt)
      return this.parseResponse(text, legalActions)
    } catch (error: any) {
      console.error(`[${this.config.agentName}] Gemini error, falling back to random:`, error.message)
      const action = legalActions[Math.floor(Math.random() * legalActions.length)]
      return { type: action.type, amount: action.minAmount }
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    return this.config.backend === 'openrouter'
      ? this.callOpenRouter(prompt)
      : this.callGoogleDirect(prompt)
  }

  private async callGoogleDirect(prompt: string): Promise<string> {
    const url = `${GEMINI_API_URL}/${this.config.model}:generateContent?key=${this.config.googleApiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Google API ${res.status}: ${err.slice(0, 200)}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.openrouterToken}`,
        'HTTP-Referer': 'https://agent-poker',
        'X-Title': 'AgentPoker',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  private buildPrompt(gameState: GameState, legalActions: LegalAction[]): string {
    const myPlayer = gameState.players.find((p) => p.holeCards && p.holeCards.length === 2)
    const holeCards = myPlayer?.holeCards ?? []
    const myChips = myPlayer?.chips ?? 0
    const pot = gameState.pots.reduce((s, p) => s + p.amount, 0)

    const holeStr = holeCards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit] ?? c.suit}`).join(' ')
    const commStr = gameState.communityCards
      .map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit] ?? c.suit}`)
      .join(' ')

    const opponents = gameState.players
      .filter((p) => p.id !== myPlayer?.id && p.status !== 'folded' && p.status !== 'out')
      .map((p) => `${p.name}: ${p.chips} chips, bet ${p.currentBet}`)
      .join('\n')

    const actionsStr = legalActions
      .map((a) =>
        a.minAmount && a.maxAmount ? `${a.type}(min:${a.minAmount},max:${a.maxAmount})` : a.type
      )
      .join(', ')

    const personality =
      this.config.personality ??
      "You are a strategic Texas Hold'em poker player. Be concise."

    return `${personality}

Phase: ${gameState.phase} | Hand #${gameState.handNumber}
Your cards: ${holeStr || 'unknown'} | Community: ${commStr || 'none'}
Pot: ${pot} | Your chips: ${myChips} | To call: ${gameState.currentBet}
Opponents: ${opponents || 'none'}
Legal moves: ${actionsStr}

Reply in EXACTLY this format (3 lines):
ACTION: <one of ${legalActions.map((a) => a.type).join('/')}>
AMOUNT: <integer or 0>
REASONING: <one sentence>`
  }

  private parseResponse(
    response: string,
    legalActions: LegalAction[]
  ): { type: string; amount?: number; reasoning?: string } {
    let action = ''
    let amount: number | undefined
    let reasoning: string | undefined

    for (const line of response.split('\n')) {
      const upper = line.toUpperCase().trim()
      if (upper.startsWith('ACTION:')) {
        action = line.split(':')[1]?.trim().toLowerCase() ?? ''
      } else if (upper.startsWith('AMOUNT:')) {
        const parsed = parseInt(line.split(':')[1]?.trim() ?? '')
        if (!isNaN(parsed) && parsed > 0) amount = parsed
      } else if (upper.startsWith('REASONING:')) {
        reasoning = line.split(':').slice(1).join(':').trim()
      }
    }

    const legalAction = legalActions.find((a) => a.type === action)
    if (!legalAction) {
      const check = legalActions.find((a) => a.type === 'check')
      return { type: check ? 'check' : 'fold', reasoning }
    }

    if ((action === 'bet' || action === 'raise') && legalAction.minAmount) {
      if (!amount || amount < legalAction.minAmount) amount = legalAction.minAmount
      if (legalAction.maxAmount && amount > legalAction.maxAmount) amount = legalAction.maxAmount
    }

    return { type: action, amount, reasoning }
  }

  private async joinTable(): Promise<{ success: boolean; seatIndex?: number; error?: string }> {
    const res = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'join', buyIn: this.config.buyIn }),
    })
    return res.json()
  }

  private async getGameState(): Promise<{
    gameState: GameState | null
    actionRequired: boolean
    legalActions: LegalAction[]
  }> {
    const res = await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    })
    return res.json()
  }

  private async submitAction(action: string, amount?: number): Promise<void> {
    await fetch(`${this.config.baseUrl}/api/tables/${this.config.tableId}/action`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'action', action, amount }),
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
