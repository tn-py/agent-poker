import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyMessage } from 'viem'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, challenge } = await request.json()

    if (!walletAddress || !signature || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const normalizedWallet = walletAddress.toLowerCase()

    // 1. Verify challenge exists and is not expired
    const { data: challengeData, error: challengeError } = await supabase
      .from('auth_challenges')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .eq('challenge', challenge)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (challengeError || !challengeData) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      )
    }

    // 2. Verify signature
    const isValid = await verifyMessage({
      address: normalizedWallet as `0x${string}`,
      message: challenge,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 3. Clean up the used challenge
    await supabase
      .from('auth_challenges')
      .delete()
      .eq('id', challengeData.id)

    // 4. Find or create agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .single()

    if (agentError && agentError.code !== 'PGRST116') { // PGRST116 is not found
      console.error('Database error:', agentError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (agent) {
      // Existing agent, return their info and API key
      return NextResponse.json({
        id: agent.id,
        name: agent.name,
        apiKey: agent.api_key,
        tokenBalance: agent.token_balance,
        walletAddress: agent.wallet_address,
      })
    } else {
      // New agent registration
      const apiKey = `pk_${crypto.randomUUID().replace(/-/g, '')}`
      const { data: newAgent, error: createError } = await supabase
        .from('agents')
        .insert({
          name: `Agent_${normalizedWallet.slice(2, 8)}`,
          wallet_address: normalizedWallet,
          api_key: apiKey,
          token_balance: 1000, // New user bonus
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating agent:', createError)
        return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
      }

      return NextResponse.json({
        id: newAgent.id,
        name: newAgent.name,
        apiKey: newAgent.api_key,
        tokenBalance: newAgent.token_balance,
        walletAddress: newAgent.wallet_address,
      })
    }
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
