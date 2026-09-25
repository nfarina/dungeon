# Floor 2: "Facilities"

Draft until it has been played once. Layout, loot and numbers below match the map file and the simulator as of this writing.

The same three crawlers, one floor down. Physical board: HeroQuest First Light, Side B: a cave of about twenty small rooms in five columns and one enormous chamber with a skeleton drawn into its floor. Target: ninety minutes, table to boss.

> **Announcer voice.** Same voice, one notch more tired. "Welcome to Floor 2, Crawlers. This is a *maintenance* level. Please respect the staff. They will not respect you."

**Where the party stands.** Ethan holds four Spellbooks (Spark, Nope, Shove, Patch Up), all of them hanging off the Homework Glasses, the only Mind on the table. Lucas has the Fire Axe in both hands, the Sponsored Cape, the Goblin Ear Necklace, a Sleep scroll, and Sir Reginald. Vicki has the Kitchen Knife, a one-die Slingshot, the Football Helmet and a Bandage. The party owns one Scroll: Stone Skin and one gold coin. Nobody died on Floor 1, so nobody needed reviving between floors; anyone who dies down here plays the Fan deck for the rest of the floor (Floor 1, section 8) and comes back on Floor 3 at a price that floor sets.

---

## 1. What changes from Floor 1

Everything in `floor-1.md` still applies unless this table says otherwise: stats, slots, cooldowns, Downed, trading, in-combat swap costs, traps, the loot decks, Viewers.

| Floor 1 | Floor 2 |
|---|---|
| Dead monsters vanish | Dead monsters leave a **corpse tile** on the board. See 1.1. |
| No background threat | **The Cleanup Crew.** Grubs arrive on a schedule, eat corpses, and become something worse. See 1.2 to 1.4. |
| Emergency Floor Reset when the boss door opens | **All Hands.** Opening the boss door empties the stairwell queue at once. The floor cap stays. See 1.6. |
| Boss door is locked | Boss door wants a **password**, carried by a named monster. No key, no axe. See 1.5. The door also shuts behind the party once everyone is inside. |
| Fire Axe opens locked chests | **Skeleton Key only.** The axe opens nothing locked on this floor. Both chests (the Filing cabinet and the Evidence locker) need a key: the party carries one and a second hangs on the Tool Crib's tool rack. |
| HeroQuest monsters | Three custom monsters, small, medium, large, each with a fed janitor form. Section 4. |
| The stride: with no monster revealed on the board, walk 8 instead of your roll | Same rule, and **grubs do not count as monsters for it.** They ignore you, so they do not stop you striding. A fed janitor does, and so does anything else awake and revealed. Without this ruling the stride would cover a tenth of your move turns instead of half, and the floor would crawl. |
| Spellbooks just have five empty boxes | **Mastery** (Floor 1, section 6.3): five casts and the book does one more, for good, printed on each card. Ethan's Spark is already there and rolls 3 dice. Mastery never shortens a cooldown; Spark's cooldown is what this floor's corpse budget is built on. Mop-Up mastered takes a second corpse next to the first, which is the one mastery that touches the Crew. |
| Sir Reginald dies at 0 Health | Reginald is **Downed** at 0, same rules as a hero: revived by an adjacent action or a Juice Box, dead if still down at the end of the next round. |
| Furniture gives a deck draw by type (rack: Gear, table: Pockets, shelf: Gear or Big Gear) | **Every piece holds one named card**, no deck draw. Searching it is an action; the announcer hands over the card the DM view (or the room table in section 3) lists for that room, and the tile flips. Chests still need a Skeleton Key, spent. Industrial Bleach is only found this way. |

### 1.1 Corpses

When a monster dies, put its corpse tile on the square it died on, after the loot roll. Corpses do not block: anyone walks over one, and a hero can end a move standing on one. Shove moves a corpse like it moves a monster; a corpse pushed into a pit is gone. A corpse in a doorway is just a corpse in a doorway.

A corpse is either **cleaned** (obliterated, tile removed) or it is **food**. Three ways to clean one, as your action unless noted:

| Method | Rule |
|---|---|
| **Industrial Bleach** | Consumable. Obliterate a corpse on your square or adjacent to you. Or drink it: lose 1 Health. Why would you. |
| **Spark** | Cast it at a **small** corpse in line of sight instead of a monster. Normal cast, normal cooldown, costs the action like any spell. |
| **Sir Reginald** | As his person's action, the goose eats an adjacent small corpse. Free, disgusting, no bleach spent. Small only, biscuit or no biscuit. |

