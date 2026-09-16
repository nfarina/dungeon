# What the simulator actually decides

The sim has two halves. The **rules half** is faithful — it is arithmetic and
geometry, and if it is wrong that is a bug. The **brain half** is a fixed policy:
one specific way of playing, not a search for the best play and not a model of
three particular people. Everything below is the brain half, so you can judge how
far to trust a number.

Short version: it plays like a competent, slightly impatient table that never
does anything clever and never does anything stupid.

---

## The rules half (faithful)

Combat dice, 2d6 movement, orthogonal adjacency, wall-and-door geometry, line of
sight, doors opening free, monster rules 4.3.1–4.3.5 including Delegation and
Performance Review, traps (heroes trigger unrevealed ones; monsters never step on any),
equipment slots and two-handed conflicts, stat stacking, cooldowns, the d6 loot
tables, deck composition with loot-box exclusives pulled, Mind-gated spellbook
learning, Downed → dead after one round, the floor cap and the Office fuse, the collapse
ramp, monsters spawning on their placed squares, and multi-square furniture.

---

## A hero's turn, in order

The hero takes the **first** thing on this list that applies, then stops.

1. **Tick cooldowns.**
2. **Drink, free.** Below 3 Health with an awake monster within 3 squares, or
   below 2 otherwise, they drink — repeatedly, until healthy or out of drinks.
   Order: Scroll of Heal, then Juice Box, then Bandage.
3. **Climb out of a pit.** Costs the whole action unless they have the Rope.
4. **Pick up a friend.** A downed hero outranks everything except a genuine
   sprint for the stairs. If they're adjacent it's automatic; if not, they'll
   walk over 85% of the time (the other 15% is somebody deciding the monster
   matters more).
5. **Swing, if already in melee.** Or shoot, with the Shortbow and a clear line.
6. **Cast or read a scroll**, if that beats walking (see below).
7. **Move**, 2d6 plus gear, toward the objective.
8. **Then act again:** take the stairs if they're standing on them and the floor
   is done, else attack, else cast, else use the furniture, else learn a
   spellbook.

Learning a Spellbook is dead last, so it only happens on a quiet turn. Furniture
needs no awake monster within 2 squares, and is skipped entirely once the clock
is tight.

## Who they attack

If something is adjacent, that. Otherwise the nearest reachable monster that is
either in the room the party is currently working, already awake, or in plain
sight — scored as `path distance − 4 × priority`.

Priority is: **+3** for Greg's Orcs (kill the staff first, so Delegation drops),
**−1** for Greg himself, **+0.5** for anything on 1 Health, **−1** for Goblins if
you're wearing the Ear Necklace. The Orc-first rule is gated on `competence`, so
a fraction of the time they swing at Greg like idiots.

## When they spend an item

This is the part you asked about, and it is a short list of rules rather than
judgement:

| Item | Rule |
|---|---|
| Juice Box / Scroll: Heal / Bandage | Automatic and free at the thresholds above |
| Energy Drink | Only against Greg or a Defend-3+ monster, and only `competence × 0.5` of the time |
| Scroll: Firebolt | Against Greg or anything with more than 1 Health, gated on `competence` |
| Scroll: Sleep | Against an Orc, Abomination or Greg, never undead, and only while some hero is at 3 Health or less |
| Spellbook: Spark | Whenever it's off cooldown and they're either not adjacent or Spark beats their melee dice |
| Lucky Rabbit's Foot | Rerolls one attack that came up zero skulls, once per floor |
| Skeleton Key / Fire Axe | Used automatically on a locked door or chest |
| Football Helmet | Eats the first trap that would hurt them |
| Rope | Pits cost nothing |
| Goblin Shortbow | Replaces melee entirely; drops to 1 die if something closes to adjacent |
| Slingshot | Melee as normal when adjacent; if the turn ends out of reach with a clear line, 1 die at the target |
| Kitchen Knife | +1 die against 1-Health monsters |

There's also one clutch save: at 0 Health, `competence × 0.4` of the time
somebody drinks instead of going down.

## The party's plan

They move as a group to the nearest room they still owe a visit, clear it, use
its furniture, then move on; the Office is always last. How greedy they are is
rolled per game — 15% do zero optional rooms, most do one or two, 15% do three.

