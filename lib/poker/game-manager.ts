import { GameState, LegalAction, Agent, PlayerAction, Table } from './types'
import {
  getTable,
  getAllTables,
  joinTable,
  leaveTable,
  startGame,
  getGame,
  processPlayerAction,
  registerAgent,
  getAgent,
  getAgentByApiKey,
  getAllAgents,
  addSpectator,
  removeSpectator,
} from './table'

// Event types for broadcasting
export type GameEventType =
  | 'game_state'
  | 'action_required'
  | 'player_joined'
  | 'player_left'
  | 'chat'
  | 'match_result'
  | 'table_update'
  | 'error'

export interface GameEvent {
  type: GameEventType
  tableId: string
  payload: unknown
  timestamp: number
}

// Subscriber callback type
type EventCallback = (event: GameEvent) => void

// Global event subscribers (for WebSocket/SSE connections)
const tableSubscribers = new Map<string, Set<EventCallback>>()
const agentConnections = new Map<string, { agentId: string; tableId?: string }>()

// Subscribe to table events
export function subscribeToTable(tableId: string, callback: EventCallback): () => void {
  if (!tableSubscribers.has(tableId)) {
    tableSubscribers.set(tableId, new Set())
  }
  tableSubscribers.get(tableId)!.add(callback)

  // Return unsubscribe function
  return () => {
    const subs = tableSubscribers.get(tableId)
    if (subs) {
      subs.delete(callback)
      if (subs.size === 0) {
        tableSubscribers.delete(tableId)
      }
    }
  }
}

// Broadcast event to table subscribers
export function broadcastToTable(tableId: string, event: Omit<GameEvent, 'timestamp'>): void {
  const subs = tableSubscribers.get(tableId)
  if (!subs) return

  const fullEvent: GameEvent = {
    ...event,
    timestamp: Date.now(),
  }

  for (const callback of subs) {
    try {
      callback(fullEvent)
    } catch (error) {
      console.error('Error broadcasting to subscriber:', error)
    }
  }
}

// Agent authentication
export function authenticateAgent(
  connectionId: string,
  apiKey: string
): { success: boolean; agent?: Agent; error?: string } {
  const agent = getAgentByApiKey(apiKey)
  if (!agent) {
    return { success: false, error: 'Invalid API key' }
  }

  agentConnections.set(connectionId, { agentId: agent.id })
  return { success: true, agent }
}

// Agent joins table
export function agentJoinTable(
  connectionId: string,
  tableId: string,
  buyIn: number
): { success: boolean; error?: string; seatIndex?: number } {
  const connection = agentConnections.get(connectionId)
  if (!connection) {
    return { success: false, error: 'Not authenticated' }
  }

  const agent = getAgent(connection.agentId)
  if (!agent) {
    return { success: false, error: 'Agent not found' }
  }

  const result = joinTable(tableId, agent, buyIn)
  if (result.success) {
    connection.tableId = tableId
    agentConnections.set(connectionId, connection)

    // Broadcast player joined event
    broadcastToTable(tableId, {
      type: 'player_joined',
      tableId,
      payload: {
        playerId: agent.id,
        playerName: agent.name,
        seatIndex: result.seatIndex,
      },
    })

    // Check if we should start the game
    const table = getTable(tableId)
    if (table && table.players.length >= 2 && table.status === 'waiting') {
      setTimeout(() => {
        tryStartGame(tableId)
      }, 2000)
    }
  }

  return result
}

// Agent leaves table
export function agentLeaveTable(connectionId: string): { success: boolean; error?: string } {
  const connection = agentConnections.get(connectionId)
  if (!connection || !connection.tableId) {
    return { success: false, error: 'Not at a table' }
  }

  const result = leaveTable(connection.tableId, connection.agentId)
  if (result.success) {
    broadcastToTable(connection.tableId, {
      type: 'player_left',
      tableId: connection.tableId,
      payload: { playerId: connection.agentId },
    })
    connection.tableId = undefined
    agentConnections.set(connectionId, connection)
  }

  return result
}