Medium and large corpses need bleach (or the Mop, once, or Spellbook: Mop-Up). Bleach is scarce on purpose: the party should be choosing which bodies to deal with, not wiping the floor clean.

Janitors never leave corpses. Grubs dissolve, fed janitors get flushed, whatever the announcer feels like saying. This is the rule that keeps the floor from eating itself.

### 1.2 Grubs

The Cleanup Crew are grubs: fat, blind, slow. Flat tiles, not standees; eight of them, and eight is all the floor gets. Once all eight have joined the queue the schedule stops, but a squashed grub doesn't use one up (below).

- **They ignore heroes.** No attack, Defend 0, 1 Health. Squashing one costs an action and yields nothing.
- **Squashed grubs go back to the stairwell.** Put the tile back and add one to the queue die: it comes out again the next time the queue leaves the stairs. Squashing buys time for a corpse you care about; it does not shrink the Crew. You are beating back the tide, not ending it.
- **They want the big job first.** On the monster turn each grub moves **4 squares, no roll**, toward the **largest** corpse it can reach by open doors; ties go to the nearest. A bear's body pulls the whole Crew across the floor while the rats lie where they fell. No corpse it can reach: it stays where it is.
- **They eat on arrival.** A grub that ends its move on a corpse eats it. Remove both, put down the fed form (1.3) on that square. One corpse per grub, ever.
- **They do not open doors.** Corpses only exist where heroes have been, so doors are already open.

### 1.3 Fed janitors

What a grub becomes is set by what it ate. Standees. Cards flip: Grub on one face, the fed form on the other.

| Ate | Becomes | Att | Def | HP | Move |
|---|---|---|---|---|---|
| Small corpse | **Bloated Grub** | 2 | 2 | 1 | 6 |
| Medium corpse | **Custodian** | 3 | 3 | 2 | 6 |
| Large corpse | **Facilities Manager** | 4 | 3 | 3 | 6 |

(The simulator had these at one more Health each first. That version killed someone in half of all games and wiped the party in one game of nine. A fed janitor should be a chase, not a boss.)

A fed janitor **follows the party**: each monster turn it moves 6 toward the nearest hero by open route and attacks if adjacent. Fixed movement is the point. A party that keeps moving stays ahead of one; a party that stops to fight, loot or argue gets caught. It uses monster rules 4.3.2 for target choice. No loot. Killing one earns an achievement (section 7) and nothing else.

### 1.4 The stairwell queue

Grubs arrive on the clock, not on the corpses. Keep the queue on a spindown die on the DM sheet; put a grub tile on the stairs only when it has somewhere to go.

- **Schedule: one grub joins the queue at the end of round 2, and every third round after that** (5, 8, 11, ...), until **seven** have joined (the seventh at round 20). The eighth is not on the clock: it is the one waiting at the boss door (1.6). So the party has two or three rooms of freedom before the first one is even waiting.
- At the start of the monster turn, if any corpse is on the board, every grub in the queue steps onto the stairs and starts walking. Otherwise they wait, and the queue die keeps climbing where everyone can see it.
- **Eight grub tiles, eight joins.** Seven from the schedule, one from All Hands, then the Crew is complete for the floor. A squashed grub goes back into the queue (1.2) without counting as a new join, so the Crew can be pushed back but never grows past eight. (The simulator first tried a limit of six on the board at once, with no total: on a forty-round floor the Crew never stopped coming, nine fed janitors a game and a wipe in one game of nine. Six in total, with three password copies on the floor, was a 94% walk; eight in total is the number.)
- **The schedule adds grubs; corpses let them out.** A grub in the queue, new or squashed, leaves the stairs on the very next monster turn that has a corpse on the board. A grub squashed on your turn is walking back out of the stairwell that same round.

**Announcer, when the first grub leaves the stairs:** "Facilities has been notified of a mess on Floor 2. A member of staff is on the way. Please do not interact with the staff."

### 1.5 The password

The boss room door has no lock. It has a speaker. It opens for the **Password of the Day**. The Skeleton Key does nothing, the Fire Axe does nothing, knocking gets you a recorded message about business hours.

The password is in three places, in three corners, so the hunt is fair whichever way the party wanders and nobody has to double back across the whole board: the **Shift Lead**, a named medium monster in the Shift Office, carries it as a guaranteed drop and leaves a medium corpse, the one corpse the party most wants to clean and can least afford the time for. The other two are sticky notes, posted against policy, on the Kennels' Feed trough and the Incinerator's Ash shelf, found by searching the furniture. Neither is behind a lock: with the password in the chests, a party that had spent its keys elsewhere had to go the long way round and the floor came down on somebody in one game in five.

