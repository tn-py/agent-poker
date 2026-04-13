import { describe, it, expect } from 'vitest'
import { evaluateHand, compareHands } from './hand-evaluator'
import { Card, HandRank } from './types'

describe('Hand Evaluator', () => {
  const h = (suit: string, rank: string): Card => ({ suit: suit as any, rank })

  it('identifies a Royal Flush', () => {
    const holeCards = [h('spades', 'A'), h('spades', 'K')]
    const communityCards = [h('spades', 'Q'), h('spades', 'J'), h('spades', '10'), h('hearts', '2'), h('diamonds', '5')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.ROYAL_FLUSH)
  })

  it('identifies a Straight Flush', () => {
    const holeCards = [h('clubs', '9'), h('clubs', '8')]
    const communityCards = [h('clubs', '7'), h('clubs', '6'), h('clubs', '5'), h('hearts', '2'), h('diamonds', 'A')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH)
    expect(result.kickers[0]).toBe(9)
  })

  it('identifies Four of a Kind', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'A')]
    const communityCards = [h('diamonds', 'A'), h('clubs', 'A'), h('spades', 'K'), h('hearts', 'Q'), h('diamonds', 'J')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.FOUR_OF_A_KIND)
  })

  it('identifies a Full House', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'A')]
    const communityCards = [h('diamonds', 'A'), h('clubs', 'K'), h('spades', 'K'), h('hearts', 'Q'), h('diamonds', 'J')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.FULL_HOUSE)
  })

  it('identifies a Flush', () => {
    const holeCards = [h('hearts', 'A'), h('hearts', 'J')]
    const communityCards = [h('hearts', '8'), h('hearts', '6'), h('hearts', '2'), h('spades', 'K'), h('diamonds', 'Q')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.FLUSH)
  })

  it('identifies a Straight', () => {
    const holeCards = [h('spades', '9'), h('hearts', '8')]
    const communityCards = [h('diamonds', '7'), h('clubs', '6'), h('spades', '5'), h('hearts', '2'), h('diamonds', 'A')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.STRAIGHT)
  })

  it('identifies Three of a Kind', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'A')]
    const communityCards = [h('diamonds', 'A'), h('clubs', 'K'), h('spades', 'Q'), h('hearts', 'J'), h('diamonds', '2')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.THREE_OF_A_KIND)
  })

  it('identifies Two Pair', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'A')]
    const communityCards = [h('diamonds', 'K'), h('clubs', 'K'), h('spades', 'Q'), h('hearts', 'J'), h('diamonds', '2')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.TWO_PAIR)
  })

  it('identifies a Pair', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'A')]
    const communityCards = [h('diamonds', 'K'), h('clubs', 'Q'), h('spades', 'J'), h('hearts', '2'), h('diamonds', '5')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.PAIR)
  })

  it('identifies High Card', () => {
    const holeCards = [h('spades', 'A'), h('hearts', 'J')]
    const communityCards = [h('diamonds', '8'), h('clubs', '6'), h('spades', '4'), h('hearts', '3'), h('diamonds', '2')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.HIGH_CARD)
  })

  it('compares two hands correctly', () => {
    const hand1 = evaluateHand([h('spades', 'A'), h('hearts', 'A')], [h('diamonds', 'K'), h('clubs', 'Q'), h('spades', 'J'), h('hearts', '2'), h('diamonds', '3')])
    const hand2 = evaluateHand([h('spades', 'K'), h('hearts', 'K')], [h('diamonds', 'A'), h('clubs', 'Q'), h('spades', 'J'), h('hearts', '2'), h('diamonds', '3')])
    
    // Both are pairs, but hand1 is pair of Aces, hand2 is pair of Kings
    expect(compareHands(hand1, hand2)).toBeGreaterThan(0)
  })

  it('handles wheel straight (A-2-3-4-5)', () => {
    const holeCards = [h('spades', 'A'), h('hearts', '2')]
    const communityCards = [h('diamonds', '3'), h('clubs', '4'), h('spades', '5'), h('hearts', 'K'), h('diamonds', 'Q')]
    const result = evaluateHand(holeCards, communityCards)
    expect(result.rank).toBe(HandRank.STRAIGHT)
    expect(result.kickers[0]).toBe(5)
  })
})
