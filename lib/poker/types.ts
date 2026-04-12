// Card suits and ranks
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const

export type Suit = typeof SUITS[number]
export type Rank = typeof RANKS[number]

export interface Card {
  suit: Suit
  rank: Rank
}

// Hand rankings from lowest to highest
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export interface EvaluatedHand {
  rank: HandRank
  rankName: string
  cards: Card[] // The 5 cards that make up the hand
  kickers: number[] // Numeric values for tie-breaking
}

// Player types
export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'all-in' | 'out'

export interface Player {
  id: string
  name: string
  chips: number // Chips in the current hand/session
  currentBet: number
  holeCards: Card[]
  status: PlayerStatus
  seatIndex: number
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  walletAddress?: string // Changed from walletPubkey (EVM)
  avatar?: string
  lastAction?: PlayerAction
}

// Actions
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

export interface PlayerAction {
  type: ActionType
  amount?: number
  playerId: string
  timestamp: number
}

export interface LegalAction {
  type: ActionType
  minAmount?: number
  maxAmount?: number
}

// Game phases
export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'complete'

// Pot structure for side pots
export interface Pot {
  amount: number
  eligiblePlayerIds: string[]
}

// Game state
export interface GameState {
  id: string
  tableId: string
  phase: GamePhase
  players: Player[]
  communityCards: Card[]
  pots: Pot[]
  currentBet: number
  minRaise: number
  dealerIndex: number
  currentPlayerIndex: number
  smallBlind: number
  bigBlind: number
  handNumber: number
  seed: string // For deterministic replay
  actions: PlayerAction[]
  winners?: WinnerInfo[]
  createdAt: number
  updatedAt: number
}

export interface WinnerInfo {
  playerId: string
  amount: number
  hand?: EvaluatedHand
  potIndex: number
}

// Table configuration
export interface TableConfig {
  id: string
  name: string
  maxPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
  isTokensEnabled: boolean // Changed from isStaked
  poolWalletAddress?: string // Changed from escrowPubkey
}

export interface Table {
  config: TableConfig
  players: Player[]
  spectators: string[]
  currentGame: GameState | null
  status: 'waiting' | 'playing' | 'paused'
  createdAt: number
}

// Agent types
export interface Agent {
  id: string
  name: string
  apiKey: string
  walletAddress?: string // Changed from walletPubkey
  tokenBalance: number // Total tokens owned by the agent
  wins: number
  losses: number
  handsPlayed: number
  createdAt: number
  avatar?: string
  description?: string
}

// WebSocket message types
export type ServerMessageType = 
  | 'authenticated'
  | 'error'
  | 'game_state'
  | 'action_required'
  | 'player_joined'
  | 'player_left'
  | 'chat'
  | 'match_result'
  | 'table_update'

export type ClientMessageType =
  | 'auth'
  | 'join_table'
  | 'leave_table'
  | 'action'
  | 'chat'

export interface ServerMessage {
  type: ServerMessageType
  payload: unknown
  timestamp: number
}

export interface ClientMessage {
  type: ClientMessageType
  payload: unknown
}

// Specific message payloads
export interface AuthPayload {
  apiKey: string
}

export interface JoinTablePayload {
  tableId: string
  buyIn: number
}

export interface ActionPayload {
  action: ActionType
  amount?: number
}

export interface ChatPayload {
  message: string
}

export interface GameStatePayload {
  state: GameState
  legalActions: LegalAction[]
  actionRequired: boolean
  timeToAct?: number
}

export interface ErrorPayload {
  code: string
  message: string
}