**Only one card is printed.** Whichever of the three they reach first hands it over. If they later search one of the others, the note is on the wall and they already know the word, so hand over a Pockets draw instead and let them feel clever about it. The announcer should be visibly annoyed that the password is written down anywhere.

**The door shuts behind you.** The moment the last member of the party is inside the Sump, close the door: put the standee back across the doorway. Nothing on staff can open a door, so the boss fight is the party, the boss and whatever walked in with them. Fed janitors already inside stay inside; the ones still chasing pile up in the corridor. The party can open it again from inside (they have the password) if they would rather run, and if they do it stays open.

Print a big standee for the Sump door itself, so it reads as the boss door from across the table: riveted steel, a speaker, AUTHORIZED PERSONNEL ONLY.

### 1.6 The clock

- **Floor cap: 48 rounds.** Announced and counted down every round, same as Floor 1. This is a long floor by design: the party has to find the password before it can do anything else, and the Shift Office is in the far corner. The simulator's parties finish in 35 rounds at the median and the cap catches about one game in eight. The Cleanup Crew is the pressure that grows; the cap is the wall at the end. (It was 40 rounds when the collapse was a ramp. A cliff needed 42, and locking the chests to a key pushed it to 44: every route change that slows the password hunt costs rounds here.)
- **All Hands.** The moment the boss door opens, every grub still in the queue leaves the stairs at once, the schedule doubles to a grub every round, and **one grub is already at the door** — put a tile on the corridor square outside the Sump, which is where the door guard's body usually is. The stairwell is right across the floor, so without that tile the Crew can never make this moment. With corpses around, they head for corpses. With none, they head for the boss room. Announcer: "Attention, Crawlers. Facilities has declared an All Hands. This is a standard cleanliness measure and not a reflection on your hygiene. Please enjoy the remainder of your visit."
- **The collapse** is the Floor 1 rule: at the end of round 48 the floor comes down and everyone still on it dies.
- **You can leave without killing the boss.** Same rule, same forfeit, say it out loud before the fight.

**Where the simulator stands** (3,000 runs of the current layout, the real party, rules as written above (Spark cleans small corpses only, squashed grubs go back to the queue, the Sump door shuts behind the party, healing in three pieces of furniture), a "blind" party that opens the nearest unexplored door until it holds a password, then heads for the Sump with a random appetite for one to four more rooms, and bleaches medium and large corpses on quiet turns while the goose eats the small ones and Spark gets the rest):

| Measure | Result |
|---|---|
| Party wins (boss dead, everyone down the stairs) | 85.5% |
| Escaped with the boss alive | 1.7% |
| Floor came down on somebody | 12% |
| Full wipe | 2.2% |
| Games where someone dies | 27% |
| Rounds to finish, median | 34 |
| Password found, median round | 20 |
| Sump door opens, average round | 28 |
| Rooms opened | 9 of 14 |
| Corpses made / cleaned / left at the end | 20 / 10 / 2.5 (the goose eats 4.7, Spark 2.0, bleach the rest) |
| Bleach found / used | 4.1 / 3.5, against 8.4 medium and 2.6 large corpses a game |
| Fed janitors per game | 5.9, in every game; the party kills 4.1 of them |
| Rounds with a janitor chasing someone | 10 |
| Facilities Managers (a large corpse eaten) | 1.5 a game, in 91% of games |
| The doorstep beat: the Sump guard's body eaten | 79% of games, median the same round the door opens |
| Boss snacks per game | 0.8, in 76% of games |

**What the recent changes were each worth.** Closing the Sump door: about two points of win rate and five points off "someone dies", because the boss fight stops being a three-way fight with the Crew. Healing in the furniture: about four points of win rate and three points off the wipe rate. Those two took the floor to 91% wins with the old ramp collapse, which was kinder than the 80-to-88 band the earlier drafts sat in. Making the collapse hard moved the failure mode from "the ramp chewed somebody up" to "somebody was still up here at zero": wipes fell to about 1% while the floor coming down on at least one hero rose to 11%. Locking the chests to a key then cost about five points, because a party that has spent its keys explores fewer rooms; the cap went to 44 to pay that back. Sending grubs after the largest corpse rather than the nearest cost another two points and changed what the Crew is made of: fewer Bloated Grubs, more Custodians and Facilities Managers, and a big body now drags the whole Crew across the floor. The doorstep bear and the All Hands door-grub then turned the Facilities Manager from a coin flip into the floor's signature beat: one appears in 91% of games, and the guard's own body is eaten in 79% — a median of zero rounds from the party getting the Sump door open, so the thing usually stands up as they file through and the door shuts on it. That cost about six points, paid back with four more rounds of cap. Deaths went from a fifth of games to a third in the process: that corridor fight lands with the party's bleach spent and the clock short. Each round of cap is worth roughly two points of win rate, which is the dial to move if 82% is the wrong number, and the doorstep bear is the dial for how mean the Sump approach feels.

