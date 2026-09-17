# Floor 2: "Facilities"

Draft. Everything marked **TBD** waits on the map editor or the simulator.

The same three crawlers, one floor down. Physical board: HeroQuest First Light, Side B: a cave of about twenty small rooms in five columns and one enormous chamber with a skeleton drawn into its floor. Target: ninety minutes, table to boss.

> **Announcer voice.** Same voice, one notch more tired. "Welcome to Floor 2, Crawlers. This is a *maintenance* level. Please respect the staff. They will not respect you."

**Where the party stands.** Ethan holds four Spellbooks (Spark, Nope, Shove, Patch Up), all of them hanging off the Homework Glasses, the only Mind on the table. Lucas has the Fire Axe in both hands, the Sponsored Cape, the Goblin Ear Necklace, a Sleep scroll, and Sir Reginald. Vicki has the Kitchen Knife, a one-die Slingshot, the Football Helmet and a Bandage. The party owns one Scroll: Stone Skin and one gold coin. Nobody died on Floor 1, so the revival cost stays undefined until someone needs it.

---

## 1. What changes from Floor 1

Everything in `floor-1.md` still applies unless this table says otherwise: stats, slots, cooldowns, Downed, trading, in-combat swap costs, traps, the loot decks, Viewers.

| Floor 1 | Floor 2 |
|---|---|
| Dead monsters vanish | Dead monsters leave a **corpse tile** on the board. See 1.1. |
| No background threat | **The Cleanup Crew.** Grubs arrive on a schedule, eat corpses, and become something worse. See 1.2 to 1.4. |
| Emergency Floor Reset when the boss door opens | **All Hands.** Opening the boss door empties the stairwell queue at once. The floor cap stays. See 1.6. |
| Boss door is locked | Boss door wants a **password**, carried by a named monster. No key, no axe. See 1.5. |
| HeroQuest monsters | Three custom monsters, small, medium, large, each with a fed janitor form. Section 4. |
| Sir Reginald dies at 0 Health | Reginald is **Downed** at 0, same rules as a hero: revived by an adjacent action or a Juice Box, dead if still down at the end of the next round. |
| Furniture yields a fixed draw | Same. Every piece has a fixed result on the DM sheet, flip the tile when used. The new consumable, Industrial Bleach, is only found this way. |

### 1.1 Corpses

When a monster dies, put its corpse tile on the square it died on, after the loot roll. Corpses do not block: anyone walks over one, and a hero can end a move standing on one. Shove moves a corpse like it moves a monster; a corpse pushed into a pit is gone. A corpse in a doorway is just a corpse in a doorway.

A corpse is either **cleaned** (obliterated, tile removed) or it is **food**. Three ways to clean one, as your action unless noted:

| Method | Rule |
|---|---|
| **Industrial Bleach** | Consumable. Obliterate a corpse on your square or adjacent to you. Or drink it: lose 1 Health. Why would you. |
| **Spark** | Cast it at a corpse in line of sight instead of a monster. Normal cast, normal cooldown, costs the action like any spell. |
| **Sir Reginald** | As his person's action, the goose eats an adjacent small corpse. Free, disgusting, no bleach spent. With the Pet Biscuit (section 7) he can manage a medium one. |

Janitors never leave corpses. Grubs dissolve, fed janitors get flushed, whatever the announcer feels like saying. This is the rule that keeps the floor from eating itself.

### 1.2 Grubs

The Cleanup Crew are grubs: fat, blind, slow. Flat tiles, not standees; eight of them, and eight is all the floor gets, ever. When the eighth tile is on the board or eaten and flipped, the queue stops.

- **They ignore heroes.** No attack, Defend 0, 1 Health. Killing one costs an action and yields nothing. The only reason to hit one is that it is in your way or about to reach a corpse you care about.
- **They want corpses.** On the monster turn each grub moves **4 squares, no roll**, toward the nearest corpse it can reach by open doors. No corpse on the board: it stays where it is.
- **They eat on arrival.** A grub that ends its move on a corpse eats it. Remove both, put down the fed form (1.3) on that square. One corpse per grub, ever.
- **They do not open doors.** Corpses only exist where heroes have been, so doors are already open.

