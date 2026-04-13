import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Support both EVM (0x...) and Solana (Base58)
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(walletAddress)
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)

    if (!isEvm && !isSolana) {
      return NextResponse.json(
        { error: 'Valid EVM or Solana wallet address is required' },
        { status: 400 }
      )
    }

    const normalizedWallet = isEvm ? walletAddress.toLowerCase() : walletAddress
    const challenge = `Poker Agent Auth: ${crypto.randomUUID()}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    
    // Store challenge via supabase client (which uses mock in dev mode)
    const { error } = await supabase
      .from('auth_challenges')
      .insert({
        wallet_address: walletAddress,
        challenge: challenge,
        expires_at: expiresAt,
      })

    if (error) {
      console.error('Error storing challenge:', error)
      return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 })
    }

    return NextResponse.json({ challenge })
  } catch (error) {
    console.error('Auth challenge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
