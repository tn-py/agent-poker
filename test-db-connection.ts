/**
 * Test Supabase Database Connection
 * 
 * Usage: npx tsx test-db-connection.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zxhupgkopxmdbgchuazw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aHVwZ2tvcHhtZGJnY2h1YXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzIyMjcsImV4cCI6MjA5MTU0ODIyN30.Z7MuhnlWt6NJ16bFBJPFXiwEio3_F3O7jammhGoBbBE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n')
  console.log(`URL: ${supabaseUrl}`)
  
  try {
    // Test 1: Check agents table
    console.log('\n1️⃣ Testing agents table...')
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5)
    
    if (agentsError) {
      console.error('❌ Agents table error:', agentsError.message)
      if (agentsError.code === '42501') {
        console.log('   💡 RLS policy issue - check table permissions')
      }
      if (agentsError.code === '42P01') {
        console.log('   💡 Table does not exist - run schema.sql')
      }
    } else {
      console.log(`✅ Agents table OK - ${agents.length} agents found`)
      if (agents.length > 0) {
        console.log('   Sample:', agents[0].name)
      }
    }

    // Test 2: Check auth_challenges table
    console.log('\n2️⃣ Testing auth_challenges table...')
    const { data: challenges, error: challengesError } = await supabase
      .from('auth_challenges')
      .select('*')
      .limit(1)
    
    if (challengesError) {
      console.error('❌ Challenges table error:', challengesError.message)
      if (challengesError.code === '42P01') {
        console.log('   💡 Table does not exist - run schema.sql')
      }
    } else {
      console.log(`✅ Auth challenges table OK`)
    }

    // Test 3: Insert test agent (will be deleted)
    console.log('\n3️⃣ Testing agent insert...')
    const testWallet = '0x' + '1'.repeat(40)
    const { data: newAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: 'TestAgent_Connectivity',
        wallet_address: testWallet,
        api_key: `pk_test_${Date.now()}`,
        token_balance: 1000,
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message)
    } else {
      console.log('✅ Insert OK - created test agent')
      
      // Delete test agent
      await supabase.from('agents').delete().eq('wallet_address', testWallet)
      console.log('✅ Cleanup OK - deleted test agent')
    }

    // Test 4: API endpoint test
    console.log('\n4️⃣ Testing local API...')
    try {
      const tablesRes = await fetch('http://localhost:3000/api/tables')
      if (tablesRes.ok) {
        const tables = await tablesRes.json()
        console.log(`✅ /api/tables OK - ${tables.tables?.length || 0} tables`)
      } else {
        console.log('⚠️  /api/tables returned:', tablesRes.status)
        console.log('   💡 Is dev server running? (npm run dev)')
      }
    } catch (e) {
      console.log('⚠️  /api/tables unreachable')
      console.log('   💡 Start dev server: npm run dev')
    }

    console.log('\n✨ Tests complete!')
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