### 1.3 Fed janitors

What a grub becomes is set by what it ate. Standees. Cards flip: Grub on one face, the fed form on the other.

| Ate | Becomes | Att | Def | HP | Move |
|---|---|---|---|---|---|
| Small corpse | **Bloated Grub** | 2 | 2 | 1 | 6, no roll |
| Medium corpse | **Custodian** | 3 | 3 | 2 | 6, no roll |
| Large corpse | **Facilities Manager** | 4 | 3 | 3 | 6, no roll |

(The simulator had these at one more Health each first. That version killed someone in half of all games and wiped the party in one game of nine. A fed janitor should be a chase, not a boss.)

A fed janitor **follows the party**: each monster turn it moves 6 toward the nearest hero by open route and attacks if adjacent. Fixed movement is the point. A party that keeps moving stays ahead of one; a party that stops to fight, loot or argue gets caught. It uses monster rules 4.3.2 for target choice. No loot. Killing one earns an achievement (section 7) and nothing else.

### 1.4 The stairwell queue

Grubs arrive on the clock, not on the corpses. Keep the queue on a spindown die on the DM sheet; put a grub tile on the stairs only when it has somewhere to go.

- **Schedule: one grub joins the queue at the end of round 2, and every third round after that** (5, 8, 11, ...), until eight have joined. So the party has two or three rooms of freedom before the first one is even waiting, and the eighth arrives around round 23 of a forty-round floor.
- At the start of the monster turn, if any corpse is on the board, every grub in the queue steps onto the stairs and starts walking. Otherwise they wait, and the queue die keeps climbing where everyone can see it.
- Eight grubs per floor is the budget, not a cap on how many are alive at once. The simulator tried "six alive at once" on a long floor and the Crew never stopped coming: nine fed janitors a game and a wipe in one game of nine. Six ever, with three password copies on the floor, was a 94% walk; eight is the number.

**Announcer, when the first grub leaves the stairs:** "Facilities has been notified of a mess on Floor 2. A member of staff is on the way. Please do not interact with the staff."

### 1.5 The password

The boss room door has no lock. It has a speaker. It opens for the **Password of the Day**. The Skeleton Key does nothing, the Fire Axe does nothing, knocking gets you a recorded message about business hours.

Three copies of the password are on the floor, in three corners, so the hunt is fair whichever way the party wanders and nobody has to double back across the whole board: the **Shift Lead**, a named medium monster in the Shift Office, carries one as a guaranteed drop and leaves a medium corpse, the one corpse the party most wants to clean and can least afford the time for. The other two are sticky notes, posted against policy, in the Lockup's Evidence locker and the Kennels' Feed trough, found by using the furniture. One copy is enough. The announcer should be visibly annoyed that the password is written down anywhere.

Print a big standee for the Sump door itself, so it reads as the boss door from across the table: riveted steel, a speaker, AUTHORIZED PERSONNEL ONLY.

### 1.6 The clock

- **Floor cap: 40 rounds.** Announced and counted down every round, same as Floor 1. This is a long floor by design: the party has to find the password before it can do anything else, and the Shift Office is in the far corner. The simulator's parties finish in 36 rounds at the median and the cap catches one game in eight. The Cleanup Crew is the pressure that grows; the cap is the wall at the end.
- **All Hands.** The moment the boss door opens, every grub still in the queue leaves the stairs at once and the schedule doubles: a grub every round. With corpses around, they head for corpses. With none, they head for the boss room. Announcer: "Attention, Crawlers. Facilities has declared an All Hands. This is a standard cleanliness measure and not a reflection on your hygiene. Please enjoy the remainder of your visit."
- **The collapse** is the Floor 1 ramp: 1, 1, 2, 2, 3 damage at the end of each round past zero.
- **You can leave without killing the boss.** Same rule, same forfeit, say it out loud before the fight.

