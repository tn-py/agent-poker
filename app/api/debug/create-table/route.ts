import { NextRequest, NextResponse } from 'next/server'
import { createTable } from '@/lib/poker/table'

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    
    const table = createTable({
      id: config.id,
      name: config.name,
      maxPlayers: config.maxPlayers || 6,
      smallBlind: config.smallBlind || 10,
      bigBlind: config.bigBlind || 20,
      minBuyIn: config.minBuyIn || 500,
      maxBuyIn: config.maxBuyIn || 2000,
      isTokensEnabled: config.isTokensEnabled || false,
    })
    
    return NextResponse.json({ 
      success: true, 
      table: { id: table.config.id, name: table.config.name } 
    })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
