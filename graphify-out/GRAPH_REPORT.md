# Graph Report - .  (2026-04-12)

## Corpus Check
- Corpus is ~30,559 words - fits in a single context window. You may not need a graph.

## Summary
- 354 nodes · 354 edges · 80 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Creategame|Creategame]]
- [[_COMMUNITY_Table|Table]]
- [[_COMMUNITY_Deck|Deck]]
- [[_COMMUNITY_Tight|Tight]]
- [[_COMMUNITY_Agentjointable|Agentjointable]]
- [[_COMMUNITY_Llm|Llm]]
- [[_COMMUNITY_Comparehands|Comparehands]]
- [[_COMMUNITY_Select|Select]]
- [[_COMMUNITY_Sheet|Sheet]]
- [[_COMMUNITY_Sidebar|Sidebar]]
- [[_COMMUNITY_Random|Random]]
- [[_COMMUNITY_Route|Route]]
- [[_COMMUNITY_Drawer|Drawer]]
- [[_COMMUNITY_Toast|Toast]]
- [[_COMMUNITY_Pagination|Pagination]]
- [[_COMMUNITY_Breadcrumb|Breadcrumb]]
- [[_COMMUNITY_Dialog|Dialog]]
- [[_COMMUNITY_Menubar|Menubar]]
- [[_COMMUNITY_Context|Context]]
- [[_COMMUNITY_Form|Form]]
- [[_COMMUNITY_Table|Table]]
- [[_COMMUNITY_Carousel|Carousel]]
- [[_COMMUNITY_Input|Input]]
- [[_COMMUNITY_Alertdialog|Alertdialog]]
- [[_COMMUNITY_Dropdown|Dropdown]]
- [[_COMMUNITY_Carddescription|Carddescription]]
- [[_COMMUNITY_Accordion|Accordion]]
- [[_COMMUNITY_Item|Item]]
- [[_COMMUNITY_Toggle|Toggle]]
- [[_COMMUNITY_Navigation|Navigation]]
- [[_COMMUNITY_Use|Use]]
- [[_COMMUNITY_Scroll|Scroll]]
- [[_COMMUNITY_Alert|Alert]]
- [[_COMMUNITY_Tabs|Tabs]]
- [[_COMMUNITY_Cn|Cn]]
- [[_COMMUNITY_Radio|Radio]]
- [[_COMMUNITY_Popover|Popover]]
- [[_COMMUNITY_Avatar|Avatar]]
- [[_COMMUNITY_Cn|Cn]]
- [[_COMMUNITY_Slider|Slider]]
- [[_COMMUNITY_Playing|Playing]]
- [[_COMMUNITY_Page|Page]]
- [[_COMMUNITY_Utils|Utils]]
- [[_COMMUNITY_Supabase|Supabase]]
- [[_COMMUNITY_Theme|Theme]]
- [[_COMMUNITY_Tooltip|Tooltip]]
- [[_COMMUNITY_Cn|Cn]]
- [[_COMMUNITY_Checkbox|Checkbox]]
- [[_COMMUNITY_Badge|Badge]]
- [[_COMMUNITY_Field|Field]]
- [[_COMMUNITY_Hover|Hover]]
- [[_COMMUNITY_Collapsible|Collapsible]]
- [[_COMMUNITY_Input|Input]]
- [[_COMMUNITY_Input|Input]]
- [[_COMMUNITY_Cn|Cn]]
- [[_COMMUNITY_Kbd|Kbd]]
- [[_COMMUNITY_Spinner|Spinner]]
- [[_COMMUNITY_Skeleton|Skeleton]]
- [[_COMMUNITY_Aspectratio|Aspectratio]]
- [[_COMMUNITY_Empty|Empty]]
- [[_COMMUNITY_Label|Label]]
- [[_COMMUNITY_Textarea|Textarea]]
- [[_COMMUNITY_Buttongroup|Buttongroup]]
- [[_COMMUNITY_Switch|Switch]]
- [[_COMMUNITY_Separator|Separator]]
- [[_COMMUNITY_Sonner|Sonner]]
- [[_COMMUNITY_Getplayername|Getplayername]]
- [[_COMMUNITY_Poker|Poker]]
- [[_COMMUNITY_Layout|Layout]]
- [[_COMMUNITY_Page|Page]]
- [[_COMMUNITY_Next|Next]]
- [[_COMMUNITY_Types|Types]]
- [[_COMMUNITY_Toaster|Toaster]]
- [[_COMMUNITY_Resizable|Resizable]]
- [[_COMMUNITY_Toggle|Toggle]]
- [[_COMMUNITY_Toast|Toast]]
- [[_COMMUNITY_Progress|Progress]]
- [[_COMMUNITY_Table|Table]]
- [[_COMMUNITY_Player|Player]]
- [[_COMMUNITY_Page|Page]]

## God Nodes (most connected - your core abstractions)
1. `PokerGame` - 20 edges
2. `TightAgent` - 14 edges
3. `LLMAgent` - 12 edges
4. `Deck` - 9 edges
5. `RandomAgent` - 9 edges
6. `evaluateFiveCards()` - 6 edges
7. `broadcastToTable()` - 6 edges
8. `GET()` - 6 edges
9. `POST()` - 5 edges
10. `evaluateHand()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getApiKey()`  [EXTRACTED]
  app/api/tables/[tableId]/stream/route.ts → app/api/tables/[tableId]/action/route.ts

## Communities

### Community 0 - "Creategame"
Cohesion: 0.18
Nodes (1): PokerGame

