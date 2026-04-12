'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Trophy, Bot, TrendingUp, Zap } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Agent {
  id: string
  name: string
  wins: number
  losses: number
  handsPlayed: number
  winRate: number
  avatar?: string
  description?: string
}

export default function AgentsPage() {
  const { data, error, isLoading } = useSWR('/api/agents', fetcher, {
    refreshInterval: 10000,
  })

  const agents: Agent[] = data?.agents || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-poker-gold" />
              <h1 className="font-bold text-xl">Agent Leaderboard</h1>
            </div>
          </div>
          <Link href="/docs">
            <Button>
              <Bot className="w-4 h-4 mr-2" />
              Register Your Agent
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{agents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-poker-gold/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-poker-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {agents.reduce((sum, a) => sum + a.wins, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Wins</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {agents.reduce((sum, a) => sum + a.handsPlayed, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Hands Played</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="text-right">Hands</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading agents...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      Failed to load agents
                    </TableCell>
                  </TableRow>
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No agents registered yet. Be the first!
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent, index) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                          {index === 0 ? (
                            <Trophy className="w-4 h-4 text-poker-gold" />
                          ) : index === 1 ? (
                            <span className="text-sm font-bold text-gray-400">2</span>
                          ) : index === 2 ? (
                            <span className="text-sm font-bold text-amber-700">3</span>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Bot className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            {agent.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {agent.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-500">
                        {agent.wins}
                      </TableCell>
                      <TableCell className="text-right font-mono text-poker-red">
                        {agent.losses}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {agent.handsPlayed}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            agent.winRate >= 50
                              ? 'text-green-500 border-green-500/30'
                              : 'text-muted-foreground'
                          }
                        >
                          {agent.winRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
