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
bun run map                         # the map editor at http://localhost:5173
```

## The map editor

`bun run map` serves the editor and reads/writes `src/content/*.map.json` in
place, so a Save in the browser lands in the same file the simulator reads. It
prints a LAN address as well — open that on the iPad and it works there, at the
table, with the DM view and the round counter.

**Layers.** Three ideas, kept apart on purpose:

- **Possible rooms** — what is printed on the cardboard: the corridors and every
  room the board *has*. Traced once from Side A and locked; every floor built on
  this board side reuses it untouched.
- **Rooms this floor** — which possible rooms are actually in play, and what they
  are called. Tap a possible room to put it in play and name it.
- **Solid stone** — a possible room you don't name is stone this floor (on the
  table, the black blocking tiles go over it), so unused rooms need no marking
  at all. This layer is only for the extra case: stone laid over corridor
  squares or part of a room.

Then **Doors**, **Furniture** and **Traps**. Each layer has its own show/hide and
lock, and only the selected unlocked layer takes taps. On the two area layers,
drag out a rectangle (Shift squares it off, Esc cancels, R toggles freehand).

**Checks** runs continuously: it flood-fills from the entrance through open
geometry and doors, and tells you about rooms with no way in, doors with stone
on one side, furniture on a wall, and missing entrance/stairs. Get it to
"connected and complete" before trusting a simulation.

**DM mode** hides the tools: tap a room to strike it off, tap a door to open it,
and run the two clocks from section 1.7 — End round ticks down, "Reset! (→5)"
is Greg hitting the emergency reset when the Office opens. That state lives in
the browser, separate from the map, so marking rooms cleared never edits the
floor. The **Players** preset hides traps, monsters and secret doors, for when
you turn the screen round.

## The map format

`src/content/floor1.map.json` is the single source of truth — the editor, the
simulator and (eventually) the card renderer all read it. It has two halves,
because they change at different rates:

```json
"board": {
  "name": "HeroQuest First Light — Side A",
  "w": 26, "h": 19,
  "grid": [
    "..........................",
    ".AAAABBBBCCC..DDDEEEEFFFF.",
```

`.` is corridor and each letter is one **possible room**. There is no stone on
the printed board, and the outer edge is corridor. This half is traced once.

```json
"floor": {
  "rooms": [ { "at": "G", "id": 1, "name": "Welcome Center", ... } ],
```

`at` says which possible room this floor is using. **A possible room the floor
doesn't name is solid stone** — that is the whole "which rooms are in play"
mechanism, and it means an unused room needs no marking. `stone` is an optional
same-shaped mask (`x`) for the leftover case: blocking corridor squares or part
of a room.

Doors sit on **edges**, not squares, so they are listed separately and each edge
is named once, from its upper/left square, facing `E` or `S`. Everything that
sits on a square — entrance, stairs, chest, rack, table, shelf, toilet, cage,
plain furniture — is a `feature`; traps are their own list.

## What is modelled faithfully

HeroQuest combat dice (3 skulls / 2 white / 1 black), 2d6 movement, orthogonal
adjacency, wall-and-door geometry with real line of sight, doors as free actions,
monster behaviour rules 4.3.1-4.3.5 including Delegation and Performance Review,
traps (including monsters walking onto unrevealed ones), Downed → dead-for-the-floor after one round (rule 1.4),
equipment slots and two-handed conflicts, cooldowns, the d6 monster loot tables,
the three decks with loot-box exclusives pulled out per section 7, Mind-gated
spellbook learning, and card-to-nerd trading.

## What is NOT modelled — read this before trusting a number

1. **The board is real; the floor on it is a guess.** `board` was traced from a
   photo of the printed Side A (26x19, corridor edge, 22 possible rooms) and
   should be right. But which possible room is the Welcome Center, where the
   doors go, and where the entrance and stairs sit are all a first pass — check
   them against the quest sheet. Turn counts move with the route length.
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
6. **The Fan deck is abstracted, not dealt.** A Viewer is modelled as: half the
   time their card does nothing a simulator can see (Confetti, Fan Mail, the
   advert), otherwise it takes one monster attack off the table, hands a hero one
   reroll, or heals 1. That is roughly the mechanical share of section 8's
   fourteen cards, but it is not those cards. Set `fanDeck: false` to see what
   Viewers are actually worth — it is about a point of pass rate.

## Layout

- `src/board.ts` grid, rooms as rectangles, walls as edges, numeric door table
- `src/pathing.ts` Dijkstra + line of sight
- `src/engine.ts` game state, turn loop, hero AI, monster AI, all config dials
- `src/content/` the map JSON, monsters, and the three card decks as plain data —
  what the card renderer should eventually share
- `src/mapfile.ts` the map format and its adapter into the simulator's Board
- `src/tools/mapedit.html` + `mapserve.ts` the map editor and its local server
- `src/run.ts` experiments and statistics