The table's party never squashes grubs. A party played by the Jev brain in the map editor's Sim tab (sensible play, judged turn by turn) squashes them on the way past, which is what a real table will do. Under the old rule, where a squashed grub left the floor, that party saw two fed janitors a game instead of seven and was almost never chased. With squashed grubs going back to the queue it saw four or five, was chased for about eight rounds a game instead of three or four, and lost time to squashing the same grubs over and over: in six games it squashed eight grubs a game and won once, four games running out of clock. The furniture healing did not change that party's time spent hurt (a fifth of its turns, either way, in six games). Six games is a small sample, but beating back the tide now costs the party something.

The two rule changes together cost the table's party about four points of win rate (88% to 84%); that party almost never squashes, so nearly all of it is Spark losing medium and large corpses. Bleach is short on purpose: about four bottles a game against ten medium and large corpses, so the party can clean roughly half of the dangerous bodies at most.

The first draft of this floor had the Shift Office beside the forced path and a party that knew where it was. It looked fine on paper (85% win) and was wrong in the way that matters: a real table does not know which door the password is behind. The blind party on that layout still found it by round 9, because the room was right there; moved to the far corner it takes twenty rounds, which is the hunt this floor is about. One copy of the password in one corner then made the floor a lottery on which way the party wandered: one game in eight ran out of clock without ever finding it. Three places in three corners fixed that (collapses fell to one game in seventy) and made the floor too easy, so the Crew grew from six grubs to eight.

Without the Cleanup Crew the floor is a 95% walk, so the grubs are the whole difficulty. The dials, in order of effect: anything that lets Spark be cast more often (a mastered Spark at one round shorter cooldown was worth seven and a half points, which is why mastery adds a die instead); where the password copies are; fed janitor Health (about ten points); the grub budget (each grub is worth about two and a half points of win rate and a few deaths); the floor cap (about two points a round, mostly as collapses). The grub schedule barely matters once the budget is fixed. If the table wants it harder, take a grub away or a round off the cap; easier, the reverse.


---

## 2. Players

No new crawlers. Everyone comes down the stairs as they are, and the announcer reads the inventory back to them because two of them will have forgotten. The Save-the-Date still stands: class selection happens at the bottom of this floor, so Floor 2 is the last floor of "you, but with stuff", and it is built to let each of them show what they have become.

The three upgrades seeded on the floor, and who they are obviously for without saying so:

| Find | For | Where |
|---|---|---|
| **Goblin Shortbow** | The one with the slingshot | My Bad achievement (section 7) |
| **Pet Biscuit** | The one with the goose | Good Boy achievement (section 7) |
| **Scroll: Restructuring** (Mind 5) and later the **Wizard's Bathrobe** (Body, Mind +1) | The one with the glasses | Furniture, section 3. Scroll early, robe late, so the scroll sits unreadable for a while. |
| **Orc Chainmail Bib** | Whoever wants to be slow and safe | The Lockup's Evidence locker, behind a key |

---

## 3. Floor layout

The layout is in `sim/src/content/floor2.map.json` (drafted by the sim, reworked in the map editor, not yet played): entrance top-right, Reception then the Supply Closet forced by stone, the Sump on the left with the stairs against its west wall, and the Shift Office in the bottom-right corner, as far from the Supply Closet's exits as the board allows. Fourteen of the nineteen rooms are in play; the five between the columns are stone.

The Shift Office's position is the floor's main dial. With it next to the forced path (the first draft) a party that just opens the nearest door finds the password by round 9 and the floor plays in 28 rounds. In the far corner the password turns up around round 20, the party has opened most of the floor looking for it, and the game runs 36 rounds. Anywhere in between scales between those. What the layout has to do, in order of importance:

