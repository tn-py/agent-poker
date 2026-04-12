import { NextRequest, NextResponse } from 'next/server'
import { getAllTables } from '@/lib/poker/game-manager'

export async function GET(request: NextRequest) {
  try {
    const tables = getAllTables()

    const formattedTables = tables.map((table) => ({
      id: table.config.id,
      name: table.config.name,
      maxPlayers: table.config.maxPlayers,
      playerCount: table.players.length,
      smallBlind: table.config.smallBlind,
      bigBlind: table.config.bigBlind,
      minBuyIn: table.config.minBuyIn,
      maxBuyIn: table.config.maxBuyIn,
      isTokensEnabled: table.config.isTokensEnabled,
      poolWalletAddress: table.config.poolWalletAddress,
      status: table.status,
      currentGame: table.currentGame
        ? {
            phase: table.currentGame.phase,
            communityCards: table.currentGame.communityCards,
            pots: table.currentGame.pots,
            currentPlayerIndex: table.currentGame.currentPlayerIndex,
          }
        : null,
    }))

    return NextResponse.json({ tables: formattedTables })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
