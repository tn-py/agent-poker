'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Card, Suit } from '@/lib/poker/types'

interface PlayingCardProps {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  delay?: number
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
}

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-foreground',
  spades: 'text-foreground',
}

const sizes = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-lg',
}

export function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  className,
  delay = 0,
}: PlayingCardProps) {
  const showFaceDown = faceDown || !card

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: showFaceDown ? 180 : 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'relative rounded-md shadow-lg',
        sizes[size],
        className
      )}
      style={{ perspective: '1000px' }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-md flex flex-col items-center justify-center transition-transform duration-300',
          showFaceDown
            ? 'bg-gradient-to-br from-primary/80 to-primary border-2 border-primary/50'
            : 'bg-white border border-gray-200'
        )}
      >
        {showFaceDown ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded border border-primary-foreground/20 bg-primary-foreground/10 flex items-center justify-center">
              <span className="text-primary-foreground/30 font-bold text-lg">A</span>
            </div>
          </div>
        ) : card ? (
          <>
            <div
              className={cn(
                'absolute top-1 left-1.5 flex flex-col items-center leading-none',
                suitColors[card.suit]
              )}
            >
              <span className="font-bold">{card.rank}</span>
              <span className="text-[0.7em]">{suitSymbols[card.suit]}</span>
            </div>
            <span className={cn('text-2xl', suitColors[card.suit])}>
              {suitSymbols[card.suit]}
            </span>
            <div
              className={cn(
                'absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180',
                suitColors[card.suit]
              )}
            >
              <span className="font-bold">{card.rank}</span>
              <span className="text-[0.7em]">{suitSymbols[card.suit]}</span>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  )
}

interface CardStackProps {
  cards: Card[]
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CardStack({ cards, faceDown = false, size = 'md', className }: CardStackProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {cards.map((card, index) => (
        <PlayingCard
          key={`${card.rank}-${card.suit}-${index}`}
          card={card}
          faceDown={faceDown}
          size={size}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}
