# Card workshop

Turns `src/catalog.ts` into printable cards. Layout is HTML/CSS sized in inches;
artwork comes from Gemini image models, matched to `../art-style.png`.

```
bun install
bun run cards               # http://localhost:5174 — preview, edit prompts, generate, print
bun run gen --all           # generate art for every card that has none (or is stale)
bun run gen --deck gear     # one deck
bun run gen --id goblin --force
bun run check               # catalog vs simulator, by name
```

## How it fits together

- `src/catalog.ts` — every card as data: deck, type, rules, flavor, art prompt. Counts match `floor-1.md`.
- `style.md` — the style prefix prepended to every art prompt. `../art-style.png` is sent along as a reference image.
- `src/gen.ts` — calls Gemini, saves `art/<id>.<hash>.png`, records it in `art/manifest.json`.
  The hash covers model + style text + reference image + prompt, so changing any of them marks the art **stale**
  in the UI and `gen --all` redoes only what changed. PNGs are gitignored; the manifest is not.
- `overrides.json` — prompt edits made in the UI. Survives catalog changes.
- `src/templates.ts` — card fronts by type, low-ink backs by deck, 4×2 in envelope labels, and the print layout.
- `src/server.ts` — the workshop UI and `/print`.

## Printing

`/print?deck=gear` (or `?ids=a,b,c`) lays cards out 3×3 on letter pages, fronts then backs, with cut marks in
the margins. Print at **100% scale, duplex, flip on long edge**; `?flip=short` if your printer binds the other way,
`?perPage=6` if the bottom row clips. Backs are white with a single outlined word and no border, so duplex costs almost no toner and a slightly misregistered back side is invisible.

If the backs land a millimetre or two off the fronts, use the **Back offset** arrows in the print bar (`?bx=1&by=0`, in mm). The print page remembers the last value and the workshop's print buttons reuse it. Cards have a thick square outer frame so the cut line can wander a bit into the frame without showing parchment.
Envelope labels print single-sided, 10 per sheet, on plain paper or Avery 5163.

**Floor tiles** (`?deck=tile`) and **standees** (`?deck=standee`) share a guillotine layout: rows of equal height, so every horizontal cut runs the full page width and each strip is then cut at the white ticks. Both print duplex. Tiles carry their name on the back; standees show the figure mirrored on the back with a 0.3 in tab at the bottom for the plastic clip stands. Print standees on cardstock.

Floor tiles take their footprint and count from the map editor's file (`sim/src/content/floor1.map.json`) via each tile's `mapKey`: a feature kind, a generic piece's label, a trap kind, "secret door" or "falling block". Resize a piece in the map editor and the tile follows on the next reload; its art goes stale if the shape changed. `bun run check` flags map pieces without a tile and tiles missing from the map.

Cards that share an art prompt (the four Juice Boxes, the pit tiles) share one image: generating any of them fills in all of them. A card with `ref: "<id>"` sends that card's current art along as a second reference image ("this exact character"), which is how the standees match the crawler portraits and the boss card. Generate the referenced card first; regenerating it marks the dependent art stale.

## Adding a floor

Add cards to the catalog (or a `floor-2.ts` that exports more), give each an `art` prompt, run `gen --all`, print the new decks.