**Where the simulator stands** (3,000 runs of the current layout, the real party, rules as written above, a "blind" party that opens the nearest unexplored door until it holds a password, then heads for the Sump with a random appetite for one to four more rooms, and bleaches medium and large corpses on quiet turns while the goose eats the small ones):

| Measure | Result |
|---|---|
| Party wins (boss dead, everyone down the stairs) | 88% |
| Escaped with the boss alive | 3% |
| Floor came down on somebody | 2.5% |
| Full wipe | 6% |
| Games where someone dies | 35% (Ethan most often, then Vicki) |
| Rounds to finish, median | 37 |
| Password found, median round | 20 |
| Sump door opens, average round | 28 |
| Rooms opened | 9.5 of 14 |
| Corpses made / cleaned / left at the end | 20 / 8 / 3 |
| Fed janitors per game | 7.2, in every game; the party kills 6.2 of them |
| Boss snacks per game | 1.7 |

The first draft of this floor had the Shift Office beside the forced path and a party that knew where it was. It looked fine on paper (85% win) and was wrong in the way that matters: a real table does not know which door the password is behind. The blind party on that layout still found it by round 9, because the room was right there; moved to the far corner it takes twenty rounds, which is the hunt this floor is about. One copy of the password in one corner then made the floor a lottery on which way the party wandered: one game in eight ran out of clock without ever finding it. Three copies in three corners fixed that (collapses fell to one game in seventy) and made the floor too easy, so the Crew grew from six grubs to eight.

Without the Cleanup Crew the floor is a 95% walk, so the grubs are the whole difficulty. The dials, in order of effect: where the password copies are; fed janitor Health (about ten points); the grub budget (each grub is worth about two and a half points of win rate and a few deaths); the floor cap (36 instead of 40 is worth five points, mostly as collapses). The grub schedule barely matters once the budget is fixed. If the table wants it harder, take a grub away or a round off the cap; easier, the reverse.

---|---|
| Party wins (boss dead, everyone down the stairs) | 84% |
| Escaped with the boss alive | 5% |
| Floor came down on somebody | 5% |
| Full wipe | 6.6% |
| Games where someone dies | 37% (Ethan most often, then Vicki) |
| Rounds to finish, median | 24 |
| Password found, average round | 9 |
| Sump door opens, average round | 18 |
| Corpses made / cleaned / left at the end | 12 / 6 / 1 |
| Fed janitors per game | 3.7, in 96% of games |
| Boss snacks per game | 1.9 |

The same party that never cleans wins just as often but loses someone in half of all games and wipes twice as much. Cleaning is how you keep people alive, not how you win, which is the right shape. Without the Cleanup Crew at all the floor is a 99% walk, so the grubs are the whole difficulty. The grub schedule, the grub cap and the floor cap all move the win rate by two points or less; fed janitor Health moves it by ten. That is the dial to touch if the table wants it easier or harder.

---

## 2. Players

No new crawlers. Everyone comes down the stairs as they are, and the announcer reads the inventory back to them because two of them will have forgotten. The Save-the-Date still stands: class selection happens at the bottom of this floor, so Floor 2 is the last floor of "you, but with stuff", and it is built to let each of them show what they have become.

The three upgrades seeded on the floor, and who they are obviously for without saying so:

| Find | For | Where |
|---|---|---|
| **Goblin Shortbow** | The one with the slingshot | Nice Shot achievement (section 7) |
| **Pet Biscuit** | The one with the goose | Good Boy achievement (section 7) |
| **Scroll: Restructuring** (Mind 5) and later the **Wizard's Bathrobe** (Body, Mind +1) | The one with the glasses | Furniture, section 3. Scroll early, robe late, so the scroll sits unreadable for a while. |
| **Orc Chainmail Bib** | Whoever wants to be slow and safe | The Incinerator's Ash shelf |