// Process agent action
export function handleAgentAction(
  connectionId: string,
  action: string,
  amount?: number
): { success: boolean; error?: string } {
  const connection = agentConnections.get(connectionId)
  if (!connection || !connection.tableId) {
    return { success: false, error: 'Not at a table' }
  }

  const result = processPlayerAction(connection.tableId, connection.agentId, action, amount)
  if (result.success) {
    // Broadcast updated game state
    const game = getGame(connection.tableId)
    if (game) {
      const state = game.getSpectatorState()
      broadcastToTable(connection.tableId, {
        type: 'game_state',
        tableId: connection.tableId,
        payload: {
          state,
          lastAction: {
            playerId: connection.agentId,
            action,
            amount,
          },
        },
      })

      // Send action_required to next player
      const currentPlayer = game.getCurrentPlayer()
      if (currentPlayer && state.phase !== 'complete') {
        broadcastToTable(connection.tableId, {
          type: 'action_required',
          tableId: connection.tableId,
          payload: {
            playerId: currentPlayer.id,
            legalActions: game.getLegalActions(),
            timeToAct: 30,
          },
        })
      }
    }
  }

  return result
}

// Try to start a game
export function tryStartGame(tableId: string): { success: boolean; error?: string } {
  const result = startGame(tableId)
  if (result.success && result.game) {
    const state = result.game.getSpectatorState()
    broadcastToTable(tableId, {
      type: 'game_state',
      tableId,
      payload: { state },
    })

    // Send action_required to first player
    const currentPlayer = result.game.getCurrentPlayer()
    if (currentPlayer) {
      broadcastToTable(tableId, {
        type: 'action_required',
        tableId,
        payload: {
          playerId: currentPlayer.id,
          legalActions: result.game.getLegalActions(),
          timeToAct: 30,
        },
      })
    }
  }
  return result
}

// Agent disconnect
export function handleAgentDisconnect(connectionId: string): void {
  const connection = agentConnections.get(connectionId)
  if (connection && connection.tableId) {
    // Auto-fold if in a hand, then leave
    const game = getGame(connection.tableId)
    if (game) {
      const currentPlayer = game.getCurrentPlayer()
      if (currentPlayer && currentPlayer.id === connection.agentId) {
        processPlayerAction(connection.tableId, connection.agentId, 'fold')
      }
    }
    leaveTable(connection.tableId, connection.agentId)
  }
  agentConnections.delete(connectionId)
}

// Spectator joins
export function spectatorJoin(tableId: string, spectatorId: string): boolean {
  const success = addSpectator(tableId, spectatorId)
  if (success) {
    // Send current game state to spectator
    const game = getGame(tableId)
    if (game) {
      const state = game.getSpectatorState()
      // Individual spectator would receive this via their callback
    }
  }
  return success
}

// Chat message
export function handleChat(
  connectionId: string,
  message: string
): { success: boolean; error?: string } {
  const connection = agentConnections.get(connectionId)
  if (!connection || !connection.tableId) {
    return { success: false, error: 'Not at a table' }
  }

  const agent = getAgent(connection.agentId)
  if (!agent) {
    return { success: false, error: 'Agent not found' }
  }

  broadcastToTable(connection.tableId, {
    type: 'chat',
    tableId: connection.tableId,
    payload: {
      playerId: agent.id,
      playerName: agent.name,
      message: message.slice(0, 280), // Limit message length
    },
  })

  return { success: true }
}

// Get game state for agent
export function getGameStateForAgent(connectionId: string): GameState | null {
  const connection = agentConnections.get(connectionId)
  if (!connection || !connection.tableId) {
    return null
  }

  const game = getGame(connection.tableId)
  if (!game) {
    return null
  }

  return game.getStateForPlayer(connection.agentId)
}

// Get game state for spectator
export function getGameStateForSpectator(tableId: string): GameState | null {
  const game = getGame(tableId)
  return game ? game.getSpectatorState() : null
}

// Export table/agent functions for API routes
export {
  getTable,
  getAllTables,
  getGame,
  registerAgent,
  getAgent,
  getAgentByApiKey,
  getAllAgents,
}
