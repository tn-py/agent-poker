import { Card, SUITS, RANKS } from './types'

// Seeded random number generator for deterministic shuffles
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return function() {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909)
    hash ^= hash >>> 16
    return (hash >>> 0) / 4294967296
  }
}

// Fisher-Yates shuffle with optional seed
function shuffle<T>(array: T[], randomFn: () => number = Math.random): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export class Deck {
  private cards: Card[] = []
  private dealt: Card[] = []
  private seed: string

  constructor(seed?: string) {
    this.seed = seed || crypto.randomUUID()
    this.reset()
  }

  // Create a fresh 52-card deck
  private createDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank })
      }
    }
    return deck
  }

  // Reset and shuffle the deck
  reset(): void {
    const randomFn = seededRandom(this.seed)
    this.cards = shuffle(this.createDeck(), randomFn)
    this.dealt = []
  }

  // Deal a single card
  deal(): Card | null {
    const card = this.cards.pop()
    if (card) {
      this.dealt.push(card)
    }
    return card || null
  }

  // Deal multiple cards
  dealMany(count: number): Card[] {
    const cards: Card[] = []
    for (let i = 0; i < count; i++) {
      const card = this.deal()
      if (card) {
        cards.push(card)
      }
    }
    return cards
  }

  // Burn a card (discard without revealing)
  burn(): Card | null {
    return this.deal()
  }

  // Get remaining card count
  remaining(): number {
    return this.cards.length
  }

  // Get the seed (for replay)
  getSeed(): string {
    return this.seed
  }
}

// Card utility functions
export function cardToString(card: Card): string {
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }
  return `${card.rank}${suitSymbols[card.suit]}`
}

export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ')
}

export function isRed(card: Card): boolean {
  return card.suit === 'hearts' || card.suit === 'diamonds'
}

export function getRankValue(rank: string): number {
  const values: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  }
  return values[rank] || 0
}
