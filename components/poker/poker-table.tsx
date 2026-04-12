'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CardStack } from './playing-card'
import { PlayerSeat } from './player-seat'
import type { GameState, Player } from '@/lib/poker/types'
import { Coins } from 'lucide-react'

interface PokerTableProps {
  gameState: GameState | null
  className?: string
}

// Position mapping for 6 players around an oval table
const seatPositions = [
  'bottom',      // Seat 0 - bottom center
  'left',        // Seat 1 - left
  'top-left',    // Seat 2 - top left
  'top',         // Seat 3 - top center
  'top-right',   // Seat 4 - top right
  'right',       // Seat 5 - right
] as const

export function PokerTable({ gameState, className }: PokerTableProps) {
  const players = gameState?.players || []
  const communityCards = gameState?.communityCards || []
  const pot = gameState?.pots.reduce((sum, p) => sum + p.amount, 0) || 0
  const phase = gameState?.phase || 'waiting'
  const currentPlayerIndex = gameState?.currentPlayerIndex ?? -1

  // Map players to seats
  const seatedPlayers: (Player | undefined)[] = Array(6).fill(undefined)
  players.forEach((player) => {
    if (player.seatIndex >= 0 && player.seatIndex < 6) {
      seatedPlayers[player.seatIndex] = player
    }
  })

  const getPhaseLabel = () => {
    switch (phase) {
      case 'waiting':
        return 'Waiting for players...'
      case 'preflop':
        return 'Pre-Flop'
      case 'flop':
        return 'Flop'
      case 'turn':
        return 'Turn'
      case 'river':
        return 'River'
      case 'showdown':
        return 'Showdown'
      case 'complete':
        return 'Hand Complete'
      default:
        return ''
    }
  }

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      {/* Table felt */}
      <div className="relative aspect-[16/10] bg-poker-felt rounded-[50%] border-8 border-poker-table shadow-2xl shadow-black/50">
        {/* Inner border */}
        <div className="absolute inset-4 rounded-[50%] border-2 border-primary/20" />
        
        {/* Center area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {/* Phase indicator */}
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1 bg-background/20 backdrop-blur rounded-full"
          >
            <span className="text-sm font-medium text-foreground/80">{getPhaseLabel()}</span>
          </motion.div>

          {/* Community cards */}
          <div className="flex gap-2 min-h-[80px] items-center">
            <AnimatePresence mode="popLayout">
              {communityCards.length > 0 ? (
                <CardStack cards={communityCards} size="md" />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-14 h-20 rounded-md border-2 border-dashed border-foreground/10"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pot display */}
          <AnimatePresence>
            {pot > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-4 py-2 bg-background/30 backdrop-blur rounded-full"
              >
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-poker-gold shadow" />
                  <div className="w-4 h-4 rounded-full bg-poker-gold/80 shadow" />
                  <div className="w-4 h-4 rounded-full bg-poker-gold/60 shadow" />
                </div>
                <span className="font-mono font-bold text-poker-gold">{pot.toLocaleString()}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player seats */}
        {seatedPlayers.map((player, index) => (
          <PlayerSeat
            key={index}
            player={player}
            position={seatPositions[index]}
            isCurrentPlayer={player && players[currentPlayerIndex]?.id === player.id}
            showCards={phase === 'showdown' || phase === 'complete'}
          />
        ))}

        {/* Winner announcement */}
        <AnimatePresence>
          {gameState?.winners && gameState.winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="bg-background/95 backdrop-blur px-8 py-4 rounded-xl border border-poker-gold shadow-lg shadow-poker-gold/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Winner</p>
                  <p className="text-xl font-bold text-foreground">
                    {players.find((p) => p.id === gameState.winners?.[0]?.playerId)?.name || 'Unknown'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-poker-gold">
                    <Coins className="w-5 h-5" />
                    <span className="font-mono font-bold">
                      +{gameState.winners[0]?.amount.toLocaleString()}
                    </span>
                  </div>
                  {gameState.winners[0]?.hand && (
                    <p className="text-sm text-primary mt-2">
                      {gameState.winners[0].hand.rankName}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
