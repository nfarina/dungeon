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

The Cleanup Crew are grubs: fat, blind, slow. Flat tiles, not standees; six of them, and six is the hard cap on grubs alive at once.

- **They ignore heroes.** No attack, Defend 0, 1 Health. Killing one costs an action and yields nothing. The only reason to hit one is that it is in your way or about to reach a corpse you care about.
- **They want corpses.** On the monster turn each grub moves **4 squares, no roll**, toward the nearest corpse it can reach by open doors. No corpse on the board: it stays where it is.
- **They eat on arrival.** A grub that ends its move on a corpse eats it. Remove both, put down the fed form (1.3) on that square. One corpse per grub, ever.
- **They do not open doors.** Corpses only exist where heroes have been, so doors are already open.

### 1.3 Fed janitors

What a grub becomes is set by what it ate. Standees. Cards flip: Grub on one face, the fed form on the other.

| Ate | Becomes | Att | Def | HP | Move |
|---|---|---|---|---|---|
| Small corpse | **Bloated Grub** | 2 | 2 | 2 | 6, no roll |
| Medium corpse | **Custodian** | 3 | 3 | 3 | 6, no roll |
| Large corpse | **Facilities Manager** | 4 | 3 | 4 | 6, no roll |

A fed janitor **follows the party**: each monster turn it moves 6 toward the nearest hero by open route and attacks if adjacent. Fixed movement is the point. A party that keeps moving stays ahead of one; a party that stops to fight, loot or argue gets caught. It uses monster rules 4.3.2 for target choice. No loot. Killing one earns an achievement (section 7) and nothing else.

### 1.4 The stairwell queue

Grubs arrive on the clock, not on the corpses. Keep the queue on a spindown die on the DM sheet; put a grub tile on the stairs only when it has somewhere to go.

- **Schedule (initial, sim decides): one grub joins the queue at the end of every even round.** So the party has two or three rooms of freedom before the first one is even waiting.
- At the start of the monster turn, if any corpse is on the board, every grub in the queue steps onto the stairs and starts walking. Otherwise they wait, and the queue die keeps climbing where everyone can see it.
- Six grubs alive at once is the cap; the queue does not grow past what the tiles allow.

**Announcer, when the first grub leaves the stairs:** "Facilities has been notified of a mess on Floor 2. A member of staff is on the way. Please do not interact with the staff."

### 1.5 The password

The boss room door has no lock. It has a speaker. It opens for the **Password of the Day**, a card carried by the **Shift Lead**, a named medium monster in a room the party has to go find (section 3). The Skeleton Key does nothing, the Fire Axe does nothing, knocking gets you a recorded message about business hours. The Shift Lead drops the password as a guaranteed drop, and leaves a medium corpse, which is the one corpse the party most wants to clean and can least afford the time for.

### 1.6 The clock

- **Floor cap: 26 rounds, TBD by the simulator.** Announced and counted down every round, same as Floor 1. The Cleanup Crew is the pressure that grows; the cap is the wall at the end.
- **All Hands.** The moment the boss door opens, every grub still in the queue leaves the stairs at once and the schedule doubles: a grub every round. With corpses around, they head for corpses. With none, they head for the boss room. Announcer: "Attention, Crawlers. Facilities has declared an All Hands. This is a standard cleanliness measure and not a reflection on your hygiene. Please enjoy the remainder of your visit."
- **The collapse** is the Floor 1 ramp: 1, 1, 2, 2, 3 damage at the end of each round past zero.
- **You can leave without killing the boss.** Same rule, same forfeit, say it out loud before the fight.

---

## 2. Players

No new crawlers. Everyone comes down the stairs as they are, and the announcer reads the inventory back to them because two of them will have forgotten. The Save-the-Date still stands: class selection happens at the bottom of this floor, so Floor 2 is the last floor of "you, but with stuff", and it is built to let each of them show what they have become.

The three upgrades seeded on the floor, and who they are obviously for without saying so:

| Find | For | Where |
|---|---|---|
| **Goblin Shortbow** | The one with the slingshot | Nice Shot achievement (section 7) |
| **Pet Biscuit** | The one with the goose | Good Boy achievement (section 7) |
| **Scroll: Restructuring** (Mind 5) and later the **Wizard's Bathrobe** (Body, Mind +1) | The one with the glasses | Furniture, section 3. Scroll early, robe late, so the scroll sits unreadable for a while. |
| **Orc Chainmail Bib** | Whoever wants to be slow and safe | Furniture in a late room |

---

## 3. Floor layout

**TBD in the map editor.** Side B into a new map file (`sim/src/content/floor2.map.json`), same layers as Floor 1. What the layout must do, in order of importance:

1. **The big chamber is the boss room.** The skeleton on its floor is what the boss ate. Its door is the password door.
2. **Required by walls: the first two rooms.** Same trick as Floor 1: the entrance corridor dead-ends into them. That guarantees corpses early, and the first grub has somewhere to walk.
3. **The Shift Lead's room is required by content, not by walls.** Put it off the main route, two or three rooms deep, so the party has to find it and then carry the password back across the floor with a medium corpse behind them.
4. **The scroll before the robe.** Scroll: Restructuring in furniture near the Shift Lead. The Wizard's Bathrobe in furniture in one of the last rooms before the boss. Ethan should own an unreadable scroll for at least three rooms.
5. **Four bleach, spread out.** One in the first required room, so the mechanic gets taught on the first corpse. The rest deeper in.
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

