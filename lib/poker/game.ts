import {
  GameState,
  GamePhase,
  Player,
  PlayerAction,
  ActionType,
  LegalAction,
  Card,
  Pot,
  WinnerInfo,
} from './types'
import { Deck } from './deck'
import { evaluateHand, compareHands, getHandDescription } from './hand-evaluator'

export class PokerGame {
  private state: GameState
  private deck: Deck

  constructor(
    tableId: string,
    players: Player[],
    smallBlind: number,
    bigBlind: number,
    dealerIndex: number = 0,
    seed?: string
  ) {
    const gameSeed = seed || crypto.randomUUID()
    this.deck = new Deck(gameSeed)

    this.state = {
      id: crypto.randomUUID(),
      tableId,
      phase: 'waiting',
      players: players.map((p, i) => ({
        ...p,
        currentBet: 0,
        holeCards: [],
        status: p.chips > 0 ? 'active' : 'out',
        isDealer: i === dealerIndex,
        isSmallBlind: false,
        isBigBlind: false,
      })),
      communityCards: [],
      pots: [{ amount: 0, eligiblePlayerIds: players.map((p) => p.id) }],
      currentBet: 0,
      minRaise: bigBlind,
      dealerIndex,
      currentPlayerIndex: 0,
      smallBlind,
      bigBlind,
      handNumber: 1,
      seed: gameSeed,
      actions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  // Start a new hand
  startHand(): void {
    const activePlayers = this.getActivePlayers()
    if (activePlayers.length < 2) {
      throw new Error('Need at least 2 active players to start a hand')
    }

    // Reset deck
    this.deck.reset()

    // Reset player states
    for (const player of this.state.players) {
      player.currentBet = 0
      player.holeCards = []
      player.status = player.chips > 0 ? 'active' : 'out'
      player.isDealer = false
      player.isSmallBlind = false
      player.isBigBlind = false
      player.lastAction = undefined
    }

    // Set dealer, SB, BB positions
    const activeIndices = this.getActivePlayerIndices()
    const dealerPos = activeIndices.indexOf(this.state.dealerIndex)
    const actualDealerIndex = activeIndices[dealerPos >= 0 ? dealerPos : 0]

    // Heads-up rules: dealer is SB
    if (activeIndices.length === 2) {
      const sbIndex = actualDealerIndex
      const bbIndex = this.getNextActivePlayerIndex(sbIndex)
      this.state.players[sbIndex].isDealer = true
      this.state.players[sbIndex].isSmallBlind = true
      this.state.players[bbIndex].isBigBlind = true
    } else {
      const sbIndex = this.getNextActivePlayerIndex(actualDealerIndex)
      const bbIndex = this.getNextActivePlayerIndex(sbIndex)
      this.state.players[actualDealerIndex].isDealer = true
      this.state.players[sbIndex].isSmallBlind = true
      this.state.players[bbIndex].isBigBlind = true
    }

    // Post blinds
    this.postBlinds()

    // Deal hole cards
    this.dealHoleCards()

    // Set phase and first to act
    this.state.phase = 'preflop'
    this.state.communityCards = []
    this.state.actions = []
    this.state.winners = undefined
    this.state.pots = [
      { amount: 0, eligiblePlayerIds: activePlayers.map((p) => p.id) },
    ]

    // First to act is player after BB in preflop
    const bbIndex = this.state.players.findIndex((p) => p.isBigBlind)
    this.state.currentPlayerIndex = this.getNextActivePlayerIndex(bbIndex)

    this.state.updatedAt = Date.now()
  }

  private postBlinds(): void {
    const sbPlayer = this.state.players.find((p) => p.isSmallBlind)
    const bbPlayer = this.state.players.find((p) => p.isBigBlind)

    if (sbPlayer) {
      const sbAmount = Math.min(this.state.smallBlind, sbPlayer.chips)
      sbPlayer.chips -= sbAmount
      sbPlayer.currentBet = sbAmount
    }

    if (bbPlayer) {
      const bbAmount = Math.min(this.state.bigBlind, bbPlayer.chips)
      bbPlayer.chips -= bbAmount
      bbPlayer.currentBet = bbAmount
    }

    this.state.currentBet = this.state.bigBlind
    this.state.minRaise = this.state.bigBlind
  }

  private dealHoleCards(): void {
    const activePlayers = this.getActivePlayers()
    for (const player of activePlayers) {
      player.holeCards = this.deck.dealMany(2)
    }
  }

  // Get legal actions for current player
  getLegalActions(): LegalAction[] {
    const player = this.getCurrentPlayer()
    if (!player || player.status !== 'active') {
      return []
    }

    const actions: LegalAction[] = []
    const toCall = this.state.currentBet - player.currentBet

    // Fold is always an option
    actions.push({ type: 'fold' })

    if (toCall === 0) {
      // Can check
      actions.push({ type: 'check' })
    } else {
      // Must call to stay in
      if (player.chips >= toCall) {
        actions.push({ type: 'call' })
      }
    }

    // Can bet/raise if has enough chips
    const minRaiseAmount = this.state.currentBet + this.state.minRaise
    if (player.chips + player.currentBet > this.state.currentBet) {
      if (this.state.currentBet === 0) {
        // Betting
        actions.push({
          type: 'bet',
          minAmount: this.state.bigBlind,
          maxAmount: player.chips,
        })
      } else {
        // Raising
        const raiseMin = Math.min(minRaiseAmount - player.currentBet, player.chips)
        actions.push({
          type: 'raise',
          minAmount: raiseMin,
          maxAmount: player.chips,
        })
      }
    }

    // All-in is always available
    if (player.chips > 0) {
      actions.push({ type: 'all-in' })
    }

    return actions
  }

  // Process a player action
  processAction(playerId: string, action: ActionType, amount?: number): boolean {
    const player = this.state.players.find((p) => p.id === playerId)
    if (!player) return false

    const currentPlayer = this.getCurrentPlayer()
    if (!currentPlayer || currentPlayer.id !== playerId) return false

    const legalActions = this.getLegalActions()
    const isLegal = legalActions.some((a) => a.type === action)
    if (!isLegal) return false

    const playerAction: PlayerAction = {
      type: action,
      amount,
      playerId,
      timestamp: Date.now(),
    }

    switch (action) {
      case 'fold':
        player.status = 'folded'
        break

      case 'check':
        // No chip movement
        break

      case 'call': {
        const callAmount = Math.min(
          this.state.currentBet - player.currentBet,
          player.chips
        )
        player.chips -= callAmount
        player.currentBet += callAmount
        if (player.chips === 0) {
          player.status = 'all-in'
        }
        playerAction.amount = callAmount
        break
      }

      case 'bet':
      case 'raise': {
        const totalBet = amount || this.state.currentBet + this.state.minRaise
        const raiseAmount = totalBet - player.currentBet
        const actualRaise = Math.min(raiseAmount, player.chips)

        this.state.minRaise = totalBet - this.state.currentBet
        this.state.currentBet = player.currentBet + actualRaise

        player.chips -= actualRaise
        player.currentBet += actualRaise

        if (player.chips === 0) {
          player.status = 'all-in'
        }
        playerAction.amount = actualRaise
        break
      }

      case 'all-in': {
        const allInAmount = player.chips
        player.currentBet += allInAmount
        player.chips = 0
        player.status = 'all-in'

        if (player.currentBet > this.state.currentBet) {
          this.state.minRaise = player.currentBet - this.state.currentBet
          this.state.currentBet = player.currentBet
        }
        playerAction.amount = allInAmount
        break
      }
    }

    player.lastAction = playerAction
    this.state.actions.push(playerAction)
    this.state.updatedAt = Date.now()

    // Check if hand is over or betting round is complete
    this.checkBettingRoundComplete()

    return true
  }

  private checkBettingRoundComplete(): void {
    const activePlayers = this.state.players.filter(
      (p) => p.status === 'active' || p.status === 'all-in'
    )

    // Only one player left - they win
    const playersInHand = this.state.players.filter(
      (p) => p.status !== 'folded' && p.status !== 'out'
    )
    if (playersInHand.length === 1) {
      this.collectBets()
      this.awardPot([playersInHand[0].id])
      this.state.phase = 'complete'
      return
    }

    // Check if betting round is complete
    const playersToAct = activePlayers.filter(
      (p) =>
        p.status === 'active' &&
        (p.currentBet < this.state.currentBet || !p.lastAction)
    )

    // Special case for preflop BB option
    if (
      this.state.phase === 'preflop' &&
      playersToAct.length === 0 &&
      this.state.currentBet === this.state.bigBlind
    ) {
      const bbPlayer = this.state.players.find((p) => p.isBigBlind)
      if (bbPlayer && bbPlayer.status === 'active' && !bbPlayer.lastAction) {
        this.state.currentPlayerIndex = this.state.players.indexOf(bbPlayer)
        return
      }
    }

    if (playersToAct.length > 0) {
      // Move to next player
      this.state.currentPlayerIndex = this.getNextActivePlayerIndex(
        this.state.currentPlayerIndex
      )
      return
    }

    // Betting round complete - collect bets and move to next phase
    this.collectBets()
    this.advancePhase()
  }

  private collectBets(): void {
    // Simple pot collection (side pots handled separately)
    let pot = this.state.pots[0]
    for (const player of this.state.players) {
      pot.amount += player.currentBet
      player.currentBet = 0
      player.lastAction = undefined
    }
    this.state.currentBet = 0
    this.state.minRaise = this.state.bigBlind
  }

  private advancePhase(): void {
    const playersInHand = this.state.players.filter(
      (p) => p.status !== 'folded' && p.status !== 'out'
    )

    // If only one player remains with chips that can act, skip to showdown
    const activePlayers = playersInHand.filter((p) => p.status === 'active')

    switch (this.state.phase) {
      case 'preflop':
        this.state.phase = 'flop'
        this.deck.burn()
        this.state.communityCards.push(...this.deck.dealMany(3))
        break

      case 'flop':
        this.state.phase = 'turn'
        this.deck.burn()
        this.state.communityCards.push(this.deck.deal()!)
        break

      case 'turn':
        this.state.phase = 'river'
        this.deck.burn()
        this.state.communityCards.push(this.deck.deal()!)
        break

      case 'river':
        this.state.phase = 'showdown'
        this.determineWinner()
        this.state.phase = 'complete'
        return
    }

    // If everyone is all-in, go straight to showdown
    if (activePlayers.length <= 1) {
      while (this.state.phase !== 'river' && this.state.phase !== 'showdown') {
        this.advancePhase()
      }
      return
    }

    // Set first to act (first active player after dealer)
    this.state.currentPlayerIndex = this.getNextActivePlayerIndex(
      this.state.dealerIndex
    )
    this.state.updatedAt = Date.now()
  }

  private determineWinner(): void {
    const playersInHand = this.state.players.filter(
      (p) => p.status !== 'folded' && p.status !== 'out'
    )

    if (playersInHand.length === 1) {
      this.awardPot([playersInHand[0].id])
      return
    }

    // Evaluate all hands
    const playerHands = playersInHand.map((player) => ({
      player,
      hand: evaluateHand(player.holeCards, this.state.communityCards),
    }))

    // Sort by hand strength
    playerHands.sort((a, b) => compareHands(b.hand, a.hand))

    // Find all winners (may be ties)
    const bestHand = playerHands[0].hand
    const winners = playerHands.filter(
      (ph) => compareHands(ph.hand, bestHand) === 0
    )

    this.state.winners = winners.map((w, i) => ({
      playerId: w.player.id,
      amount: Math.floor(this.state.pots[0].amount / winners.length),
      hand: w.hand,
      potIndex: 0,
    }))

    // Award chips to winners
    for (const winner of this.state.winners) {
      const player = this.state.players.find((p) => p.id === winner.playerId)
      if (player) {
        player.chips += winner.amount
      }
    }
  }

  private awardPot(winnerIds: string[]): void {
    const amount = Math.floor(this.state.pots[0].amount / winnerIds.length)

    this.state.winners = winnerIds.map((id) => ({
      playerId: id,
      amount,
      potIndex: 0,
    }))

    for (const winnerId of winnerIds) {
      const player = this.state.players.find((p) => p.id === winnerId)
      if (player) {
        player.chips += amount
      }
    }
  }

  // Helper methods
  private getActivePlayers(): Player[] {
    return this.state.players.filter(
      (p) => p.status === 'active' || p.status === 'all-in'
    )
  }

  private getActivePlayerIndices(): number[] {
    return this.state.players
      .map((p, i) => (p.status === 'active' || p.status === 'all-in' ? i : -1))
      .filter((i) => i >= 0)
  }

  private getNextActivePlayerIndex(fromIndex: number): number {
    const indices = this.getActivePlayerIndices()
    if (indices.length === 0) return fromIndex

    for (let i = 1; i <= this.state.players.length; i++) {
      const nextIndex = (fromIndex + i) % this.state.players.length
      if (
        this.state.players[nextIndex].status === 'active' &&
        this.state.players[nextIndex].chips > 0
      ) {
        return nextIndex
      }
    }
    return fromIndex
  }

  getCurrentPlayer(): Player | null {
    return this.state.players[this.state.currentPlayerIndex] || null
  }

  getState(): GameState {
    return { ...this.state }
  }

  // Get state for a specific player (hides other players' hole cards)
  getStateForPlayer(playerId: string): GameState {
    const state = this.getState()

    // Hide other players' hole cards unless showdown
    if (this.state.phase !== 'showdown' && this.state.phase !== 'complete') {
      state.players = state.players.map((p) => ({
        ...p,
        holeCards: p.id === playerId ? p.holeCards : [],
      }))
    }

    return state
  }

  // Get state for spectators (hides all hole cards until showdown)
  getSpectatorState(): GameState {
    const state = this.getState()

    if (this.state.phase !== 'showdown' && this.state.phase !== 'complete') {
      state.players = state.players.map((p) => ({
        ...p,
        holeCards: [],
      }))
    }

    return state
  }

  // Move dealer button for next hand
  moveDealerButton(): void {
    const activeIndices = this.getActivePlayerIndices()
    if (activeIndices.length < 2) return

    const currentDealerPos = activeIndices.indexOf(this.state.dealerIndex)
    const nextPos = (currentDealerPos + 1) % activeIndices.length
    this.state.dealerIndex = activeIndices[nextPos]
    this.state.handNumber++
  }
}

// Export a function to create a new game
export function createGame(
  tableId: string,
  players: Player[],
  smallBlind: number,
  bigBlind: number,
  dealerIndex?: number,
  seed?: string
): PokerGame {
  return new PokerGame(tableId, players, smallBlind, bigBlind, dealerIndex, seed)
}
