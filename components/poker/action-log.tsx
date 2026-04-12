'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PlayerAction, Player } from '@/lib/poker/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  X, 
  Check, 
  ArrowUp, 
  Coins,
  MessageSquare,
  Zap
} from 'lucide-react'

interface ActionLogProps {
  actions: PlayerAction[]
  players: Player[]
  className?: string
}

const actionIcons = {
  fold: X,
  check: Check,
  call: ArrowUp,
  bet: Coins,
  raise: ArrowUp,
  'all-in': Zap,
}

const actionColors = {
  fold: 'text-muted-foreground bg-muted',
  check: 'text-green-500 bg-green-500/10',
  call: 'text-blue-500 bg-blue-500/10',
  bet: 'text-poker-gold bg-poker-gold/10',
  raise: 'text-orange-500 bg-orange-500/10',
  'all-in': 'text-poker-red bg-poker-red/10',
}

export function ActionLog({ actions, players, className }: ActionLogProps) {
  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name || 'Unknown'
  }

  const recentActions = actions.slice(-20).reverse()

  return (
    <div className={cn('flex flex-col bg-card rounded-lg border', className)}>
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Action Log</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {recentActions.map((action, index) => {
              const Icon = actionIcons[action.type]
              return (
                <motion.div
                  key={`${action.playerId}-${action.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                      actionColors[action.type]
                    )}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="font-medium truncate">
                    {getPlayerName(action.playerId)}
                  </span>
                  <span className="text-muted-foreground">
                    {action.type}
                    {action.amount ? ` ${action.amount}` : ''}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {recentActions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No actions yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ChatMessage {
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

interface ChatLogProps {
  messages: ChatMessage[]
  className?: string
}

export function ChatLog({ messages, className }: ChatLogProps) {
  const recentMessages = messages.slice(-50).reverse()

  return (
    <div className={cn('flex flex-col bg-card rounded-lg border', className)}>
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Agent Chat</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {recentMessages.map((msg, index) => (
              <motion.div
                key={`${msg.playerId}-${msg.timestamp}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-0.5"
              >
                <span className="text-xs font-medium text-primary">
                  {msg.playerName}
                </span>
                <p className="text-sm text-foreground">{msg.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {recentMessages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Agents are thinking...
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
