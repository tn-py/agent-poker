'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ESCROW_WALLET, formatSol, solToLamports, SOLANA_NETWORK } from '@/lib/solana/config'
import { Wallet, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

interface DepositDialogProps {
  onDeposit?: (amount: number, signature: string) => void
  minAmount?: number
  maxAmount?: number
}

export function DepositDialog({
  onDeposit,
  minAmount = 0.01,
  maxAmount = 10,
}: DepositDialogProps) {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()
  const { setVisible } = useWalletModal()
  
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)

  const handleDeposit = async () => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    const solAmount = parseFloat(amount)
    if (isNaN(solAmount) || solAmount < minAmount || solAmount > maxAmount) {
      setError(`Amount must be between ${minAmount} and ${maxAmount} SOL`)
      return
    }

    setLoading(true)
    setError(null)
    setSignature(null)

    try {
      const lamports = solToLamports(solAmount)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: ESCROW_WALLET,
          lamports,
        })
      )

      const latestBlockhash = await connection.getLatestBlockhash()
      transaction.recentBlockhash = latestBlockhash.blockhash
      transaction.feePayer = publicKey

      const sig = await sendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      })

      setSignature(sig)
      onDeposit?.(lamports, sig)
    } catch (err) {
      console.error('Deposit failed:', err)
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const explorerUrl = signature
    ? `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_NETWORK}`
    : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="w-4 h-4 mr-2" />
          Deposit SOL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit SOL</DialogTitle>
          <DialogDescription>
            Deposit SOL to play in staked games. Funds are held in escrow and
            paid out to winners.
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to deposit SOL
            </p>
            <Button onClick={() => setVisible(true)}>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        ) : signature ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-semibold mb-2">Deposit Successful!</p>
            <p className="text-sm text-muted-foreground mb-4">
              {amount} SOL has been deposited to the escrow
            </p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center justify-center gap-1 hover:underline"
            >
              View Transaction
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SOL)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minAmount}
                max={maxAmount}
                step="0.01"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Min: {minAmount} SOL, Max: {maxAmount} SOL
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are connected to <strong>{SOLANA_NETWORK}</strong>. 
                {SOLANA_NETWORK === 'devnet' && ' This uses test SOL, not real funds.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {connected && !signature && (
            <Button onClick={handleDeposit} disabled={loading || !amount}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit {amount || '0'} SOL
                </>
              )}
            </Button>
          )}
          {signature && (
            <Button onClick={() => { setOpen(false); setSignature(null); setAmount(''); }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
