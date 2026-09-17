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
bun run src/tools/drawmap.ts [2]    # ASCII picture of the board (2 = Floor 2)
bun run src/floor2.ts report 2000   # Floor 2 (floor-2.md): corpses, grubs, the password, the boss's snacks
bun run src/floor2.ts trace 7       # one Floor 2 game, narrated
bun run src/floor2.ts brains 1200   # cleaner vs runner party, no grubs, no cap
bun run src/floor2.ts sweep 1200    # grub schedule, cap, fed move, floor cap, All Hands, Snack
bun run src/replay.ts 7 2            # one recorded game (seed 7, Floor 2), step by step
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

**Sim** plays one game on the map as it stands in the editor (unsaved edits
included), using the same party sampling and ruleset as the batch reports, and
lets you step through it: ← → one hero turn or DM phase at a time, ↑ ↓ a round,
Space autoplays, N rolls a new game. A seed replays the same game, so change a
monster placement and hit "Replay seed" to see what it does to that evening
(it diverges from the first die the change touches). The engine records it
behind `record: true` (`Frame` in `engine.ts`); recording draws no dice.

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
traps (monsters never step on one; only a hero can put them there), Downed → dead-for-the-floor after one round (rule 1.4),
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
3. **Cards with no combat effect are inert:** the Whistle, the Frying
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

## Map file: placed monsters and sized furniture

- `floor.monsters` is a list of `{ x, y, id }`. A room with any placed monsters
  spawns exactly those squares; a room with none scatters its `monsters` list at
  random (the old behaviour). The editor's Monsters layer writes this list and
  keeps the room's roster in sync. `placedMonsters: false` in the config ignores
  placements, for A/B runs.
- Features take an optional `w` and `h` (default 1x1), anchored at the top-left
  square. Blocking furniture blocks every square of its footprint; the stairs are
  a 2x2 and a hero on any of the four squares counts as on the stairs. The
  editor's Furniture tools have W/H inputs.
- Deck exclusives match floor-1.md section 7: Football Helmet, Scroll: Firebolt,
  Orc Monocle and Fire Axe are pulled into envelopes at setup; with
  `guaranteedSpellbook` Spark is pulled onto the Armory rack. Sharing Is Caring
  pays 2 gold. The Sponsored Cape (Big Gear) turns a hero's first death of the
  floor into Downed at 1 Health.
- `bun run src/run.ts report N` uses the recommended ruleset; `src/tools/content.ts N rec`
  needs the `rec` argument to match it, otherwise it reports the as-written rules.

## The iPad page: Edit | DM | Intro | Guide

`bun run map` serves one page with four views. **Edit** is the map editor.
**DM** is the table view: the clock, a round checklist, the room roster, and an
Announcer pane with the floor's speeches. **Intro** shows one speech at a time
in large type for reading aloud (the first is the welcome speech for players who
haven't read the books). **Guide** renders the floor's guidebook markdown
(`floor.guide` in the map file, e.g. `../floor-1.md`) live from disk, so the
markdown stays canonical and the page never goes stale. Speeches live in
`floor.speeches` and are edited in the Announcer pane in Edit mode.