1. **The big chamber is the boss room.** The skeleton on its floor is what the boss ate. Its door is the password door.
2. **Required by walls: the first two rooms.** Same trick as Floor 1: the entrance corridor dead-ends into them. That guarantees corpses early, and the first grub has somewhere to walk.
3. **One bear near the front, one on the Sump's doorstep.** The Cave Bear in Records, eleven squares from the entrance, is there so a large corpse hits the floor while the Crew is still arriving. The second stands in the **corridor outside the Sump door**, two squares out: a guard with no room, which wakes when the party sees it, and whose body lands on the doorstep just as the party gets the door open. With the door-grub from All Hands (1.6) eating it, a Facilities Manager turns up in 88% of games, a median of one round before the Sump door opens — the party goes in with something very large arriving behind them, and the door shuts on it. It replaced one of the Sump's two kobold guards, so the boss room is one body lighter; the corridor fight and the loss of that kobold as boss food cost about six points of win rate, which the cap paid back by going from 44 rounds to 48.
4. **The Shift Lead's room is required by content, not by walls.** Put it far from the forced rooms, so the party has to hunt for it, and then carry the password back across the floor with a medium corpse behind them.
5. **The scroll before the robe.** Scroll: Restructuring on the Shift Lead's desk. The Wizard's Bathrobe on the Laundry shelf, near the Sump. Ethan should own an unreadable scroll for a while.
6. **Five bleach, two on the required path.** Reception's front desk and the Supply Closet's shelving, so the mechanic gets taught on the first corpse and there is a second bottle before the Shift Lead. The other three sit in optional rooms (Boiler Room, Records, Cafeteria). With only one on the path the party found 1.6 bottles a game and left twice as many bodies.
7. **Healing and a spare key in the furniture.** A Juice Box on the Dormitory bunk, a Scroll: Heal on the Locker Room bench, and the second Skeleton Key on the Tool Crib's tool rack. The party spends most of the floor hurt and Floor 2's decks only hold four Juice Boxes and a Bandage or two, so the side rooms need to be worth the detour. The key is what makes the second chest openable at all.
8. **Far more rooms than they can open.** Fourteen rooms in play and a 48-round cap means several stay shut. That is fine. The announcer should say so.
9. **Monsters at least two squares from their door**, like Floor 1. That rule was worth thirteen points of win rate.

**Room by room**, from the map file. "Holds" is the one card the furniture gives up when searched (section 1); the DM view on the iPad shows the same line.

| # | Room | Furniture | Holds | Monsters | Notes |
|---|---|---|---|---|---|
| 1 | **Reception** (required) | Front desk | Industrial Bleach | 2 Cave Rats | First corpses, first bottle. Teach the rule here. |
| 2 | **Supply Closet** (required) | Shelving | Industrial Bleach | Kobold Miner, Cave Rat | The floor opens from here. |
| 3 | Dormitory | Bunk | Juice Box | 3 Cave Rats | |
| 4 | Locker Room | Bench | Scroll: Heal | 2 Cave Rats | |
| 5 | Kennels | Feed trough | **Password of the Day** | 2 Cave Rats | Sticky note. |
| 6 | Tool Crib | Tool rack | Skeleton Key | Kobold Miner | The second key. |
| 7 | Boiler Room | Pipe rack | Industrial Bleach | 2 Kobold Miners | |
| 8 | Records | Filing cabinet (chest, key) | Industrial Bleach | Cave Bear, Cave Rat | Spear trap. The front bear: a large corpse early. |
| 9 | Laundry | Laundry shelf | Wizard's Bathrobe | Cave Bear, Cave Rat | Near the Sump. Ethan's Mind 5. |
| 10 | Cafeteria | Lunch table (2×2) | Industrial Bleach | 2 Kobold Miners, Cave Rat | |
| 11 | Incinerator | Ash shelf | **Password of the Day** | Kobold Miner | Sticky note. |
| 12 | Lockup | Evidence locker (chest, key) | Orc Chainmail Bib | Cave Bear | |
| 13 | **Shift Office** (the hunt) | Shift Lead's desk | Scroll: Restructuring | **The Shift Lead**, Kobold Miner | Far bottom-right. The Lead drops the third password. |
| 14 | **The Sump** (boss) | Sump pump (blocks), stairs on the west wall | nothing | The Senior Custodian, Kobold Miner | Password door. Shuts behind the party. |

Outside the rooms: a **Cave Bear** in the corridor two squares from the Sump door (the doorstep guard, item 3 above) and a **pit** in that same corridor, so a body Shoved into it is the cheapest clean on the floor. Seventeen doors, one of them the Sump's; no secret doors and no falling blocks this floor, so the Torch stays retired without cost.

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

