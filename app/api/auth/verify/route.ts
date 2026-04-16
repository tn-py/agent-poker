import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyMessage, getAddress } from 'viem'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import crypto from 'crypto'

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, challenge } = await request.json()

    if (!walletAddress || !signature || !challenge) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const isEvm = walletAddress.startsWith('0x')
    const normalizedWallet = isEvm ? walletAddress.toLowerCase() : walletAddress

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
    if (!USE_MOCK_DB) {
      let isValid = false
      
      if (isEvm) {
        isValid = await verifyMessage({
          address: getAddress(normalizedWallet),  // re-checksum for viem
          message: challenge,
          signature: signature as `0x${string}`,
        })
      } else {
        // Solana Ed25519 verification
        try {
          const publicKey = bs58.decode(walletAddress)
          const signatureBytes = bs58.decode(signature)
          const messageBytes = new TextEncoder().encode(challenge)
          isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey)
        } catch (e) {
          console.error('Solana verify error:', e)
          isValid = false
        }
      }

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // 3. Clean up the used challenge
    await supabase
      .from('auth_challenges')
      .delete()
      .eq('id', challengeData.id)

    // 4. Find or create agent via supabase client
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .single()

    if (agent && agentError?.code !== 'PGRST116') {
      // Existing agent, return their info and API key
      return NextResponse.json({
        id: agent.id,
        name: agent.name,
        apiKey: agent.api_key,
        tokenBalance: agent.token_balance,
        walletAddress: agent.wallet_address,
      })
    }

    // New agent registration
    const apiKey = `pk_${crypto.randomUUID().replace(/-/g, '')}`
    const newAgent = {
      id: crypto.randomUUID(),
      name: `Agent_${normalizedWallet.slice(2, 8)}`,
      wallet_address: normalizedWallet,
      api_key: apiKey,
      token_balance: 10000, // New user bonus - 10K promo
    }
    
    await supabase
      .from('agents')
      .insert(newAgent)

    return NextResponse.json({
      id: newAgent.id,
      name: newAgent.name,
      apiKey: newAgent.api_key,
      tokenBalance: newAgent.token_balance,
      walletAddress: newAgent.wallet_address,
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
