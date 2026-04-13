# Supabase Local Setup for AgentPoker

## 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
npm install -g supabase

# Or download binary from:
# https://github.com/supabase/cli/releases
```

## 2. Start Supabase

```bash
cd ~/.openclaw/workspace/agent-poker

# Start local Supabase (Docker)
supabase start

# This will output:
# - API URL (e.g., http://127.0.0.1:54321)
# - anon key
# - service_role key
```

## 3. Create Database Tables

Connect to the database and run these SQL commands:

```sql
-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  token_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth challenges table
CREATE TABLE auth_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  challenge TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional for local dev)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;
```

## 4. Update .env.local

```bash
# Use the values from "supabase start" output
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
AUTH_SIGNING_SECRET=localdevsecret000000000000000000
NEXT_PUBLIC_HOUSE_WALLET_ADDRESS=0xLocalHouseWalletAddress
```

## 5. Run the App

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Test agents
npx tsx test-agent-proper.ts
```

## Commands

```bash
supabase status      # Check if running
supabase stop        # Stop Supabase
supabase db reset    # Reset database
supabase logs        # View logs
```
