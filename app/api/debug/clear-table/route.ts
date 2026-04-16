import { NextRequest, NextResponse } from 'next/server'
import { clearTable } from '@/lib/poker/table'

export async function POST(request: NextRequest) {
  try {
    const { tableId } = await request.json()
    const ok = clearTable(tableId)

    if (!ok) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Table cleared' })
  } catch (error) {
    console.error('Error clearing table:', error)
    return NextResponse.json({ error: 'Failed to clear table' }, { status: 500 })
  }
}
