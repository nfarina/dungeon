# Floor 1 simulator

A playable-rules model of `floor-1.md`, used to answer: how long does the floor
take, how many turns should the collapse countdown be, and is any of this close?

```
bun run src/run.ts baseline 2000    # no timer: how long does a clear actually take?
bun run src/run.ts sweep    1500    # hard collapse at round N, N = 12..34
bun run src/run.ts variants 1200    # cliff vs soft collapse vs boss-door fuse vs respawn rules
bun run src/run.ts twoclock 1200    # floor cap x boss-door fuse
bun run src/run.ts grid     1200    # Greg's health x fuse length
bun run src/run.ts tuned    1500    # the candidate rulesets, head to head
bun run src/tools/content.ts 2000   # what cards/rooms/achievements actually get used
bun run src/tools/verify.ts         # dice engine vs the estimates in floor-1.md 4.1
bun run src/tools/drawmap.ts        # ASCII picture of the board
```

## What is modelled faithfully

HeroQuest combat dice (3 skulls / 2 white / 1 black), 2d6 movement, orthogonal
adjacency, wall-and-door geometry with real line of sight, doors as free actions,
monster behaviour rules 4.3.1-4.3.5 including Delegation and Performance Review,
traps (including monsters walking onto unrevealed ones), Downed/revive/respawn,
equipment slots and two-handed conflicts, cooldowns, the d6 monster loot tables,
the three decks with loot-box exclusives pulled out per section 7, Mind-gated
spellbook learning, and card-to-nerd trading.

## What is NOT modelled — read this before trusting a number

1. **The map is invented.** `src/content/floor1-map.ts` is a plausible 26x19
   HeroQuest-shaped floor satisfying the section 3 constraint, not First Light's
   real Quest 1 layout. Every turn-count answer scales with corridor length.
   Retype the real map there and re-run; nothing else needs to change.
2. **Heroes are a heuristic, not your family.** They focus fire, drink at low
   health, revive each other, skip side rooms when the clock is short, and mostly
   remember to kill Greg's Orcs first. They do not do anything clever or anything
   stupid. Real 11-year-olds have more variance in both directions.
3. **Cards with no combat effect are inert:** the Phone, the Whistle, the Frying
   Pan throw, Firecracker, Smoke Bomb, Stone Skin, and Shove as a hero action.
   Shove matters: see the Trap Chef circularity note in the analysis.
4. **Nobody searches.** Heroes never spend an action searching for traps or
   secret doors, so the secret door is only ever found by Torch.
5. **Trading is abstracted** to "a spellbook reaches a Mind 4 hero if one is
   within about a room's distance", instead of a hand-to-hand chain.

## Layout

- `src/board.ts` grid, rooms as rectangles, walls as edges, numeric door table
- `src/pathing.ts` Dijkstra + line of sight
- `src/engine.ts` game state, turn loop, hero AI, monster AI, all config dials
- `src/content/` map, monsters, and the three card decks as plain data — this is
  the file the card renderer should eventually share
- `src/run.ts` experiments and statistics
