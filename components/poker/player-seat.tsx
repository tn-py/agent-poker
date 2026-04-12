'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PlayingCard } from './playing-card'
import type { Player, Card } from '@/lib/poker/types'
import { Bot, User, Coins, Crown } from 'lucide-react'

interface PlayerSeatProps {
  player?: Player
  isCurrentPlayer?: boolean
  showCards?: boolean
  position: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right'
  className?: string
}

const positionStyles = {
  'top': 'top-0 left-1/2 -translate-x-1/2',
  'bottom': 'bottom-0 left-1/2 -translate-x-1/2',
  'left': 'left-0 top-1/2 -translate-y-1/2',
  'right': 'right-0 top-1/2 -translate-y-1/2',
  'top-left': 'top-8 left-8',
  'top-right': 'top-8 right-8',
}

export function PlayerSeat({
  player,
  isCurrentPlayer,
  showCards,
  position,
  className,
}: PlayerSeatProps) {
  if (!player) {
    return (
      <div
        className={cn(
          'absolute flex flex-col items-center gap-2',
          positionStyles[position],
          className
        )}
      >
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <span className="text-xs text-muted-foreground">Empty Seat</span>
      </div>
    )
  }

  const isFolded = player.status === 'folded'
  const isAllIn = player.status === 'all-in'

  return (
    <motion.div
      layout
      className={cn(
        'absolute flex flex-col items-center gap-2',
        positionStyles[position],
        isFolded && 'opacity-50',
        className
      )}
    >
      {/* Hole Cards */}
      <AnimatePresence>
        {player.holeCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-0.5 mb-1"
          >
            {player.holeCards.map((card, i) => (
              <PlayingCard
                key={i}
                card={showCards ? card : undefined}
                faceDown={!showCards}
                size="sm"
                delay={i * 0.1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center transition-all',
          isCurrentPlayer
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            : 'bg-secondary',
          isFolded ? 'bg-muted' : 'bg-secondary'
        )}
      >
        <Bot className="w-7 h-7 text-muted-foreground" />
        
        {/* Dealer button */}
        {player.isDealer && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-poker-gold rounded-full flex items-center justify-center text-[10px] font-bold text-background">
            D
          </div>
        )}
        
        {/* Big/Small Blind indicators */}
        {player.isSmallBlind && !player.isDealer && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            SB
          </div>
        )}
        {player.isBigBlind && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            BB
          </div>
        )}
      </div>

      {/* Name and Chips */}
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-foreground truncate max-w-24">
          {player.name}
        </span>
        <div className="flex items-center gap-1 text-poker-gold">
          <Coins className="w-3 h-3" />
          <span className="text-xs font-mono">{player.chips.toLocaleString()}</span>
        </div>
      </div>

      {/* Status badges */}
      <AnimatePresence>
        {isAllIn && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="px-2 py-0.5 bg-poker-red rounded text-xs font-bold text-white"
          >
            ALL IN
          </motion.div>
        )}
        {isFolded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-muted-foreground"
          >
            FOLDED
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current bet */}
      <AnimatePresence>
        {player.currentBet > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-background/80 rounded-full border border-border"
          >
            <div className="w-3 h-3 rounded-full bg-poker-gold" />
            <span className="text-xs font-mono">{player.currentBet}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last action */}
      <AnimatePresence>
        {player.lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/20 rounded text-[10px] font-medium text-primary uppercase whitespace-nowrap"
          >
            {player.lastAction.type}
            {player.lastAction.amount ? ` ${player.lastAction.amount}` : ''}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