---

## 3. Floor layout

A first layout is in `sim/src/content/floor2.map.json` (drawn by the sim, not yet reviewed at the table): entrance top-right, Reception then the Supply Closet forced by stone, the Sump on the left with the stairs against its west wall, and the Shift Office in the bottom-right corner, as far from the Supply Closet's exits as the board allows. Fourteen of the nineteen rooms are in play; the five between the columns are stone.

The Shift Office's position is the floor's main dial. With it next to the forced path (the first draft) a party that just opens the nearest door finds the password by round 9 and the floor plays in 28 rounds. In the far corner the password turns up around round 20, the party has opened most of the floor looking for it, and the game runs 36 rounds. Anywhere in between scales between those. What the layout has to do, in order of importance:

1. **The big chamber is the boss room.** The skeleton on its floor is what the boss ate. Its door is the password door.
2. **Required by walls: the first two rooms.** Same trick as Floor 1: the entrance corridor dead-ends into them. That guarantees corpses early, and the first grub has somewhere to walk.
3. **The Shift Lead's room is required by content, not by walls.** Put it far from the forced rooms, so the party has to hunt for it, and then carry the password back across the floor with a medium corpse behind them.
4. **The scroll before the robe.** Scroll: Restructuring on the Shift Lead's desk. The Wizard's Bathrobe on the Laundry shelf, near the Sump. Ethan should own an unreadable scroll for a while.
5. **Five bleach, two on the required path.** Reception's front desk and the Supply Closet's shelving, so the mechanic gets taught on the first corpse and there is a second bottle before the Shift Lead. The other three sit in optional rooms (Boiler Room, Records, Cafeteria). With only one on the path the party found 1.6 bottles a game and left twice as many bodies.
6. **Far more rooms than they can open.** Twenty rooms and a 26-round cap means most stay shut. That is fine. The announcer should say so.
7. **Monsters at least two squares from their door**, like Floor 1. That rule was worth thirteen points of win rate.

Room table, monster count and trap placement fill in from the map file once it exists. Corridor traps and secret doors: at least one pit somewhere useful, because a corpse Shoved into a pit is the cheapest clean on the floor.

---

## 4. Monsters

Custom monsters, custom standees. Three sizes, which are also the three corpse tiles. Stats keep the HeroQuest dice math so the sanity checks in `floor-1.md` 4.1 still hold.

| Monster | Size | Att | Def | HP | Mind | Move | Loot roll (d6) | Card flavor |
|---|---|---|---|---|---|---|---|---|
| **Cave Rat** | Small | 2 | 1 | 1 | 1 | 10 | 1-3 nothing, 4-6 Pockets | "Unionized. Has a lanyard. Does not have a name tag." |
| **Kobold Miner** | Medium | 3 | 2 | 1 | 2 | 8 | 1-2 nothing, 3-4 Pockets, 5-6 Gear | "Contractor. Paid by the corpse. Hasn't been paid." |
| **Cave Bear** | Large | 3 | 3 | 2 | 2 | 6 | 1-3 Gear, 4-6 Big Gear | "Not staff. Nobody has told the bear this." |
| **The Shift Lead** | Medium | 3 | 3 | 2 | 3 | 8 | Password of the Day, plus Gear | "Has the password. Has a clipboard. Has had enough." |
| **Grub** | none | 0 | 0 | 1 | 0 | 4 fixed | nothing | "Facilities. Please do not interact with the staff." |
| **The Senior Custodian** | boss | 4 | 3 | 5 | 4 | 6 | Boss Box + Big Gear | See 4.2 |

Names are placeholders until the art exists; the sizes and the numbers are the design.

### 4.1 Combat sanity check

The party is stronger than it was: a Fire Axe at 4 dice, a caster with Spark and Shove on two-round cooldowns, Patch Up and Nope. Kobolds and bears sit where Orcs and the Abomination did; the extra Health on the bear is there so it leaves a large corpse more often than it dies to one swing. Real numbers come from the simulator.

