/**
 * File-based Mock Supabase for local testing
 * Persists across Next.js hot reloads
 */

import fs from 'fs'
import path from 'path'

const MOCK_DB_PATH = path.join(process.cwd(), 'lib', 'mock-db.json')

// In-memory cache for performance + durability
let dbCache: { agents: Record<string, any>; challenges: Record<string, any>; apiKeys: Record<string, any> } | null = null
let lastLoadTime = 0

function loadDb(): { agents: Record<string, any>; auth_challenges: Record<string, any>; apiKeys: Record<string, any> } {
  try {
    // Reload if cache is stale (older than 100ms)
    const now = Date.now()
    if (!dbCache || now - lastLoadTime > 100) {
      // Try to read from filesystem, fall back to empty if it fails (serverless)
      try {
        const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8')
        dbCache = JSON.parse(data)
        // Backward compatibility: if old format has 'challenges', rename to 'auth_challenges'
        if (dbCache.challenges && !dbCache.auth_challenges) {
          dbCache.auth_challenges = dbCache.challenges
          delete dbCache.challenges
        }
      } catch (fsError) {
        // Serverless environment or file doesn't exist
        dbCache = { agents: {}, auth_challenges: {}, apiKeys: {} }
      }
      lastLoadTime = now
    }
    return dbCache!
  } catch (e) {
    return { agents: {}, auth_challenges: {}, apiKeys: {} }
  }
}

function saveDb(db: { agents: Record<string, any>; auth_challenges: Record<string, any>; apiKeys: Record<string, any> }) {
  try {
    dbCache = db
    lastLoadTime = Date.now()
    // Try to save to filesystem, but don't fail if it doesn't work (serverless)
    try {
      fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2))
    } catch (fsError) {
      // In serverless, just keep in memory
      console.log('[MOCK] Running in serverless mode, data kept in memory only')
    }
  } catch (e) {
    console.error('[MOCK] Failed to save:', e)
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function createQueryBuilder(table: string) {
  const filters: Array<{ field: string; value: string; op: string }> = []

  const builder: any = {
    eq(field: string, value: string) {
      filters.push({ field, value, op: 'eq' })
      return builder
    },
    gt(field: string, value: string) {
      filters.push({ field, value, op: 'gt' })
      return builder
    },
    limit(n: number) {
      return builder
    },
    order(column: string, options?: { ascending?: boolean }) {
      return builder
    },
    single() {
      return executeQuery(table, filters)
    },
  }

  return builder
}

function executeQuery(table: string, filters: any[]): { data: any; error: any } {
  const db = loadDb()

  if (table === 'agents') {
    let results = Object.values(db.agents)
    
    for (const filter of filters) {
      if (filter.op === 'eq') {
        if (filter.field === 'wallet_address') {
          results = results.filter((a: any) => a.wallet_address?.toLowerCase() === filter.value.toLowerCase())
        } else if (filter.field === 'api_key') {
          results = results.filter((a: any) => a.api_key === filter.value)
        } else if (filter.field === 'id') {
          results = results.filter((a: any) => a.id === filter.value)
        }
      }
    }
    
    if (results.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
    }
    return { data: results[0], error: null }
  }

  if (table === 'auth_challenges') {
    let results = Object.values(db.challenges)
    
    for (const filter of filters) {
      if (filter.op === 'eq') {
        if (filter.field === 'wallet_address') {
          results = results.filter((c: any) => c.wallet_address?.toLowerCase() === filter.value.toLowerCase())
        } else if (filter.field === 'challenge') {
          results = results.filter((c: any) => c.challenge === filter.value)
        } else if (filter.field === 'id') {
          results = results.filter((c: any) => c.id === filter.value)
        }
      } else if (filter.op === 'gt') {
        if (filter.field === 'expires_at') {
          results = results.filter((c: any) => new Date(c.expires_at) > new Date(filter.value))
        }
      }
    }
    
    if (results.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
    }
    return { data: results[0], error: null }
  }

  return { data: null, error: { code: 'PGRST116', message: 'Not found' } }
}

export const mockSupabase = {
  from: (table: string) => {
    return {
      select: (_columns?: string) => createQueryBuilder(table),
      
      insert: (data: any | any[]) => {
        const dataArray: any[] = Array.isArray(data) ? data : [data]
        
        return {
          select: () => ({
            single: () => {
              const db = loadDb()
              const item = dataArray[0]
              
              if (table === 'agents' && item) {
                const newAgent = {
                  id: item.id || generateUUID(),
                  name: item.name || `Agent_${generateUUID().slice(0, 6)}`,
                  wallet_address: item.wallet_address,
                  api_key: item.api_key,
                  token_balance: item.token_balance || 10000,
                  created_at: new Date().toISOString(),
                }
                db.agents[item.wallet_address?.toLowerCase()] = newAgent
                db.apiKeys[item.api_key] = newAgent
                saveDb(db)
                console.log(`[MOCK] Created agent: ${newAgent.name}`)
                return { data: newAgent, error: null }
              }
              
              if (table === 'auth_challenges' && item) {
                const newChallenge = {
                  id: generateUUID(),
                  wallet_address: item.wallet_address,
                  challenge: item.challenge,
                  expires_at: item.expires_at,
                }
                db.challenges[item.challenge] = newChallenge
                saveDb(db)
                console.log(`[MOCK] Created challenge for ${item.wallet_address?.slice(0, 10)}...`)
                return { data: newChallenge, error: null }
              }
              
              return { data: null, error: null }
            },
          }),
        }
      },
      
      delete: () => ({
        eq: (field: string, value: string) => {
          const db = loadDb()
          if (table === 'auth_challenges') {
            if (field === 'id') {
              for (const [key, challenge] of Object.entries(db.challenges)) {
                if ((challenge as any).id === value) {
                  delete db.challenges[key]
                  saveDb(db)
                  break
                }
              }
            }
          }
          return { error: null }
        },
      }),
      
      update: (data: any) => ({
        eq: (field: string, value: string) => {
          const db = loadDb()
          if (table === 'agents' && field === 'id') {
            for (const [key, agent] of Object.entries(db.agents)) {
              if ((agent as any).id === value) {
                Object.assign(agent, data)
                saveDb(db)
                return { error: null }
              }
            }
          }
          return { error: null }
        },
      }),
    }
  },
}

// Stats for debugging
export function getMockStats() {
  const db = loadDb()
  return {
    agents: Object.keys(db.agents).length,
    apiKeys: Object.keys(db.apiKeys).length,
    challenges: Object.keys(db.challenges).length,
  }
}