The party is stronger than it was: a Fire Axe at 4 dice (5 with Sir Reginald riding along, once he has the biscuit), a caster with Spark and Shove on two-round cooldowns, Patch Up and Nope. Kobolds and bears sit where Orcs and the Abomination did; the extra Health on the bear is there so it leaves a large corpse more often than it dies to one swing. Real numbers come from the simulator.

### 4.2 The Senior Custodian

A grub that ate something with a very large skeleton, a long time ago. Too big for the door, which is why the door needs a password. Standee, the size of Greg's.

- **Snack** (free, at the start of its turn, when a corpse is in the boss room): eats it, heals 2, and still attacks. Every minion the party kills in this room becomes a meal unless somebody cleans it. Clean the corpses or Shove them out the door; either one is a turn not spent hitting the boss. (If Snack cost the boss its action it would be a gift to the party: the simulator says four points of win rate.)
- **Mop** (Cooldown 2): 2 attack dice at every hero adjacent to it. Used whenever it is off cooldown and two or more heroes are adjacent.
- **Understaffed:** while any fed janitor is on the floor, the boss defends with 4 dice instead of 3.
- On death: the killer opens the **Boss Box** and reads the Class Selection Available card aloud (section 11). No corpse. Obviously.

One Kobold Miner stands in the room with it (the second became the doorstep bear, section 3). Kill it and there is a medium corpse in the boss room, and whatever the party dragged in behind them. That is the fight.

### 4.3 Monster behavior additions

Floor 1 rules 4.3.1 to 4.3.6 stand. Added:

7. Grubs move only toward corpses, largest first, ignore heroes entirely, and stop when the board has no corpse they can reach.
8. Fed janitors move toward the nearest hero by open route, fixed 6 squares, and attack if adjacent. They leave rooms freely; they are already loose.
9. Monsters walk over corpses and never target grubs or janitors. Janitors never target monsters. Everyone on staff gets along.
10. The boss takes a Snack over any other action when a corpse is in its room.

---

## 5. Traps

Floor 1's three, same tokens. One addition: **a pit eats corpses.** A corpse Shoved into a pit, revealed or not, is gone, and the pit stays a pit.

---

## 6. Loot

Three shuffled decks again. What is physically in each one on the night, so the announcer can build them from the Floor 1 boxes plus the Floor 2 print run.

### 6.1 Pockets deck (14 cards)

Floor 1's Pockets deck with the cards the party is holding taken out: Vicki's Bandage, Lucas's Whistle and Sleep scroll, Ethan's Energy Drink. One card gets reprinted, the Bandage. Everything else was already printed for Floor 1.

| Card | Qty | Note |
|---|---|---|
| **Juice Box** | 4 | Floor 1 cards. The fifth goes in the Why Would You Drink That envelope. |
| **Energy Drink** | 2 | Floor 1 cards. Three were printed and Ethan is holding one. |
| **Gold (1)**, **Gold (2)**, **Gold (3)** | 1, 2, 1 | Floor 1 cards, whatever the envelopes leave. See below. |
| **Firecracker** | 1 | Floor 1 card |
| **Rope** | 1 | Floor 1 card |
| **Scroll: Heal** | 1 | Floor 1 card. A second one lies on the Locker Room bench. |
| **Bandage** | 1 | Reprint. Vicki still has the Floor 1 card. |

**The gold all came back.** Eleven gold cards were printed for Floor 1, twenty-nine gold between them, and the shop took twenty-one of it straight back into the box. No gold gets reprinted for this floor. Stuff the envelopes first, and no amount needs a card of its own: **Clean Freak**'s four gold is **Gold (2) ×2**, **Health Inspector**'s five is one **Gold (5)**, **Why Would You Drink That**'s three is one **Gold (3)**, and the **Boss Box**'s eight is **Gold (5) + Gold (3)**. The party kept a single coin, one Gold (1). What is left over is the gold in the deck: Gold (1), Gold (2) ×2, Gold (3), which is eight gold in four cards against Floor 1's seven in four. There is no Gold (5) left to draw, which is fine; the big coins are all prizes now.