### Community 1 - "Table"
Cohesion: 0.13
Nodes (4): createTable(), initializeTables(), processPlayerAction(), updateAgentStats()

### Community 2 - "Deck"
Cohesion: 0.17
Nodes (3): Deck, seededRandom(), shuffle()

### Community 3 - "Tight"
Cohesion: 0.23
Nodes (1): TightAgent

### Community 4 - "Agentjointable"
Cohesion: 0.22
Nodes (6): agentJoinTable(), agentLeaveTable(), broadcastToTable(), handleAgentAction(), handleChat(), tryStartGame()

### Community 5 - "Llm"
Cohesion: 0.26
Nodes (1): LLMAgent

### Community 6 - "Comparehands"
Cohesion: 0.35
Nodes (10): compareHands(), evaluateFiveCards(), evaluateHand(), getCombinations(), getHandDescription(), getKickerRankName(), getRankCounts(), isFlush() (+2 more)

### Community 7 - "Select"
Cohesion: 0.2
Nodes (0): 

### Community 8 - "Sheet"
Cohesion: 0.2
Nodes (0): 

### Community 9 - "Sidebar"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 10 - "Random"
Cohesion: 0.31
Nodes (1): RandomAgent

### Community 11 - "Route"
Cohesion: 0.27
Nodes (3): GET(), getApiKey(), POST()

### Community 12 - "Drawer"
Cohesion: 0.22
Nodes (0): 

### Community 13 - "Toast"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 14 - "Pagination"
Cohesion: 0.29
Nodes (0): 

### Community 15 - "Breadcrumb"
Cohesion: 0.29
Nodes (0): 

### Community 16 - "Dialog"
Cohesion: 0.33
Nodes (0): 

### Community 17 - "Menubar"
Cohesion: 0.33
Nodes (0): 

### Community 18 - "Context"
Cohesion: 0.4
Nodes (0): 

### Community 19 - "Form"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Table"
Cohesion: 0.4
Nodes (0): 

### Community 21 - "Carousel"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 22 - "Input"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Alertdialog"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Dropdown"
Cohesion: 0.5
Nodes (0): 

### Community 25 - "Carddescription"
Cohesion: 0.5
Nodes (0): 

### Community 26 - "Accordion"
Cohesion: 0.5
Nodes (0): 

### Community 27 - "Item"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Toggle"
Cohesion: 0.5
Nodes (0): 

### Community 29 - "Navigation"
Cohesion: 0.5
Nodes (0): 

### Community 30 - "Use"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 31 - "Scroll"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Alert"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Tabs"
Cohesion: 0.67
Nodes (0): 

### Community 34 - "Cn"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "Radio"
Cohesion: 0.67
Nodes (0): 

### Community 36 - "Popover"
Cohesion: 0.67
Nodes (0): 

### Community 37 - "Avatar"
Cohesion: 0.67
Nodes (0): 

### Community 38 - "Cn"
Cohesion: 0.67
Nodes (0): 

### Community 39 - "Slider"
Cohesion: 0.67
Nodes (0): 

### Community 40 - "Playing"
Cohesion: 0.67
Nodes (0): 

### Community 41 - "Page"
Cohesion: 0.67
Nodes (1): fetcher()

### Community 42 - "Utils"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Supabase"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Theme"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Tooltip"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Cn"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Checkbox"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Badge"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Field"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Hover"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Collapsible"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Input"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Input"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Cn"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Kbd"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Spinner"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Skeleton"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Aspectratio"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Empty"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Label"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Textarea"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Buttongroup"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Switch"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Separator"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Sonner"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Getplayername"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Poker"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Layout"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Page"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Next"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Types"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Toaster"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Resizable"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Toggle"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Toast"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Progress"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "Table"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Player"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "Page"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Utils`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase`** (2 nodes): `supabase.ts`, `getSupabaseAdmin()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Theme`** (2 nodes): `theme-provider.tsx`, `ThemeProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tooltip`** (2 nodes): `tooltip.tsx`, `TooltipContent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cn`** (2 nodes): `cn()`, `calendar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Checkbox`** (2 nodes): `Checkbox()`, `checkbox.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Field`** (2 nodes): `field.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hover`** (2 nodes): `hover-card.tsx`, `HoverCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Collapsible`** (2 nodes): `Collapsible()`, `collapsible.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input`** (2 nodes): `input-group.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input`** (2 nodes): `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cn`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kbd`** (2 nodes): `kbd.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spinner`** (2 nodes): `spinner.tsx`, `Spinner()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Skeleton`** (2 nodes): `skeleton.tsx`, `Skeleton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Aspectratio`** (2 nodes): `AspectRatio()`, `aspect-ratio.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Empty`** (2 nodes): `empty.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Label`** (2 nodes): `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Textarea`** (2 nodes): `textarea.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Buttongroup`** (2 nodes): `ButtonGroup()`, `button-group.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Switch`** (2 nodes): `switch.tsx`, `Switch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Separator`** (2 nodes): `separator.tsx`, `Separator()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sonner`** (2 nodes): `sonner.tsx`, `Toaster()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Getplayername`** (2 nodes): `getPlayerName()`, `action-log.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Poker`** (2 nodes): `poker-table.tsx`, `getPhaseLabel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page`** (2 nodes): `page.tsx`, `copyToClipboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Types`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Toaster`** (1 nodes): `toaster.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resizable`** (1 nodes): `resizable.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Toggle`** (1 nodes): `toggle.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Toast`** (1 nodes): `toast.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progress`** (1 nodes): `progress.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Table`** (1 nodes): `table-list.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Player`** (1 nodes): `player-seat.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Table` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._