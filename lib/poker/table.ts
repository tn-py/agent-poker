import { Table, TableConfig, Player, GameState, Agent } from './types'
import { PokerGame, createGame } from './game'
import { supabase } from '../supabase'

// In-memory storage for tables and games (real-time state)
const tables = new Map<string, Table>()
const games = new Map<string, PokerGame>()

// We still keep a small cache of active agents for quick lookups during game actions
const activeAgents = new Map<string, Agent>()

// Create a new table
export function createTable(config: TableConfig): Table {
  const table: Table = {
    config,
    players: [],
    spectators: [],
    currentGame: null,
    status: 'waiting',
    createdAt: Date.now(),
  }
  tables.set(config.id, table)
  return table
}

// Get table by ID
export function getTable(tableId: string): Table | undefined {
  return tables.get(tableId)
}

// Get all tables
export function getAllTables(): Table[] {
  return Array.from(tables.values())
}

// Add player to table
export async function joinTable(
  tableId: string,
  agent: Agent,
  buyIn: number
): Promise<{ success: boolean; error?: string; seatIndex?: number }> {
  const table = tables.get(tableId)
  if (!table) {
    return { success: false, error: 'Table not found' }
  }

  if (table.players.length >= table.config.maxPlayers) {
    return { success: false, error: 'Table is full' }
  }

  if (buyIn < table.config.minBuyIn || buyIn > table.config.maxBuyIn) {
    return {
      success: false,
      error: `Buy-in must be between ${table.config.minBuyIn} and ${table.config.maxBuyIn}`,
    }
  }

  // Check if already at table
  if (table.players.some((p) => p.id === agent.id)) {
    return { success: false, error: 'Already at this table' }
  }

  // If table is tokens-enabled, check agent's balance in Supabase
  if (table.config.isTokensEnabled) {
    const { data: dbAgent, error } = await supabase
      .from('agents')
      .select('token_balance')
      .eq('id', agent.id)
      .single()

    if (error || !dbAgent) {
      return { success: false, error: 'Could not verify token balance' }
    }

    if (dbAgent.token_balance < buyIn) {
      return { success: false, error: `Insufficient tokens. Have ${dbAgent.token_balance}, need ${buyIn}` }
    }

    // Deduct tokens from agent's balance for this session
    const { error: updateError } = await supabase
      .from('agents')
      .update({ token_balance: dbAgent.token_balance - buyIn })
      .eq('id', agent.id)

    if (updateError) {
      return { success: false, error: 'Failed to reserve tokens for buy-in' }
    }
  }

  // Find open seat
  const takenSeats = new Set(table.players.map((p) => p.seatIndex))
  let seatIndex = 0
  while (takenSeats.has(seatIndex) && seatIndex < table.config.maxPlayers) {
    seatIndex++
  }

  const player: Player = {
    id: agent.id,
    name: agent.name,
    chips: buyIn,
    currentBet: 0,
    holeCards: [],
    status: 'waiting',
    seatIndex,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    walletAddress: agent.walletAddress,
    avatar: agent.avatar,
  }

  table.players.push(player)
  tables.set(tableId, table)

  return { success: true, seatIndex }
}

// Remove player from table
export async function leaveTable(
  tableId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  const table = tables.get(tableId)
  if (!table) {
    return { success: false, error: 'Table not found' }
  }

  const playerIndex = table.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) {
    return { success: false, error: 'Player not at this table' }
  }

  // Cannot leave during a hand
  if (table.status === 'playing') {
    const player = table.players[playerIndex]
    if (player.status !== 'folded' && player.status !== 'out') {
      return { success: false, error: 'Cannot leave during an active hand' }
    }
  }

  const player = table.players[playerIndex]
  
  // If table is tokens-enabled, return remaining chips to tokens
  if (table.config.isTokensEnabled) {
    const { data: dbAgent, error } = await supabase
      .from('agents')
      .select('token_balance')
      .eq('id', playerId)
      .single()

    if (!error && dbAgent) {
      await supabase
        .from('agents')
        .update({ token_balance: dbAgent.token_balance + player.chips })
        .eq('id', playerId)
    }
  }

  table.players.splice(playerIndex, 1)
  tables.set(tableId, table)

  return { success: true }
}

// Start a game at a table
export function startGame(tableId: string): { success: boolean; error?: string; game?: PokerGame } {
  const table = tables.get(tableId)
  if (!table) {
    return { success: false, error: 'Table not found' }
  }

  if (table.players.length < 2) {
    return { success: false, error: 'Need at least 2 players to start' }
  }

  if (table.status === 'playing') {
    return { success: false, error: 'Game already in progress' }
  }

  // Create new game
  const game = createGame(
    tableId,
    table.players,
    table.config.smallBlind,
    table.config.bigBlind
  )

  game.startHand()
  games.set(tableId, game)

  table.status = 'playing'
  table.currentGame = game.getState()
  tables.set(tableId, table)

  return { success: true, game }
}

// Get current game for table
export function getGame(tableId: string): PokerGame | undefined {
  return games.get(tableId)
}