Two pressure states change that:

- **Urgent** (the deadline is within their exit estimate + 5): stop sightseeing.
  Optional rooms and furniture are dropped, but they still fight through what's
  in the way.
- **Fleeing** (the deadline is inside their exit estimate, or the collapse has
  started with Greg alive and 2 rounds left, or they're the last one standing):
  run for the stairs, only swinging at what's already adjacent.

## The `competence` dial

Default **0.7**. It gates exactly the plays that need a bit of table-savvy:
killing Greg's Orcs first, spending Firebolt / Sleep / Energy Drink at the right
moment, and the clutch heal. `bun run src/run.ts competence` sweeps it.

**Measured, it barely matters.** Turning it from 0.3 (chaotic) to 1.0 (always
the smart play) moves the floor by a tenth of a round and the pass rate by well
under a point:

| competence | rounds to clear | boss killed | deaths/game | pass rate with the clock |
|---|---|---|---|---|
| 0.3 | 25.7 | 99.7% | 0.1 | 80.0% |
| 0.7 | 25.6 | 99.8% | 0.1 | 80.5% |
| 1.0 | 25.6 | 99.8% | 0.1 | 80.0% |

That is the most useful thing the dial has told us: on this floor, item timing
and target priority are worth almost nothing next to distance, dice and action
economy. Which is lucky, because distance, dice and action economy are the part
the sim models exactly.

---

## What it does NOT do

Cards with no combat effect are **inert** — the Whistle, the thrown
Frying Pan, Firecracker, Smoke Bomb, Stone Skin, Shove used by a hero, the
Kitchen Knife's bonus move, and spending gold.

Tactics it never uses: retreating to heal, kiting, blocking a doorway, softening
a target before finishing it, saving a scroll for the boss (Ethan's hoarding is
explicitly *not* modelled), splitting the party, luring monsters, or searching
for traps and secret doors — so the secret door is only ever found by Torchlight.

Two known infidelities, both small and both making the sim slightly pessimistic:
a Bandage revive still costs the action (§1.4 says it shouldn't), and Patch Up
heals rather than reviving from a square away. The Fan deck is abstracted to its
mechanical share rather than dealt as fourteen cards.

---

## So how much should you trust it?

The questions we've pointed it at — how many rounds the floor takes, where to set
the fuse, whether the margin distribution is tight — are driven by distance, dice
and action economy, and those are in the faithful half. The items that *are*
modelled are the ones that move those numbers.

I expected to have to warn you that a sharp table would beat this policy and the
real pass rate would be higher. The competence sweep says otherwise — playing
perfectly is worth under a point. So the numbers are more robust to the "it
isn't clever" objection than they look.

What they are *not* robust to is the map. Route length is the dominant variable
by a distance: adding four squares of detour with stone moved the median clear
from 22 rounds to 26, which is worth far more than any amount of skill. Trust the
shape of the distribution, and re-run whenever the route changes.


---

## Floor 2 additions (floor-2.md)

The rules half adds corpses, the stairwell queue, grubs that walk a fixed 4 toward the nearest corpse and flip into the fed form of what they ate, fed janitors that walk a fixed 6 toward the nearest hero by open route (they pursue across the whole floor; Floor 1 monsters still only close the last few squares), the password door, All Hands, the boss's free Snack and Understaffed, the goose's Downed state and the Pet Biscuit.

The brain half, "cleaner" (`cleanPolicy`): on a turn with nothing to fight, no awake room monster nearby and no fed janitor within eight squares, it walks to the nearest corpse worth the action and cleans it: the goose eats a small one (a medium one with the biscuit), bleach goes on a medium or large one, and Spark burns a medium or large one in line of sight when the book is ready. It never bleaches a small corpse. It squashes an adjacent grub only when that grub is one move from a medium or large corpse. It never Shoves a corpse. Patch Up is cast on anyone at 2 Health or less, and on quiet turns on anyone at 3 or less. Restructuring is read at Mind 5 on the boss or anything with 2 Health. "Runner" does none of the cleaning.

Heroes fight fed janitors only when adjacent; they never chase one. Grubs are never a target except as above. The Shift Lead is prioritised over other monsters in its room, and the Shift Office is on every route until the password is in hand.
