import { describe, it, expect, beforeEach } from 'vitest'
import { PokerGame } from './game'
import { Player } from './types'

describe('PokerGame Engine', () => {
  let players: Player[]
  
  beforeEach(() => {
    players = [
      { id: '1', name: 'Alice', chips: 1000, walletAddress: '0x1' },
      { id: '2', name: 'Bob', chips: 1000, walletAddress: '0x2' },
      { id: '3', name: 'Charlie', chips: 1000, walletAddress: '0x3' }
    ]
  })

  it('initializes game state correctly', () => {
    const game = new PokerGame('table-1', players, 10, 20)
    const state = game.getState()
    
    expect(state.players.length).toBe(3)
    expect(state.smallBlind).toBe(10)
    expect(state.bigBlind).toBe(20)
    expect(state.phase).toBe('waiting')
  })

  it('starts a hand and posts blinds', () => {
    const game = new PokerGame('table-1', players, 10, 20)
    game.startHand()
    const state = game.getState()
    
    expect(state.phase).toBe('preflop')
    
    // Check blinds (Heads up logic differs, but here we have 3 players)
    const sbPlayer = state.players.find(p => p.isSmallBlind)
    const bbPlayer = state.players.find(p => p.isBigBlind)
    
    expect(sbPlayer?.currentBet).toBe(10)
    expect(sbPlayer?.chips).toBe(990)
    expect(bbPlayer?.currentBet).toBe(20)
    expect(bbPlayer?.chips).toBe(980)
  })

  it('processes a fold action', () => {
    const game = new PokerGame('table-1', players, 10, 20)
    game.startHand()
    
    const currentPlayer = game.getCurrentPlayer()!
    const result = game.processAction(currentPlayer.id, 'fold')
    
    expect(result).toBe(true)
    expect(stateFor(game, currentPlayer.id).status).toBe('folded')
  })

  it('processes a call action', () => {
    const game = new PokerGame('table-1', players, 10, 20)
    game.startHand()
    
    const currentPlayer = game.getCurrentPlayer()!
    const initialChips = currentPlayer.chips
    const toCall = game.getState().currentBet - currentPlayer.currentBet
    
    const result = game.processAction(currentPlayer.id, 'call')
    
    expect(result).toBe(true)
    const updatedPlayer = stateFor(game, currentPlayer.id)
    expect(updatedPlayer.chips).toBe(initialChips - toCall)
    expect(updatedPlayer.currentBet).toBe(game.getState().currentBet)
  })

  function stateFor(game: PokerGame, playerId: string) {
    return game.getState().players.find(p => p.id === playerId)!
  }
})