### 4.2 The Senior Custodian

A grub that ate something with a very large skeleton, a long time ago. Too big for the door, which is why the door needs a password. Standee, the size of Greg's.

- **Snack** (free, at the start of its turn, when a corpse is in the boss room): eats it, heals 2, and still attacks. Every minion the party kills in this room becomes a meal unless somebody cleans it. Clean the corpses or Shove them out the door; either one is a turn not spent hitting the boss. (If Snack cost the boss its action it would be a gift to the party: the simulator says four points of win rate.)
- **Mop** (Cooldown 2): 2 attack dice at every hero adjacent to it. Used whenever it is off cooldown and two or more heroes are adjacent.
- **Understaffed:** while any fed janitor is on the floor, the boss defends with 4 dice instead of 3.
- On death: the killer opens the **Boss Box** and the announcer starts the class selection (section 11). No corpse. Obviously.

Two Kobold Miners stand in the room with it. Kill them and there are two medium corpses in the boss room. That is the fight.

### 4.3 Monster behavior additions

Floor 1 rules 4.3.1 to 4.3.6 stand. Added:

7. Grubs move only toward corpses, ignore heroes entirely, and stop when the board has no corpse.
8. Fed janitors move toward the nearest hero by open route, fixed 6 squares, and attack if adjacent. They leave rooms freely; they are already loose.
9. Monsters walk over corpses and never target grubs or janitors. Janitors never target monsters. Everyone on staff gets along.
10. The boss takes a Snack over any other action when a corpse is in its room.

---

## 5. Traps

Floor 1's three, same tokens. One addition: **a pit eats corpses.** A corpse Shoved into a pit, revealed or not, is gone, and the pit stays a pit.

---

## 6. Loot

Three shuffled decks again. What is physically in each one on the night, so the announcer can build them from the Floor 1 boxes plus the Floor 2 print run.

### 6.1 Pockets deck (16 cards)

Floor 1's Pockets deck with the cards the party is holding taken out (Bandage, Whistle, Scroll: Sleep, one Energy Drink), plus four reprints.

| Card | Qty | Note |
|---|---|---|
| **Juice Box** | 4 | Floor 1 cards |
| **Energy Drink** | 2 | one Floor 1 card, one reprint |
| **Gold (1)**, **Gold (2)**, **Gold (3)** | 2, 3, 1 | Floor 1 cards plus two reprinted Gold (2) |
| **Firecracker** | 1 | Floor 1 card |
| **Rope** | 1 | Floor 1 card |
| **Scroll: Heal** | 1 | Floor 1 card |
| **Bandage** | 1 | reprint |

Not shuffled: **Industrial Bleach** ×5, set out in furniture (section 3). "Obliterate a corpse on your square or adjacent to you. One use. Or drink it: lose 1 Health. Why would you."

### 6.2 Gear deck (14 cards)

