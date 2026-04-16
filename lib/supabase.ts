import { createClient } from '@supabase/supabase-js'

// SIMPLE IN-MEMORY MOCK FOR TESTING
const mockDb: Record<string, Record<string, any>> = {
  auth_challenges: {},
  agents: {}
}

// Returns a thenable chain so each step can be awaited OR further chained.
// Supports: .eq() .gt() .gte() .lt() .lte() .single()
// When awaited without .single(), returns { data: rows[], error }
function buildMockChain(
  table: string,
  operation: 'select' | 'delete',
  filters: Array<{ op: string; col: string; val: any }>,
  pendingUpdateData?: any
) {
  const applyFilters = (records: any[]) =>
    records.filter((r: any) =>
      filters.every(({ op, col, val }) => {
        if (op === 'eq') return r[col] === val
        if (op === 'gt') return r[col] > val
        if (op === 'gte') return r[col] >= val
        if (op === 'lt') return r[col] < val
        if (op === 'lte') return r[col] <= val
        return true
      })
    )

  // Resolve value when chain is awaited directly
  const resolve = () => {
    const rows = Object.values(mockDb[table] || {})
    if (operation === 'delete') {
      const toDelete = applyFilters(rows)
      toDelete.forEach((r: any) => {
        const key = Object.keys(mockDb[table]).find((k) => mockDb[table][k] === r)
        if (key) delete mockDb[table][key]
      })
      return Promise.resolve({ data: null, error: null })
    }
    if (pendingUpdateData) {
      const toUpdate = applyFilters(rows)
      toUpdate.forEach((r: any) => {
        const key = Object.keys(mockDb[table]).find((k) => mockDb[table][k] === r)
        if (key) mockDb[table][key] = { ...mockDb[table][key], ...pendingUpdateData }
      })
      return Promise.resolve({ data: null, error: null })
    }
    const matched = applyFilters(rows)
    return Promise.resolve({ data: matched, error: null })
  }

  const chain: any = {
    eq: (col: string, val: any) =>
      buildMockChain(table, operation, [...filters, { op: 'eq', col, val }], pendingUpdateData),
    gt: (col: string, val: any) =>
      buildMockChain(table, operation, [...filters, { op: 'gt', col, val }], pendingUpdateData),
    gte: (col: string, val: any) =>
      buildMockChain(table, operation, [...filters, { op: 'gte', col, val }], pendingUpdateData),
    lt: (col: string, val: any) =>
      buildMockChain(table, operation, [...filters, { op: 'lt', col, val }], pendingUpdateData),
    lte: (col: string, val: any) =>
      buildMockChain(table, operation, [...filters, { op: 'lte', col, val }], pendingUpdateData),
    single: async () => {
      const rows = applyFilters(Object.values(mockDb[table] || {}))
      if (rows.length === 0)
        return { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
      return { data: rows[0], error: null }
    },
    // Make the chain itself thenable (awaitable without .single())
    then: (onfulfilled: any, onrejected: any) => resolve().then(onfulfilled, onrejected),
  }
  return chain
}

const simpleMockSupabase = {
  from: (table: string) => ({
    insert: async (data: any) => {
      console.log(`[MOCK] Insert into ${table}`)
      const records = Array.isArray(data) ? data : [data]
      if (!mockDb[table]) mockDb[table] = {}
      for (const record of records) {
        const id = record.id ?? 'mock-' + Math.random().toString(36).slice(2, 9)
        mockDb[table][id] = { ...record, id }
      }
      return { error: null, data: records[0] }
    },
    select: (_columns = '*') => buildMockChain(table, 'select', []),
    delete: () => buildMockChain(table, 'delete', []),
    update: (data: any) => buildMockChain(table, 'select', [], data),
  }),
}

// Use mock mode for local testing without database
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true'

if (USE_MOCK_DB) {
  console.log('🧪 Using SIMPLE mock database for testing')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!USE_MOCK_DB && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables. Set USE_MOCK_DB=true for local testing without database.')
}

// TEMPORARY: Always use simple mock for testing
export const supabase = simpleMockSupabase

// For server-side operations that need to bypass RLS
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return supabase
  }
  return createClient(supabaseUrl, serviceRoleKey)
}
