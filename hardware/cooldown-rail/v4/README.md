# Card tracker V4 — 0–12, smaller raised numbers

The left, **one-rib A slider** from your successful V3 print is the only
slider in this print set. Its geometry, the card clips, cap and rail body
are unchanged. The other slider option has been removed from this version.

The scale now reads **0–12** for cooldowns, HP, MP or other card values.
Numerals are 2.5 mm tall, down from 3.8 mm, approximately the original
lettering size. They remain bold, raised 0.6 mm and assigned to filament 2.

## Print plates

Each project below is a separate plate. Open it as a **project** in Bambu
Studio to retain the saved settings and color assignments.

| Project | Contents | Local estimate |
|---|---|---|
| **01-track-only.3mf** | Full 0–12 rail and raised numerals | 27 min / 7.6 g |
| **02-slider-cap-clips.3mf** | Selected one-rib slider, cap, two card clips | 16 min / 1.9 g |
| **00-small-number-test.3mf** | Optional short rail with 0, 1, 2, 10, 12 | 21 min / 5.1 g |

The numbered rail is the only model on its plate. The body finishes before
the raised numbers begin, so the checked slice has **one color change**.
The separate hardware plate has none. The small test intentionally skips
some numbers to check both single- and double-digit readability.

Your existing V3 slider, cap and clips can be reused: print only the new
rail if you already have those parts. A finished tracker uses two clips.

## Settings and assembly

All projects save **Bambu A1 mini / 0.4 mm nozzle / 0.20 mm layers**, with
3 walls, 20% infill, Arachne walls, supports off, no brim and the supplied
print orientations. Keep 100% scale. Bambu PLA Basic and Textured PEI are
placeholders; select your actual material and plate, then slice before printing.

Filament 1 is the body; filament 2 is the numerals. Orange and white are
placeholders for your AMS Lite spools. The single-color hardware plate uses
filament 1 only. Estimates include sliced purge/prime material and vary with
filament and printer setup.

1. Slide two clips over the empty rail's open **0 end**. Park them in the
   blank end margins, about 6–11 mm and 83–88 mm from that opening.
2. Insert the slider with its long tail toward 0 and spring bump toward
   the unnumbered wall. The one-rib slider is the version you selected.
3. Fit the cap, then retain it with your small dab of glue at the outside
   joint, keeping glue out of the moving channel.
4. Attach to a card. The supplied clips place the card on the rail's left,
   so the tracker sits on the card's right edge. The alternative clip STLs
   retain the previous nominal gaps and mirrored mounting options.

## Checks and source

The slider, clips, cap and rail body were compared byte-for-byte with their
V3 STL files and match. The smaller lettering is the new print detail to
check. All new meshes are manifold; all three final projects slice on one
A1 mini plate without reported warnings. No print was sent to a printer.

The print pack includes the editable Blender file, `build.py`,
`print-plan.json` and `prepare_bambu_projects.py`. To rebuild the native
projects, run the latter with this folder as its argument after generating
the meshes with Blender. Reports and the actual-model preview are included.

STL pairs named `*-body` and `*-numerals` must be imported as aligned parts
of one object. Do not drop the numeral part to the bed independently. The
`*-one-color` rail STLs combine the raised letters and body for single-color
printing. Prefer the prepared 3MFs for AMS printing.
