import { Card, HandRank, EvaluatedHand, Suit } from './types'
import { getRankValue } from './deck'

// Get all 5-card combinations from 7 cards (hole cards + community)
function getCombinations(cards: Card[], k: number): Card[][] {
  const result: Card[][] = []
  
  function combine(start: number, combo: Card[]) {
    if (combo.length === k) {
      result.push([...combo])
      return
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i])
      combine(i + 1, combo)
      combo.pop()
    }
  }
  
  combine(0, [])
  return result
}

// Sort cards by rank value (high to low)
function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))
}

// Check if cards form a flush (all same suit)
function isFlush(cards: Card[]): boolean {
  return cards.every(card => card.suit === cards[0].suit)
}

// Check if cards form a straight
function isStraight(cards: Card[]): { isStraight: boolean; highCard: number } {
  const sorted = sortByRank(cards)
  const values = sorted.map(c => getRankValue(c.rank))
  
  // Check for wheel (A-2-3-4-5)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return { isStraight: true, highCard: 5 }
  }
  
  // Check regular straight
  for (let i = 0; i < 4; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return { isStraight: false, highCard: 0 }
    }
  }
  
  return { isStraight: true, highCard: values[0] }
}

// Count occurrences of each rank
function getRankCounts(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1)
  }
  return counts
}

// Evaluate a 5-card hand
function evaluateFiveCards(cards: Card[]): EvaluatedHand {
  const sorted = sortByRank(cards)
  const flush = isFlush(cards)
  const straightResult = isStraight(cards)
  const straight = straightResult.isStraight
  const rankCounts = getRankCounts(cards)
  
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a)
  const values = sorted.map(c => getRankValue(c.rank))
  
  // Royal Flush
  if (flush && straight && straightResult.highCard === 14) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      rankName: 'Royal Flush',
      cards: sorted,
      kickers: [14]
    }
  }
  
  // Straight Flush
  if (flush && straight) {
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      rankName: 'Straight Flush',
      cards: sorted,
      kickers: [straightResult.highCard]
    }
  }
  
  // Four of a Kind
  if (counts[0] === 4) {
    const quadRank = Array.from(rankCounts.entries()).find(([, c]) => c === 4)![0]
    const kickerRank = Array.from(rankCounts.entries()).find(([, c]) => c === 1)![0]
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      rankName: 'Four of a Kind',
      cards: sorted,
      kickers: [getRankValue(quadRank), getRankValue(kickerRank)]
    }
  }
  
  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    const tripRank = Array.from(rankCounts.entries()).find(([, c]) => c === 3)![0]
    const pairRank = Array.from(rankCounts.entries()).find(([, c]) => c === 2)![0]
    return {
      rank: HandRank.FULL_HOUSE,
      rankName: 'Full House',
      cards: sorted,
      kickers: [getRankValue(tripRank), getRankValue(pairRank)]
    }
  }
  
  // Flush
  if (flush) {
    return {
      rank: HandRank.FLUSH,
      rankName: 'Flush',
      cards: sorted,
      kickers: values
    }
  }
  
  // Straight
  if (straight) {
    return {
      rank: HandRank.STRAIGHT,
      rankName: 'Straight',
      cards: sorted,
      kickers: [straightResult.highCard]
    }
  }
  
  // Three of a Kind
  if (counts[0] === 3) {
    const tripRank = Array.from(rankCounts.entries()).find(([, c]) => c === 3)![0]
    const kickers = values.filter(v => v !== getRankValue(tripRank)).slice(0, 2)
    return {
      rank: HandRank.THREE_OF_A_KIND,
      rankName: 'Three of a Kind',
      cards: sorted,
      kickers: [getRankValue(tripRank), ...kickers]
    }
  }
  
  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Array.from(rankCounts.entries())
      .filter(([, c]) => c === 2)
      .map(([r]) => getRankValue(r))
      .sort((a, b) => b - a)
    const kicker = Array.from(rankCounts.entries()).find(([, c]) => c === 1)![0]
    return {
      rank: HandRank.TWO_PAIR,
      rankName: 'Two Pair',
      cards: sorted,
      kickers: [...pairs, getRankValue(kicker)]
    }
  }
  
  // One Pair
  if (counts[0] === 2) {
    const pairRank = Array.from(rankCounts.entries()).find(([, c]) => c === 2)![0]
    const kickers = values.filter(v => v !== getRankValue(pairRank)).slice(0, 3)
    return {
      rank: HandRank.PAIR,
      rankName: 'Pair',
      cards: sorted,
      kickers: [getRankValue(pairRank), ...kickers]
    }
  }
  
  // High Card
  return {
    rank: HandRank.HIGH_CARD,
    rankName: 'High Card',
    cards: sorted,
    kickers: values
  }
}

// Find the best 5-card hand from 7 cards (2 hole + 5 community)
export function evaluateHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...communityCards]
  
  if (allCards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate a hand')
  }
  
  const combinations = getCombinations(allCards, 5)
  let bestHand: EvaluatedHand | null = null
  
  for (const combo of combinations) {
    const hand = evaluateFiveCards(combo)
    if (!bestHand || compareHands(hand, bestHand) > 0) {
      bestHand = hand
    }
  }
  
  return bestHand!
}

// Compare two hands: returns positive if hand1 wins, negative if hand2 wins, 0 for tie
export function compareHands(hand1: EvaluatedHand, hand2: EvaluatedHand): number {
  // Compare rank first
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank
  }
  
  // Compare kickers
  for (let i = 0; i < Math.max(hand1.kickers.length, hand2.kickers.length); i++) {
    const k1 = hand1.kickers[i] || 0
    const k2 = hand2.kickers[i] || 0
    if (k1 !== k2) {
      return k1 - k2
    }
  }
  
  return 0 // Perfect tie
}

// Get hand description for display
export function getHandDescription(hand: EvaluatedHand): string {
  const highCard = hand.cards[0]
  
  switch (hand.rank) {
    case HandRank.ROYAL_FLUSH:
      return 'Royal Flush'
    case HandRank.STRAIGHT_FLUSH:
      return `Straight Flush, ${highCard.rank} high`
    case HandRank.FOUR_OF_A_KIND:
      return `Four of a Kind, ${getKickerRankName(hand.kickers[0])}s`
    case HandRank.FULL_HOUSE:
      return `Full House, ${getKickerRankName(hand.kickers[0])}s full of ${getKickerRankName(hand.kickers[1])}s`
    case HandRank.FLUSH:
      return `Flush, ${highCard.rank} high`
    case HandRank.STRAIGHT:
      return `Straight, ${getKickerRankName(hand.kickers[0])} high`
    case HandRank.THREE_OF_A_KIND:
      return `Three of a Kind, ${getKickerRankName(hand.kickers[0])}s`
    case HandRank.TWO_PAIR:
      return `Two Pair, ${getKickerRankName(hand.kickers[0])}s and ${getKickerRankName(hand.kickers[1])}s`
    case HandRank.PAIR:
      return `Pair of ${getKickerRankName(hand.kickers[0])}s`
    case HandRank.HIGH_CARD:
      return `High Card, ${highCard.rank}`
    default:
      return 'Unknown Hand'
  }
}

function getKickerRankName(value: number): string {
  const names: Record<number, string> = {
    14: 'Ace',
    13: 'King',
    12: 'Queen',
    11: 'Jack',
    10: 'Ten',
    9: 'Nine',
    8: 'Eight',
    7: 'Seven',
    6: 'Six',
    5: 'Five',
    4: 'Four',
    3: 'Three',
    2: 'Two'
  }
  return names[value] || String(value)
}
