# Cooldown rail V3 — tighter sliders and a card-clip test

**Start with `00-sliders-and-clip.3mf`.** It prints two revised sliders and
one bare-card clip, in one color. Use these with your existing V2 test rail
and cap. The rail, lettering, cap and clip geometry are unchanged from V2.

Your V2 print established that the lettering works, both sliders hold a
position, and the cap fits but needs glue for retention. V3 addresses the
remaining slider play. Its new fit and spring feel need this next print test.

## Choose a plate

| Project | Contents | Approximate local slicing estimate |
|---|---|---|
| **00-sliders-and-clip.3mf** | A slider, B slider, one card clip | 15 min / 2 g; one color |
| **01-test-fit.3mf** | Same three parts, plus the five-position test rail and cap | 36 min / 8.8 g; two colors |
| **02-full-tracker.3mf** | Full R–12 rail, A slider, cap, two card clips | 42 min / 11 g; two colors |

Open as a **project** in Bambu Studio. All three have **A1 mini / 0.4 mm
nozzle / 0.20 mm layers** saved, with the same printing settings used for V2:
3 walls, 20% infill, Arachne walls, supports off and supplied orientations.
Keep 100% scale and select your actual PLA profile and plate.

The quick plate uses only filament 1. On the other plates, filament 1 is the
hardware and filament 2 is the raised numerals. Orange and white are color
placeholders; map them to your AMS Lite spools. Slice before printing.
Estimates include sliced purge material but depend on printer setup and
filament selection.

## What's different about the sliders

- Closer guides reduce nominal lateral clearance from **0.30 to 0.18 mm
  per side**, a 40% reduction in the total sideways clearance.
- The guide bevels also reduce vertical play. This addresses wobble
  separately from the click spring.
- The rounded spring tip is larger than the pocket opening, so it rests
  against the pocket shoulders under a little tension. V2's smaller tip
  could sit freely inside its pocket. The rail itself has not changed.
- Spring **A is 1.30 mm** thick; spring **B is 1.40 mm**. V2 used 1.20 mm
  for standard and 1.05 mm for light. Both V3 options share the same guides
  and tip, so comparing A and B isolates spring thickness.

**A has one raised grip rib; B has two.** On the supplied quick plate,
A is left, B is in the middle, and the card clip is right. Use the ribs to
identify them if the plate is rotated or rearranged. Start with A.

## Test the sliders

1. Let the print cool, then remove strings or raised first-layer burrs from
   the sliding surfaces. Remove the cap from your V2 rail.
2. Insert A at the open R end. The long tail points toward that opening;
   the rounded spring tip faces the unnumbered wall.
3. Move it in both directions. Compare its click and side-to-side and
   up-and-down movement with your V2 slider. It should hold a middle
   position when the rail is tilted vertically without the cap installed.
4. Repeat with B. A and B should have similar guide play; B is intended
   to require more push force. If both bind, that suggests the closer guide
   fit is too tight for the print, rather than a choice between springs.
   Do not force a stuck slider.

The short test rail still reads **R, 1, 2, 10, 12** to include both single-
and double-digit lettering samples. The full rail has every value R–12.

## Test the card clip

The supplied clip is the **0.50 mm nominal-slot, card-on-left** version:
the tracker will sit on the card's right edge. Its rounded contact rib
reduces the local gap to about **0.20 mm**, with the jaw intended to flex
around the card. This is a starting fit, not a measured match to your stock.

1. Slide the clip over the open end of the empty rail before installing
   the slider or cap. Park it in the blank margin near R, about 6–11 mm
   from the rail end. Its small external jaw points toward the card.
2. Try a spare card edge under that jaw. Check **both** the clip's grip
   on the rail and its grip on the cardstock. It should stay attached
   without needing to force the card or crease its edge.
3. One clip is enough to test fit. A finished tracker uses two; the full
   tracker plate includes the pair.

“110” is a paper-weight designation, not a thickness in millimetres.
Thickness also depends on the paper grade and finish, so there is no exact
conversion from that label alone. Paper suppliers publish weight and
caliper separately; see [Neenah's paper specifications](https://www.neenahpaper.com/-/media/files/storefront/stocklist-guides/sl_environment.pdf).
If the clip needs adjustment, a thickness measurement or the precise brand
and paper type would help. Without calipers, measuring a stack of 20 matching
sheets in millimetres and dividing by 20 gives a useful rough estimate.

## Cap and compatibility

Keep the cap removable until you choose a slider. Your existing cap fit is
preserved; after testing, use the small dab of glue you suggested at the
outer cap-to-rail joint, keeping glue out of the moving channel.

All V3 sliders fit the **V2 rail design**. V1 compatibility is not assumed.
STLs for both sliders, the combined single-color rails, and the optional
clip arrangements are included. Use a body/numeral STL pair as aligned parts
of one object; do not independently lower the numerals to the bed.

## Checks and editable files

The exported parts are closed manifold meshes. Geometry checks cover
preloaded resting positions, lateral extremes, the slider resting on the
channel floor, the spring's deflected travel envelope and cap clearance.
They use an approximate beam shape, not a stress or fatigue simulation.
All three saved projects slice on one A1 mini plate without reported warnings.
Physical printing still determines friction, click force, sound and durability.

`build.py` and `cooldown-rail.blend` are editable sources. Reports are in
`validation/`; `validate_slicing.py` rebuilds the native Bambu projects using
the installed profiles. No files were sent to a printer.
