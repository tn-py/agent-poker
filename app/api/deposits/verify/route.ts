import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const HOUSE_WALLET = process.env.NEXT_PUBLIC_HOUSE_WALLET_ADDRESS as `0x${string}`

// USDC uses 6 decimals on Base
const USDC_DECIMALS = 6

export async function POST(request: NextRequest) {
  try {
    const { txHash, walletAddress } = await request.json()

    if (!txHash || !walletAddress) {
      return NextResponse.json({ error: 'Missing txHash or walletAddress' }, { status: 400 })
    }

    // 1. Check if this txHash was already used
    const { data: existing } = await supabase
      .from('deposits')
      .select('id')
      .eq('tx_hash', txHash)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 })
    }

    // 2. Verify transaction on Base
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 })
    }

    // 3. Find the Transfer log for USDC
    const transferAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
    const logs = receipt.logs.filter(log => log.address.toLowerCase() === USDC_BASE_ADDRESS.toLowerCase())
    
    let amountUSDC = 0n
    let foundTransfer = false

    for (const log of logs) {
      try {
        // We can manually parse if needed, but let's assume one USDC transfer to house
        // Simple check: is it from the agent and to the house?
        // In a production app, use decodeEventLog
        const from = `0x${log.topics[1]?.slice(26)}`.toLowerCase()
        const to = `0x${log.topics[2]?.slice(26)}`.toLowerCase()
        
        if (from === walletAddress.toLowerCase() && to === HOUSE_WALLET.toLowerCase()) {
          amountUSDC = BigInt(log.data)
          foundTransfer = true
          break
        }
      } catch (e) {
        continue
      }
    }

    if (!foundTransfer) {
      return NextResponse.json({ error: 'No valid USDC transfer to house wallet found in this transaction' }, { status: 400 })
    }

    // 4. Calculate tokens (1 USDC = 100 tokens)
    // amountUSDC is in 6 decimals, so 1.00 USDC = 1,000,000
    // tokens = (amount / 10^6) * 100
    const tokenAmount = Number(amountUSDC) / Math.pow(10, USDC_DECIMALS) * 100

    // 5. Update agent balance and record deposit
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, token_balance')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Transactional update
    const { error: updateError } = await supabase
      .from('agents')
      .update({ token_balance: agent.token_balance + tokenAmount })
      .eq('id', agent.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    await supabase.from('deposits').insert({
      agent_id: agent.id,
      amount_usdc: Number(amountUSDC) / Math.pow(10, USDC_DECIMALS),
      token_amount: tokenAmount,
      tx_hash: txHash,
      status: 'verified'
    })

    return NextResponse.json({ 
      success: true, 
      addedTokens: tokenAmount, 
      newBalance: agent.token_balance + tokenAmount 
    })

  } catch (error) {
    console.error('Deposit verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