- **Snack** (its action, when a corpse is in the boss room): eats it and heals 2. Every minion the party kills in this room becomes a meal unless somebody cleans it. Clean the corpses or Shove them out the door; either one is a turn not spent hitting the boss.
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

The Floor 1 decks, reshuffled, with the cards the shop sold or retired pulled out, and these added:

| Card | Deck | Slot | Effect |
|---|---|---|---|
| **Industrial Bleach** ×4 | Pockets, but placed in furniture, not shuffled | | Obliterate a corpse on your square or adjacent. One use. Or drink it: lose 1 Health. Why would you. |
| **Wizard's Bathrobe** | Big Gear, placed in furniture | Body | Mind +1. Terrycloth. Stacks with the Glasses, which is the whole point of it being a robe. |
| **Scroll: Restructuring** | Big Gear, placed in furniture | | **Mind 5 to read.** 4 attack dice at a monster in line of sight, and 1 damage to every monster adjacent to it. One use. |
| **Password of the Day** | Junk, carried by the Shift Lead | | "Today's password is: [the announcer picks something embarrassing]. Do not write it down." Opens the boss door when read aloud. |
| **Pet Biscuit** | Companion upgrade, in the Good Boy envelope | slides under Sir Reginald | Reginald gets his own standee and square. Health 3, 2 attack dice, Move 6 with his person's turn. When a monster attacks his person, it attacks the goose instead, no roll. He can eat a medium corpse. |
| **Orc Chainmail Bib** | Big Gear, placed in furniture | Body | As Floor 1. |
| **Goblin Shortbow** | Big Gear, in the Nice Shot envelope | Both hands | As Floor 1. |

Retired for good: Goblin Shortbow from the deck (it lives in an envelope now), Orc Monocle, Trash Can Lid, Torch, Frying Pan, Broken Table Leg. Sold at the shop, so out of the decks: Spellbook: Shove, Spellbook: Patch Up, Scroll: Stone Skin.

The **Torch** stays retired, so the Wizard's Bathrobe is not competing with a Head item and the secret-door rule this floor is search only.

---

## 7. Loot Boxes

Same envelopes, new labels. The Floor 1 boxes that were never earned come back with the same contents.

| Box | Tier | Trigger | Contents |
|---|---|---|---|
| **First Blood** | Bronze | First monster killed on the floor | 3 gold, 1 Juice Box |
| **Nice Shot** | Gold | Kill a monster that isn't adjacent to you | Goblin Shortbow |
| **Good Boy** | Companion | Sir Reginald eats a corpse | Pet Biscuit |
| **Clean Freak** | Silver | Obliterate three corpses | 4 gold, 1 Industrial Bleach |
| **Health Inspector** | Gold | Kill a fed janitor | 5 gold |
| **Hoarder** | Bronze | Carry three unequipped items in your backpack at once | "Congratulations." A card. |
| **Bookworm** | Silver | Cast four different spells on the floor | Bookmark, if it is not already on the table; otherwise 3 gold |
| **Password Accepted** | Bronze | Open the boss door | 2 gold and a lanyard. Trinket, no effect. |
| **Cartographer** | Silver | Open the doors to eight rooms | 5 gold |
| **Trap Chef** | Gold | A monster dies from a trap | Fire Axe is taken; **TBD**, something for the one who does not have the axe |
| **Boss Box** | Platinum | Kill the Senior Custodian | 8 gold, the class selection, and **TBD** one card per class chosen |

Trap Chef and Boss Box contents wait on the class design (section 11).

---

## 8. Viewers and the Fan deck

Unchanged. Two notes: **Fog Machine** stops Spark from burning a corpse, since it is a cast. **Slow Clap** works on a grub, which is the cheapest way a Viewer can save a corpse for the party.

---

## 9. Pacing budget

| Segment | Minutes |
|---|---|
| Inventory recap, announcer intro, the grub rule explained once | 10 |
| First two rooms, first corpse, first grub | 20 |
| The hunt for the Shift Lead | 25 |
| Two optional rooms | 15 |
| Boss | 15 |
| Boss Box, class selection, tally | 10 |

Ninety-five minutes. The queue does the cutting: a party that dawdles meets the Crew, and a party that runs meets the cap.

---

## 10. What has to be generated

| Asset | Count |
|---|---|
| Monster cards: Cave Rat, Kobold Miner, Cave Bear, Shift Lead, Grub, Senior Custodian | 6 |
| Fed janitor cards: Bloated Grub, Custodian, Facilities Manager (printed as the flip side of the Grub card's three copies, or three separate cards) | 3 |
| Standees: rat, kobold, bear, Shift Lead, three fed forms, boss | 8 designs |
| Grub tiles | 6 |
| Corpse tiles: small, medium, large | 3 designs, counts from the map |
| New item cards: Bleach ×4, Bathrobe, Restructuring, Password, Pet Biscuit, lanyard, "Congratulations." | 10 |
| Envelope labels | 11 |
| Furniture tiles for whatever Side B gets, with used backs | from the map |
| Announcer speeches: intro, first grub, All Hands, boss, class selection | 5 |

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

**Open questions for the sim:** whether a grub every even round is too many or too few; whether six is the right cap; whether fed move 6 lets a running party ignore them entirely; whether the boss room's two Kobolds make Snack a fight-defining rule or a footnote.