// Process player action
export function processPlayerAction(
  tableId: string,
  playerId: string,
  action: string,
  amount?: number
): { success: boolean; error?: string } {
  const game = games.get(tableId)
  if (!game) {
    return { success: false, error: 'No active game' }
  }

  const validActions = ['fold', 'check', 'call', 'bet', 'raise', 'all-in']
  if (!validActions.includes(action)) {
    return { success: false, error: 'Invalid action' }
  }

  const success = game.processAction(
    playerId,
    action as 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in',
    amount
  )

  if (!success) {
    return { success: false, error: 'Action not allowed' }
  }

  // Update table state
  const table = tables.get(tableId)
  if (table) {
    table.currentGame = game.getState()

    // Check if hand is complete
    if (game.getState().phase === 'complete') {
      // Update player chips in table
      const gameState = game.getState()
      
      // Update stats in Supabase after each hand
      for (const gp of gameState.players) {
        const tp = table.players.find((p) => p.id === gp.id)
        if (tp) {
          tp.chips = gp.chips
          
          // Check if player won
          const isWinner = gameState.winners?.some(w => w.playerId === gp.id)
          updateAgentStats(gp.id, !!isWinner)
        }
      }

      // Move dealer and start new hand if enough players
      game.moveDealerButton()

      const activePlayers = table.players.filter((p) => p.chips > 0)
      if (activePlayers.length >= 2) {
        // Start new hand after a delay (handled by game loop)
        setTimeout(() => {
          game.startHand()
          table.currentGame = game.getState()
          tables.set(tableId, table)
        }, 3000)
      } else {
        table.status = 'waiting'
      }
    }

    tables.set(tableId, table)
  }

  return { success: true }
}

// Agent management
export async function registerAgent(
  name: string,
  walletAddress?: string,
  description?: string
): Promise<Agent> {
  const apiKey = `pk_${crypto.randomUUID().replace(/-/g, '')}`

  const { data, error } = await supabase
    .from('agents')
    .insert({
      name,
      wallet_address: walletAddress,
      api_key: apiKey,
      description,
      token_balance: 1000, // Welcome gift of 1000 tokens (10 USDC value)
    })
    .select()
    .single()

  if (error) {
    console.error('Error registering agent:', error)
    throw new Error('Failed to register agent')
  }

  const agent: Agent = {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    walletAddress: data.wallet_address,
    tokenBalance: data.token_balance,
    wins: data.wins,
    losses: data.losses,
    handsPlayed: data.hands_played,
    createdAt: new Date(data.created_at).getTime(),
    description: data.description,
    avatar: data.avatar,
  }

  return agent
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return undefined

  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    walletAddress: data.wallet_address,
    tokenBalance: data.token_balance,
    wins: data.wins,
    losses: data.losses,
    handsPlayed: data.hands_played,
    createdAt: new Date(data.created_at).getTime(),
    description: data.description,
    avatar: data.avatar,
  }
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | undefined> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  if (error || !data) return undefined

  return {
    id: data.id,
    name: data.name,
    apiKey: data.api_key,
    walletAddress: data.wallet_address,
    tokenBalance: data.token_balance,
    wins: data.wins,
    losses: data.losses,
    handsPlayed: data.hands_played,
    createdAt: new Date(data.created_at).getTime(),
    description: data.description,
    avatar: data.avatar,
  }
}

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('wins', { ascending: false })

  if (error || !data) return []

  return data.map(d => ({
    id: d.id,
    name: d.name,
    apiKey: d.api_key,
    walletAddress: d.wallet_address,
    tokenBalance: d.token_balance,
    wins: d.wins,
    losses: d.losses,
    handsPlayed: d.hands_played,
    createdAt: new Date(d.created_at).getTime(),
    description: d.description,
    avatar: d.avatar,
  }))
}

export async function updateAgentStats(
  agentId: string,
  won: boolean,
  handsPlayed: number = 1
): Promise<void> {
  const { data: current } = await supabase
    .from('agents')
    .select('wins, losses, hands_played')
    .eq('id', agentId)
    .single()

  if (!current) return

  await supabase
    .from('agents')
    .update({
      hands_played: current.hands_played + handsPlayed,
      wins: won ? current.wins + 1 : current.wins,
      losses: won ? current.losses : current.losses + 1
    })
    .eq('id', agentId)
}

// Add spectator to table
export function addSpectator(tableId: string, spectatorId: string): boolean {
  const table = tables.get(tableId)
  if (!table) return false

  if (!table.spectators.includes(spectatorId)) {
    table.spectators.push(spectatorId)
    tables.set(tableId, table)
  }
  return true
}

export function removeSpectator(tableId: string, spectatorId: string): boolean {
  const table = tables.get(tableId)
  if (!table) return false

  const index = table.spectators.indexOf(spectatorId)
  if (index >= 0) {
    table.spectators.splice(index, 1)
    tables.set(tableId, table)
  }
  return true
}

// Initialize default tables
export function initializeTables(): void {
  // Create some default tables
  createTable({
    id: 'table-1',
    name: 'Agent Arena - Low Stakes',
    maxPlayers: 6,
    smallBlind: 10,
    bigBlind: 20,
    minBuyIn: 500,
    maxBuyIn: 2000,
    isTokensEnabled: false,
  })

  createTable({
    id: 'table-2',
    name: 'Agent Arena - Mid Stakes',
    maxPlayers: 6,
    smallBlind: 50,
    bigBlind: 100,
    minBuyIn: 2500,
    maxBuyIn: 10000,
    isTokensEnabled: false,
  })

  createTable({
    id: 'table-3',
    name: 'High Roller - Token Stakes',
    maxPlayers: 4,
    smallBlind: 100,
    bigBlind: 200,
    minBuyIn: 5000,
    maxBuyIn: 20000,
    isTokensEnabled: true,
    poolWalletAddress: process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS,
  })
}

// Initialize on module load
initializeTables()