Six Floor 1 cards that never got found (the shop's unsold stock goes back in), plus eight new ones. Basic kit, mostly +1s, because this floor is a scramble for the password and not a shopping trip.

| Card | Slot | Effect |
|---|---|---|
| **Goblin-Chewed Leather Jacket** | Body | Defend +1. Floor 1 card. |
| **Stolen Sneakers** | Feet | Move +2. Floor 1 card. |
| **Lucky Rabbit's Foot** | Trinket | Once per floor, reroll one die. Floor 1 card. |
| **Trap Kit** | Trinket | Disarm an adjacent revealed trap. Three uses. Floor 1 card. |
| **Scroll: Firebolt** | | 3 attack dice at a monster in line of sight. Floor 1 card. |
| **Scroll: Smoke Bomb** | | No monster can attack anyone this round. Floor 1 card. |
| **Hard Hat** | Head | Defend +1. |
| **Steel-Toed Boots** | Feet | Defend +1. |
| **Wet Floor Sign** | Off hand | Defend +1. |
| **Hi-Vis Vest** | Body | Defend +1. |
| **Push Broom** | Main hand | Attack +1. |
| **Mop** | Main hand | Attack +1. Once, obliterate an adjacent corpse as your action, no bleach. Then it's just a mop. |
| **Contractor Badge** | Trinket | Kobolds won't attack you if there's any other hero they can reach. |
| **Scroll: Lights Out** | | Every monster in your room skips its next activation. One use. |

### 6.3 Big Gear deck (5 in the deck, 10 printed)

Every Floor 1 Big Gear card is in someone's hands or was sold, so this deck is new. Five shuffled, five set out or in envelopes.

| Card | Slot | Effect |
|---|---|---|
| **Cattle Prod** | Main hand | Attack +1. A monster you damage with it skips its next activation. |
| **Janitor's Keyring** | Trinket | Opens a locked chest or door as your action. Three uses. Does not know the password. |
| **Spellbook: Mop-Up** | Learned | Mind 4+. Obliterate a corpse in line of sight. Cooldown 2. Frees Spark to be a weapon again. |
| **Spellbook: Static** | Learned | Mind 4+. 1 damage to every monster adjacent to you, no defence roll. Cooldown 3. |
| **Steel Lunchbox** | Trinket | Once per floor, heal 3. |
| **Wizard's Bathrobe** | Body | Mind +1. On the Laundry shelf. |
| **Scroll: Restructuring** | | Mind 5 to read. 4 attack dice at a monster in line of sight, and 1 damage to every monster adjacent to it. On the Shift Lead's desk. |
| **Orc Chainmail Bib** | Body | Defend +2, Move -2, no Sneakers. On the Ash shelf. |
| **Goblin Shortbow** | Both hands | 2 dice at range, can't shoot adjacent, replaces your Attack. In the Nice Shot envelope. |
| **Leaf Blower** | Both hands | Action: Shove. Push a monster or a corpse in line of sight up to 3 squares away. Into a pit, it goes in. A monster into a wall or another monster takes 1. In the Trap Chef envelope. Shove for people who can't read. |

**Carried, not drawn:** the Password of the Day ×3 (Junk: one on the Shift Lead, one in the Evidence locker, one in the Feed trough) and the Pet Biscuit (Companion upgrade, in the Good Boy envelope). Sir Reginald gets a standee of his own once the biscuit is under him.

**Retired for good:** Orc Monocle, Trash Can Lid, Torch, Frying Pan, Broken Table Leg. Torch stays retired so the Bathrobe isn't competing with a Head item and secret doors are search-only this floor.

---

## 7. Loot Boxes

Seven envelopes. Every trigger is something the announcer will see happen, so nothing needs tracking across the evening.

| Box | Tier | Trigger | Contents |
|---|---|---|---|
| **Nice Shot** | Gold | Kill a monster from range with a weapon. Spells don't count. | Goblin Shortbow |
| **Good Boy** | Companion | Sir Reginald eats a corpse | Pet Biscuit |
| **Clean Freak** | Silver | Obliterate three corpses | 4 gold, 1 Industrial Bleach |
| **Health Inspector** | Gold | Kill a fed janitor | 5 gold |
| **Why Would You Drink That** | Bronze | Drink the bleach | 3 gold, 1 Juice Box. It costs 1 Health to open. Someone will. |
| **Trap Chef** | Gold | A monster dies from a trap | Leaf Blower |
| **Boss Box** | Platinum | Kill the Senior Custodian | 8 gold and the class selection (section 11) |

Cut from the first draft: First Blood and Cartographer (Floor 1 did those), Password Accepted (opening the door is its own reward), Hoarder and Bookworm (nobody wants to count cards mid-fight).

**Pet Biscuit:** slide it under Sir Reginald. He gets his own standee and square: Health 3, 2 attack dice, moves 6 with his person's turn. Attacks on his person hit the goose instead, no roll. He can eat a medium corpse.

---

## 8. Viewers and the Fan deck

Unchanged. Two notes: **Fog Machine** stops Spark from burning a corpse, since it is a cast. **Slow Clap** works on a grub, which is the cheapest way a Viewer can save a corpse for the party.

---

## 9. Pacing budget

| Segment | Rounds |
|---|---|
| Inventory recap, announcer intro, the grub rule explained once | 0 |
| Reception, Supply Closet, first corpse, first grub | 1 to 6 |
| The hunt for the Shift Lead, most of the floor opened on the way | 7 to 20 |
| Back across the floor with the password, fed janitors in tow | 21 to 28 |
| Boss | 29 to 36 |
| Boss Box, class selection, tally | |

Thirty-six rounds at the median, forty at the cap. Two evenings, maybe three. The queue and the cap do the cutting between them: a party that dawdles meets the Crew, and a party that wanders meets the cap.

---

## 10. What has to be generated

All in the card workshop under the **Floor 2** filter, so the print run is just the new things.

| Asset | Count |
|---|---|
| Monster cards: Cave Rat, Kobold Miner, Cave Bear, Shift Lead, Grub, Bloated Grub, Custodian, Facilities Manager, Senior Custodian | 9 |
| Standees: rat, kobold, bear, Shift Lead, three fed forms, boss, Sir Reginald for the biscuit, and the Sump door | 10 designs |
| Pockets: Bleach ×5, reprints ×4 | 9 |
| Gear: eight new cards | 8 |
| Big Gear: ten cards | 10 |
| Password of the Day ×3, Pet Biscuit | 4 |
| Envelope labels | 7 |
| Furniture tiles, sized from the map, with used backs | 15 fronts, 13 backs |
| Corpse tiles: small ×6, medium ×6, large ×3. Grub tiles ×8 | 23 |
| Announcer speeches: intro, first grub, All Hands, collapse, stairs (in the map file, read from the iPad) | 5 |

---

## 11. Class selection

Designed after this floor is played once, on the Save-the-Date's promise. The floor is built so each of them arrives at the bottom having demonstrated a direction: ranged kills, a tank with a companion, a caster who read a Mind 5 scroll. The class cards should name what they already did.

---

## 12. What the simulator has to add

Behind a `floor2` config so Floor 1 numbers stay intact.

- A second map file and board (Side B).
- Corpse state per dead monster: position, size. Walkable. Shove moves it; pits delete it.
- The obliterate action: Bleach charges, Spark-as-clean on cooldown, Reginald on small corpses.
- Grubs: queue die, schedule, cap of six, fixed move 4 toward nearest corpse, eat on arrival, flip to the fed form by corpse size.
- Fed janitors: fixed move 6 toward nearest hero by open route, no loot, no corpse.
- All Hands on boss door open; the password gate on the boss door; Shift Lead guaranteed drop.
- The boss's Snack and Understaffed rules.
- Reginald's Downed state, the Pet Biscuit form.
- Two hero policies, not one: a **cleaner** (bleach the nearest medium or large corpse when no grub is within eight squares and nobody is in combat) and a **runner** (never clean, keep moving). Tune the schedule and the bleach count until both land near 80% with different failure stories.
- Report: win rate, deaths, corpses cleaned, janitors fed by size, rounds the party spent within reach of a fed janitor, and how often the boss got a Snack.

**Answered by the first runs:** the sim's party must not know where the password is (the "blind" brain opens the nearest unexplored door), and that single fact decides the floor's length. With a far Shift Office the grub cap had to become a budget or the Crew never stops. A running party does not escape fed janitors at move 6 (it loses more people, not fewer), and move 7 costs three more points. Snack matters only if it is free; as the boss's action it helped the party. The two Kobolds in the Sump produce about one and a half snacks a game.

**Still open:** the layout has not been played, the placeholder Big Gear cards are stand-ins, and the sim's cleaner never Shoves a corpse into the pit or out of the boss room, so those tricks are unmeasured upside for the real table.