Not shuffled, all set out in furniture (section 3): **Industrial Bleach** ×5 ("Obliterate a corpse on your square or adjacent to you. One use. Or drink it: lose 1 Health. Why would you."), plus one **Juice Box** on the Dormitory bunk, one **Scroll: Heal** on the Locker Room bench, and a second **Skeleton Key** on the Tool Crib's tool rack.

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
| **Spellbook: Mop-Up** | Learned | Mind 4+. Obliterate a corpse in line of sight. Cooldown 3. Frees Spark to be a weapon again. |
| **Spellbook: Static** | Learned | Mind 4+. 1 damage to every monster adjacent to you, no defence roll. Cooldown 3. |
| **Steel Lunchbox** | Trinket | Once per floor, heal 3. |
| **Wizard's Bathrobe** | Body | Mind +1. On the Laundry shelf. |
| **Scroll: Restructuring** | | Mind 5 to read. 4 attack dice at a monster in line of sight, and 1 damage to every monster adjacent to it. On the Shift Lead's desk. |
| **Orc Chainmail Bib** | Body | Defend +2, Move -2, no Sneakers. In the Lockup's Evidence locker. |
| **Goblin Shortbow** | Both hands | 2 dice at range, can't shoot adjacent, replaces your Attack. In the My Bad envelope. |
| **Leaf Blower** | Both hands | Action: Shove. Push a monster or a corpse in line of sight up to 3 squares away. Into a pit, it goes in. A monster into a wall or another monster takes 1. In the Trap Chef envelope. Shove for people who can't read. |

**Carried, not drawn:** the Password of the Day (Junk, one card, waiting at whichever of the three places they reach first) and the Pet Biscuit (Companion upgrade, in the Good Boy envelope). The biscuit lets Sir Reginald go apart from his person, so he gets a standee.

**Retired for good:** Orc Monocle, Trash Can Lid, Torch, Frying Pan, Broken Table Leg. Torch stays retired so the Bathrobe isn't competing with a Head item; the floor has no secret doors anyway.

---

## 7. Loot Boxes

Seven envelopes. Every trigger is something the announcer will see happen, so nothing needs tracking across the evening.

| Box | Tier | Trigger | Contents |
|---|---|---|---|
| **My Bad** | Gold | Awarded to Vicki at start of Floor 2 because the DM forgot to give her a Big Gear draw when she killed the Floor 1 boss | Goblin Shortbow |
| **Good Boy** | Companion | Sir Reginald eats a corpse | Pet Biscuit |
| **Clean Freak** | Silver | Obliterate three corpses | 4 gold, 1 Industrial Bleach |
| **Health Inspector** | Gold | Kill a fed janitor | 5 gold |
| **Why Would You Drink That** | Bronze | Drink the bleach | 3 gold, 1 Juice Box. It costs 1 Health to open. Someone will. |
| **Trap Chef** | Gold | A monster dies from a trap | Leaf Blower |
| **Boss Box** | Platinum | Kill the Senior Custodian | 8 gold and the **Class Selection Available** card (section 11) |

Gold for these comes out of the Floor 1 coins, in the denominations listed in 6.1. Nothing has to be reprinted.

Cut from the first draft: First Blood and Cartographer (Floor 1 did those), Password Accepted (opening the door is its own reward), Hoarder and Bookworm (nobody wants to count cards mid-fight).

**Pet Biscuit:** slide it under Sir Reginald. He has become a person. He is not happier about it. Health 3, and he still eats small corpses only.

