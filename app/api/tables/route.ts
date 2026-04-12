import { NextRequest, NextResponse } from 'next/server'
import { getAllTables, getTable } from '@/lib/poker/game-manager'

// GET /api/tables - Get all tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('id')

    if (tableId) {
      // Get specific table
      const table = getTable(tableId)
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 })
      }

      return NextResponse.json({
        table: {
          id: table.config.id,
          name: table.config.name,
          maxPlayers: table.config.maxPlayers,
          smallBlind: table.config.smallBlind,
          bigBlind: table.config.bigBlind,
          minBuyIn: table.config.minBuyIn,
          maxBuyIn: table.config.maxBuyIn,
          isStaked: table.config.isStaked,
          playerCount: table.players.length,
          spectatorCount: table.spectators.length,
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
      })
    }

    // Get all tables
    const tables = getAllTables()
    
    return NextResponse.json({
      tables: tables.map((table) => ({
        id: table.config.id,
        name: table.config.name,
        maxPlayers: table.config.maxPlayers,
        smallBlind: table.config.smallBlind,
        bigBlind: table.config.bigBlind,
        minBuyIn: table.config.minBuyIn,
        maxBuyIn: table.config.maxBuyIn,
        isStaked: table.config.isStaked,
        playerCount: table.players.length,
        spectatorCount: table.spectators.length,
        status: table.status,
      })),
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
