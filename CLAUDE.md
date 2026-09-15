# Dungeon

A custom family board game loosely based on (and reusing some parts from) HeroQuest: First Light,
with fully custom printed cards, tiles, rules and floors, themed on Dungeon Crawler Carl. Dad (User)
is the DM/announcer; players are Mom and two boys (both 11). Sessions are ~1-2 hours; content is
being tuned between plays.

## Where things live

- `floor-1.md` — the design doc and DM guide for Floor 1. Rules, room-by-room layout, loot,
  loot boxes, Fan deck, sim numbers. The source of truth for *rules*. `bun run printguide`
  (in `sim/`) renders it to `floor-1.print.html`.
- `sim/` — Bun + TypeScript simulator of Floor 1 (`src/engine.ts` rules + fixed hero policy,
  `src/run.ts` batch/report CLI, `src/tools/`). `README.md` lists the commands; `BEHAVIOUR.md`
  explains what the hero "brain" does and does not do, read it before trusting a number.
- `sim/src/content/floor1.map.json` — the real board layout (rooms, doors, furniture, traps,
  monster placements). Source of truth for *geometry*. Edited with the map editor (`bun run map`
  in `sim/`, port 5173), which also serves an iPad DM view with the round/collapse counter.
- `cards/` — card workshop: `src/catalog.ts` is every printed card as data; `bun run cards`
  (port 5174) previews, edits art prompts, generates Gemini art, prints duplex sheets.
  `README.md` covers the print pipeline. `bun run check` verifies catalog, sim item lists and
  map tiles agree by name; run it after touching any of the three.
- `hardware/` — 3D-printed table pieces (collapse timer, cooldown rail); Bambu slicing scripts.
- `.gemini.key` at repo root — the Gemini API key, gitignored. Never print or echo it.
- `art-style.png` + `cards/style.md` — art style reference and prompt prefix for all card art.

## Sim conventions

- The "real" ruleset is `RECOMMENDED` in `sim/src/run.ts`. `bun run src/run.ts report 3000`
  is the balance report; `bun run src/tools/content.ts 2000 rec` is the card/room usage
  report (the `rec` argument is required or it runs the bare rules).
- Current tuning: 22-round floor cap plus a 5-round fuse that starts when the Office door
  opens, soft collapse. Target is ~80% win rate. Monster placements on the map are a real
  balance dial; furniture that seals a room changes results a lot.
- Importing `./src/run` from any script runs its CLI (it reads `process.argv`). For A/B
  experiments write a throwaway `.ts` inside `sim/` that imports `./src/run`, run it with
  `bun run`, and delete it. Results of the last batch are in the exported `LAST` array.
- Batches of a few thousand games take 1-3 minutes; run them in the background.
- Typecheck with `bunx tsc --noEmit -p .` inside `sim/` or `cards/` (no `tsc` on PATH).
- Trap Chef is unmeasurable in the sim: monsters never step on traps on their own.

## Keeping the three sources aligned

A rule change usually touches all of: `floor-1.md` (rule text and the sim numbers table),
`sim/src/engine.ts` (behind a `Config` toggle, default on), `cards/src/catalog.ts` and
`cards/src/templates.ts` (card rules text, reference card back). Then re-run the report and
`bun run check`.
