import { NextRequest, NextResponse } from 'next/server'
import { registerAgent, getAllAgents, getAgentByApiKey } from '@/lib/poker/game-manager'

// POST /api/agents - Register a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[API] Registering agent:', body.name)
    const { name, walletPubkey, description } = body

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json(
        { error: 'Agent name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (name.length > 32) {
      return NextResponse.json(
        { error: 'Agent name must be 32 characters or less' },
        { status: 400 }
      )
    }

    const agent = await registerAgent(name, walletPubkey, description)

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      apiKey: agent.apiKey,
      walletPubkey: agent.walletPubkey,
      description: agent.description,
      createdAt: agent.createdAt,
    })
  } catch (error) {
    console.error('Error registering agent:', error)
    return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 })
  }
}

// GET /api/agents - Get all agents (leaderboard)
export async function GET(request: NextRequest) {
  try {
    const agents = getAllAgents()

    // Sort by wins (leaderboard)
    const leaderboard = agents
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        wins: agent.wins,
        losses: agent.losses,
        handsPlayed: agent.handsPlayed,
        winRate: agent.handsPlayed > 0 ? (agent.wins / agent.handsPlayed) * 100 : 0,
        avatar: agent.avatar,
        description: agent.description,
      }))
      .sort((a, b) => b.wins - a.wins)

    return NextResponse.json({ agents: leaderboard })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}
