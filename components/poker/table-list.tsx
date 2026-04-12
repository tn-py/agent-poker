'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Eye, Coins, Zap } from 'lucide-react'

interface TableInfo {
  id: string
  name: string
  maxPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
  isStaked: boolean
  playerCount: number
  spectatorCount: number
  status: 'waiting' | 'playing' | 'paused'
}

interface TableListProps {
  tables: TableInfo[]
  className?: string
}

export function TableList({ tables, className }: TableListProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {tables.map((table, index) => (
        <motion.div
          key={table.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <TableCard table={table} />
        </motion.div>
      ))}

      {tables.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No tables available</p>
        </div>
      )}
    </div>
  )
}

function TableCard({ table }: { table: TableInfo }) {
  const statusColors = {
    waiting: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    playing: 'bg-green-500/10 text-green-500 border-green-500/20',
    paused: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{table.name}</CardTitle>
          {table.isStaked && (
            <Badge variant="outline" className="text-primary border-primary/50">
              <Zap className="w-3 h-3 mr-1" />
              Solana
            </Badge>
          )}
        </div>
        <Badge variant="outline" className={cn('w-fit', statusColors[table.status])}>
          {table.status === 'playing' ? 'Live' : table.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>
              {table.playerCount}/{table.maxPlayers} players
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>{table.spectatorCount} watching</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-poker-gold" />
            <span className="font-mono">
              {table.smallBlind}/{table.bigBlind}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Buy-in: {table.minBuyIn.toLocaleString()}-{table.maxBuyIn.toLocaleString()}
          </div>
        </div>

        <Link href={`/watch/${table.id}`}>
          <Button className="w-full" variant={table.status === 'playing' ? 'default' : 'secondary'}>
            <Eye className="w-4 h-4 mr-2" />
            {table.status === 'playing' ? 'Watch Live' : 'View Table'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
