'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PokerTable } from '@/components/poker/poker-table'
import { ActionLog, ChatLog } from '@/components/poker/action-log'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GameState, PlayerAction } from '@/lib/poker/types'
import { ArrowLeft, Users, Eye, Volume2, VolumeX, Zap } from 'lucide-react'

interface TableInfo {
  id: string
  name: string
  smallBlind: number
  bigBlind: number
  status: string
  players: Array<{
    id: string
    name: string
    chips: number
    seatIndex: number
    status: string
    avatar?: string
  }>
}

interface ChatMessage {
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

export default function WatchPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState(true)

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(`/api/tables/${tableId}/stream`)

    eventSource.onopen = () => {
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            setTableInfo(data.payload.table)
            if (data.payload.gameState) {
              setGameState(data.payload.gameState)
            }
            break
            
          case 'game_state':
            setGameState(data.payload.state)
            break
            
          case 'player_joined':
          case 'player_left':
          case 'table_update':
            // Refresh table info
            fetch(`/api/tables?id=${tableId}`)
              .then(res => res.json())
              .then(data => {
                if (data.table) {
                  setTableInfo(data.table)
                }
              })
            break
            
          case 'chat':
            setChatMessages(prev => [...prev, {
              playerId: data.payload.playerId,
              playerName: data.payload.playerName,
              message: data.payload.message,
              timestamp: data.timestamp,
            }])
            break
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    eventSource.onerror = () => {
      setConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [tableId])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">
                {tableInfo?.name || 'Loading...'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">
                  {tableInfo?.smallBlind || 0}/{tableInfo?.bigBlind || 0}
                </span>
                <span>blinds</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className={connected 
                ? 'text-green-500 border-green-500/30' 
                : 'text-yellow-500 border-yellow-500/30'
              }
            >
              <span 
                className={`w-2 h-2 rounded-full mr-2 ${
                  connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`} 
              />
              {connected ? 'Live' : 'Connecting...'}
            </Badge>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{tableInfo?.players.length || 0} players</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMuted(!muted)}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Poker table */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center"
          >
            <PokerTable gameState={gameState} />
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Game info */}
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-3">Game Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phase</span>
                  <Badge variant="outline" className="capitalize">
                    {gameState?.phase || 'waiting'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hand #</span>
                  <span className="font-mono">{gameState?.handNumber || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pot</span>
                  <span className="font-mono text-poker-gold">
                    {(gameState?.pots.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action log */}
            <ActionLog 
              actions={gameState?.actions || []} 
              players={gameState?.players || []}
              className="h-[300px]"
            />

            {/* Chat */}
            <ChatLog 
              messages={chatMessages}
              className="h-[200px]"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
