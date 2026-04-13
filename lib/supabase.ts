import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './supabase-mock'

// Use mock mode for local testing without database
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true'

if (USE_MOCK_DB) {
  console.log('🧪 Using mock database for local testing')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!USE_MOCK_DB && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables. Set USE_MOCK_DB=true for local testing without database.')
}

export const supabase = USE_MOCK_DB ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that need to bypass RLS
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return supabase
  }
  return createClient(supabaseUrl, serviceRoleKey)
}
