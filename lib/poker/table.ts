import { Table, TableConfig, Player, GameState, Agent } from './types'
import { PokerGame, createGame } from './game'

// In-memory storage for tables and games
const tables = new Map<string, Table>()
const games = new Map<string, PokerGame>()
const agents = new Map<string, Agent>()
const apiKeyToAgent = new Map<string, string>()

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
export function joinTable(
  tableId: string,
  agent: Agent,
  buyIn: number
): { success: boolean; error?: string; seatIndex?: number } {
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
    walletPubkey: agent.walletPubkey,
    avatar: agent.avatar,
  }

  table.players.push(player)
  tables.set(tableId, table)

  return { success: true, seatIndex }
}

// Remove player from table
export function leaveTable(
  tableId: string,
  playerId: string
): { success: boolean; error?: string } {
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
      for (const gp of gameState.players) {
        const tp = table.players.find((p) => p.id === gp.id)
        if (tp) {
          tp.chips = gp.chips
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
export function registerAgent(
  name: string,
  walletPubkey?: string,
  description?: string
): Agent {
  const id = crypto.randomUUID()
  const apiKey = `pk_${crypto.randomUUID().replace(/-/g, '')}`

  const agent: Agent = {
    id,
    name,
    apiKey,
    walletPubkey,
    chips: 0,
    wins: 0,
    losses: 0,
    handsPlayed: 0,
    createdAt: Date.now(),
    description,
  }

  agents.set(id, agent)
  apiKeyToAgent.set(apiKey, id)

  return agent
}

export function getAgent(id: string): Agent | undefined {
  return agents.get(id)
}

export function getAgentByApiKey(apiKey: string): Agent | undefined {
  const agentId = apiKeyToAgent.get(apiKey)
  if (!agentId) return undefined
  return agents.get(agentId)
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values())
}

export function updateAgentStats(
  agentId: string,
  won: boolean,
  handsPlayed: number = 1
): void {
  const agent = agents.get(agentId)
  if (!agent) return

  agent.handsPlayed += handsPlayed
  if (won) {
    agent.wins++
  } else {
    agent.losses++
  }
  agents.set(agentId, agent)
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
    isStaked: false,
  })

  createTable({
    id: 'table-2',
    name: 'Agent Arena - Mid Stakes',
    maxPlayers: 6,
    smallBlind: 50,
    bigBlind: 100,
    minBuyIn: 2500,
    maxBuyIn: 10000,
    isStaked: false,
  })

  createTable({
    id: 'table-3',
    name: 'High Roller - Solana Staked',
    maxPlayers: 4,
    smallBlind: 100,
    bigBlind: 200,
    minBuyIn: 5000,
    maxBuyIn: 20000,
    isStaked: true,
  })
}

// Initialize on module load
initializeTables()
