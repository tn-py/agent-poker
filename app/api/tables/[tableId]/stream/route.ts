import { NextRequest } from 'next/server'
import {
  subscribeToTable,
  getTable,
  getGameStateForSpectator,
  GameEvent,
} from '@/lib/poker/game-manager'

// GET /api/tables/[tableId]/stream - SSE stream for table events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params

  const table = getTable(tableId)
  if (!table) {
    return new Response('Table not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial game state
      const gameState = getGameStateForSpectator(tableId)
      const initialEvent = {
        type: 'connected',
        tableId,
        payload: {
          table: {
            id: table.config.id,
            name: table.config.name,
            smallBlind: table.config.smallBlind,
            bigBlind: table.config.bigBlind,
            status: table.status,
            players: table.players.map((p) => ({
              id: p.id,
              name: p.name,
              chips: p.chips,
              seatIndex: p.seatIndex,
              status: p.status,
              avatar: p.avatar,
            })),
          },
          gameState,
        },
        timestamp: Date.now(),
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`))

      // Subscribe to table events
      unsubscribe = subscribeToTable(tableId, (event: GameEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch (error) {
          // Connection closed
          if (unsubscribe) unsubscribe()
        }
      })

      // Keepalive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch {
          clearInterval(pingInterval)
          if (unsubscribe) unsubscribe()
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        if (unsubscribe) unsubscribe()
        controller.close()
      })
    },

    cancel() {
      if (unsubscribe) unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
