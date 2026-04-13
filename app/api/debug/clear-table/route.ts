import { NextRequest, NextResponse } from 'next/server'
import { getTable } from '@/lib/poker/table'

export async function POST(request: NextRequest) {
  try {
    const { tableId } = await request.json()
    const table = getTable(tableId)
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }
    
    // Clear all players from table
    table.players = []
    table.status = 'waiting'
    table.currentGame = null
    
    return NextResponse.json({ success: true, message: 'Table cleared' })
  } catch (error) {
    console.error('Error clearing table:', error)
    return NextResponse.json({ error: 'Failed to clear table' }, { status: 500 })
  }
}
