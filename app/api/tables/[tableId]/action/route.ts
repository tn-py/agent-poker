import { NextRequest, NextResponse } from 'next/server'
import {
  getAgentByApiKey,
  getTable,
  getGame,
  agentJoinTable,
  handleAgentAction,
  handleChat,
} from '@/lib/poker/game-manager'

// Helper to extract API key from headers
function getApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return request.headers.get('x-api-key')
}

// POST /api/tables/[tableId]/action - Submit an action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    const apiKey = getApiKey(request)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Use Authorization: Bearer <key> or X-Api-Key header' },
        { status: 401 }
      )
    }

    const agent = getAgentByApiKey(apiKey)
    if (!agent) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const table = getTable(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, action, amount, message, buyIn } = body

    // Handle different action types
    switch (type) {
      case 'join': {
        // Check if already at table
        const isAtTable = table.players.some((p) => p.id === agent.id)
        if (isAtTable) {
          return NextResponse.json({ error: 'Already at this table' }, { status: 400 })
        }

        // Use agent.id as connectionId for stateless API
        const result = agentJoinTable(agent.id, tableId, buyIn || table.config.minBuyIn)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          seatIndex: result.seatIndex,
          message: 'Joined table successfully',
        })
      }

      case 'action': {
        // Check if at table
        const isAtTable = table.players.some((p) => p.id === agent.id)
        if (!isAtTable) {
          return NextResponse.json({ error: 'Not at this table' }, { status: 400 })
        }

        // Validate action
        const validActions = ['fold', 'check', 'call', 'bet', 'raise', 'all-in']
        if (!action || !validActions.includes(action)) {
          return NextResponse.json(
            { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
            { status: 400 }
          )
        }

        // Use agent.id as connectionId
        const result = handleAgentAction(agent.id, action, amount)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }

        // Return updated game state
        const game = getGame(tableId)
        const gameState = game?.getStateForPlayer(agent.id)

        return NextResponse.json({
          success: true,
          gameState,
          legalActions: game?.getLegalActions(),
        })
      }

      case 'chat': {
        if (!message || typeof message !== 'string') {
          return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        const result = handleChat(agent.id, message)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action type. Must be: join, action, or chat' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}

// GET /api/tables/[tableId]/action - Get current game state for agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params
    const apiKey = getApiKey(request)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      )
    }

    const agent = getAgentByApiKey(apiKey)
    if (!agent) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const table = getTable(tableId)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const game = getGame(tableId)
    if (!game) {
      return NextResponse.json({
        table: {
          id: table.config.id,
          name: table.config.name,
          status: table.status,
          players: table.players.map((p) => ({
            id: p.id,
            name: p.name,
            chips: p.chips,
            seatIndex: p.seatIndex,
          })),
        },
        gameState: null,
        actionRequired: false,
      })
    }

    const gameState = game.getStateForPlayer(agent.id)
    const currentPlayer = game.getCurrentPlayer()
    const isMyTurn = currentPlayer?.id === agent.id

    return NextResponse.json({
      table: {
        id: table.config.id,
        name: table.config.name,
        status: table.status,
      },
      gameState,
      actionRequired: isMyTurn,
      legalActions: isMyTurn ? game.getLegalActions() : [],
      timeToAct: isMyTurn ? 30 : undefined,
    })
  } catch (error) {
    console.error('Error fetching game state:', error)
    return NextResponse.json({ error: 'Failed to fetch game state' }, { status: 500 })
  }
}