- **Together** (the default; he rides on his person's standee, no square of his own): his person attacks with **+1 die**, one roll. When a monster's attack gets damage through to his person, they may shout **"Reginald!"** and the goose takes that damage instead. No roll, no limit, until he runs out of Health. This replaces the Floor 1 skull roll.
- **Apart** (his own standee, a square of his own, **Defend 1**): on his person's turn he moves up to 6 and attacks an adjacent monster with 2 dice. He blocks on white shields like a hero, one die. That is all he does. He cannot open doors, search furniture, pick anything up or hand cards over. Fed janitors hunt the nearest hero, and a lone goose in a corridor counts. He is bait if you want him to be.
- **Throw him:** his person's action, same wording as the Frying Pan. Pick a monster in line of sight: 2 attack dice, and Reginald lands on a square beside it. He is now apart, and that throw was his attack for the turn.
- **Rejoin:** either of them ends a move on the other's square. Free.
- **Downed** at 0 Health wherever he is, hero rules (section 1.1). Apart, that means somebody walks over to pick him up.

The point of the split is that Lucas's turn stays one roll on most turns. Apart is the expensive mode, and it costs him the +1 die and the Bodyguard while the goose is away.

**Why Defend 1 and not 2.** Together, Bodyguard hands the goose damage that has already got past his person's own Defend, so he never rolls a defence die at all. If Apart gave him a hero's two dice, sending him away would make him *safer*, which is backwards. At Defend 1 a Kobold Miner drops him in about two and a half swings and a Facilities Manager in under two, so a goose left alone in a corridor is a gamble, which is what Apart is for.

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

Thirty-six rounds at the median, forty-eight at the cap. Two evenings, maybe three. The queue and the cap do the cutting between them: a party that dawdles meets the Crew, and a party that wanders meets the cap.

---

## 10. What has to be generated

All in the card workshop under the **Floor 2** filter, so the print run is just the new things.

| Asset | Count |
|---|---|
| Monster cards: Cave Rat, Kobold Miner, Cave Bear, Shift Lead, Grub, Bloated Grub, Custodian, Facilities Manager, Senior Custodian | 9 |
| Standees, 9 designs, **20 pieces**: Cave Rat ×4, Kobold Miner ×2, Cave Bear ×2, Shift Lead, Bloated Grub ×3, Custodian ×4, Facilities Manager ×2, Senior Custodian, the Sump door | 20 |
| Pockets: Bleach ×5, healing in furniture ×2 (Juice Box, Scroll: Heal), one reprinted Bandage | 8 |
| Gear: eight new cards | 8 |
| Big Gear: ten cards, plus the Skeleton Key on the tool rack | 11 |
| Password of the Day, Pet Biscuit, Class Selection Available | 3 |
| Envelope labels | 7 |
| Furniture tiles, sized from the map, with used backs | 15 fronts, 13 backs |
| Corpse tiles: small ×8, medium ×6, large ×3. Grub tiles ×8 | 25 |
| Announcer speeches: intro, first grub, All Hands, collapse, stairs (in the map file, read from the iPad) | 5 |

**Why those counts.** One standee per monster is not enough: the simulator's worst moment in each of 3,000 games says the table needs four Cave Rats, two Kobolds, two Bears, three Bloated Grubs, four Custodians and two Facilities Managers at once. Each of those runs short in about one game in a thousand, and one fewer of any of them runs short far more often: three rats fails one game in fifty, one Kobold fails half the time, one Facilities Manager one game in five. Corpses peak higher than you would think because they are the whole mechanic: eight small, six medium and three large cover it. If the table ever does run out, a Floor 1 figure stands in.

---

## 11. Class selection

The Boss Box holds a single card, **Class Selection Available**, which promises the choice without making it: the classes themselves are designed after this floor is played, on what each of them actually did. The floor is built so each arrives at the bottom having demonstrated a direction: ranged kills, a tank with a companion, a caster who read a Mind 5 scroll. The class cards, when they exist, should name what they already did.

---

## 12. What the simulator has to add

Behind a `floor2` config so Floor 1 numbers stay intact.

- A second map file and board (Side B).
- Corpse state per dead monster: position, size. Walkable. Shove moves it; pits delete it.
- The obliterate action: Bleach charges, Spark-as-clean on cooldown, Reginald on small corpses.
- Grubs: queue die, schedule, a budget of eight for the floor, fixed move 4 toward the largest corpse, eat on arrival, flip to the fed form by corpse size. Squashed grubs go back to the queue.
- Fed janitors: fixed move 6 toward nearest hero by open route, no loot, no corpse.
- All Hands on boss door open; the password gate on the boss door; Shift Lead guaranteed drop.
- The boss's Snack and Understaffed rules.
- Reginald's Downed state. The Pet Biscuit in its together mode only: +1 die, and the brain always shouts "Reginald!" while he is up. Apart and the throw are not simulated, so real play runs a little easier whenever Lucas splits them.
- Two hero policies, not one: a **cleaner** (bleach the nearest medium or large corpse when no grub is within eight squares and nobody is in combat) and a **runner** (never clean, keep moving). Tune the schedule and the bleach count until both land near 80% with different failure stories.
- Report: win rate, deaths, corpses cleaned, janitors fed by size, rounds the party spent within reach of a fed janitor, and how often the boss got a Snack.

**Answered by the first runs:** the sim's party must not know where the password is (the "blind" brain opens the nearest unexplored door), and that single fact decides the floor's length. With a far Shift Office the grub cap had to become a budget or the Crew never stops. A running party does not escape fed janitors at move 6 (it loses more people, not fewer), and move 7 costs three more points. Snack matters only if it is free; as the boss's action it helped the party. The Sump's Kobold and the bodies the party brings in produce about one snack a game.

**Still open:** the layout has not been played, the placeholder Big Gear cards are stand-ins, and the sim's cleaner never Shoves a corpse into the pit or out of the boss room, so those tricks are unmeasured upside for the real table.
