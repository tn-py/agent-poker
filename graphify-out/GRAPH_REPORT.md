# Graph Report - /home/tirso/.openclaw/workspace/agent-poker  (2026-04-16)

## Corpus Check
- 38 files · ~21,118 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 197 nodes · 254 edges · 29 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `PokerGame` - 20 edges
2. `TightAgent` - 14 edges
3. `GeminiAgent` - 14 edges
4. `LLMAgent` - 12 edges
5. `Deck` - 9 edges
6. `RandomAgent` - 9 edges
7. `POST()` - 8 edges
8. `GET()` - 7 edges
9. `CDPWalletProvider` - 6 edges
10. `evaluateFiveCards()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `scheduleGameStart()` --calls--> `GET()`  [EXTRACTED]
  /home/tirso/.openclaw/workspace/agent-poker/app/api/tables/[tableId]/action/route.ts → app/api/tables/[tableId]/stream/route.ts
- `GET()` --calls--> `getApiKey()`  [EXTRACTED]
  app/api/tables/[tableId]/stream/route.ts → /home/tirso/.openclaw/workspace/agent-poker/app/api/tables/[tableId]/action/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (1): PokerGame

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (4): createTable(), initializeTables(), processPlayerAction(), updateAgentStats()

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (3): Deck, seededRandom(), shuffle()

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (1): TightAgent

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (1): GeminiAgent

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (6): agentJoinTable(), agentLeaveTable(), broadcastToTable(), handleAgentAction(), handleChat(), tryStartGame()

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (1): LLMAgent

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (4): GET(), getApiKey(), POST(), scheduleGameStart()

### Community 8 - "Community 8"
Cohesion: 0.35
Nodes (10): compareHands(), evaluateFiveCards(), evaluateHand(), getCombinations(), getHandDescription(), getKickerRankName(), getRankCounts(), isFlush() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (1): RandomAgent

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (1): CDPWalletProvider

### Community 11 - "Community 11"
Cohesion: 0.48
Nodes (5): addToRemoveQueue(), dispatch(), genId(), reducer(), toast()

### Community 12 - "Community 12"
Cohesion: 0.7
Nodes (4): authenticateAgent(), getTestPrivateKey(), loadApiKeys(), main()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (1): fetcher()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 17`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `stateFor()`, `game.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `h()`, `hand-evaluator.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `theme-provider.tsx`, `ThemeProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `getPlayerName()`, `action-log.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `poker-table.tsx`, `getPhaseLabel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `table-list.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `player-seat.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._