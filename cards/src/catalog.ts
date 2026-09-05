// The card catalog: every printable thing on Floor 1, as data.
// The sim (../sim/src/content) owns the *mechanics*; this file owns what's
// printed. `bun run check` diffs the two by name so they can't drift.

export type Deck =
  | "kit"        // Starting Kit cards, one per player
  | "pockets"    // Pockets deck
  | "gear"       // Gear deck
  | "biggear"    // Big Gear deck
  | "fan"        // Fan deck (Viewers)
  | "monster"    // Monster cards, for the announcer
  | "player"     // Crawler cards: pick a human, name yourself
  | "lootbox"    // Cards that live only inside an envelope
  | "envelope"   // The envelope labels themselves (label size, not card size)
  | "tile"       // Floor tiles: furniture and traps, integer inches, top-down art
  | "standee";   // Stand-up figures for the plastic stands: the nine crawlers and the boss

export type CardType =
  | "item" | "consumable" | "scroll" | "spell" | "companion" | "text"
  | "monster" | "player" | "fan" | "envelope" | "tile" | "standee";

export type Stats = { att: number; def: number; hp: number; mind: number; move: string };

export type Card = {
  id: string;
  name: string;
  deck: Deck;
  type: CardType;
  /** Equipment slot, for items. */
  slot?: string;
  /** Rules text. Keep it short; it has to fit on a poker card at 7.5pt. */
  rules: string;
  flavor?: string;
  /** Spells and scrolls. */
  mind?: number;
  cooldown?: number;
  /** Copies in the deck. Default 1. */
  qty?: number;
  /** Monsters and players. */
  stats?: Stats;
  loot?: string[];
  special?: string[];
  /** Envelopes. */
  tier?: "Bronze" | "Silver" | "Gold" | "Platinum" | "Companion";
  trigger?: string;
  contents?: string;
  /** Tiles: footprint in board squares (1 square = 1 inch). Standees: printed size in inches, tab included. */
  tile?: { w: number; h: number; kind: "furniture" | "trap" | "standee" };
  /** Subject description for the art generator. The style prefix lives in style.md. */
  art: string;
  /** Id of a card whose current art is sent along as a second reference image: "this exact character". */
  ref?: string;
  /** Name of the matching entry in the sim, when it differs. */
  simName?: string;
};

export const DECK_NAMES: Record<Deck, string> = {
  kit: "Starting Kit", pockets: "Pockets", gear: "Gear", biggear: "Big Gear", fan: "Fan Deck",
  monster: "Monster", player: "Crawler", lootbox: "Loot Box", envelope: "Loot Box Label", tile: "Floor Tile", standee: "Standee",
};

const HUMAN: Stats = { att: 2, def: 2, hp: 6, mind: 3, move: "2d6" };

const kits: Card[] = [
  { id: "slingshot", name: "Slingshot", deck: "kit", type: "item", slot: "Main hand",
    rules: "Instead of your normal attack, roll 1 attack die at any monster in line of sight that isn't adjacent. You can still punch things next to you with your usual 2.",
    flavor: "Whoever takes this is volunteering to stand behind someone.",
    art: "a wooden Y-shaped slingshot with a red rubber band and a small pile of pebbles, held up ready to fire" },
  { id: "hockey-stick", name: "Hockey Stick", deck: "kit", type: "item", slot: "Main hand",
    rules: "Attack +1. The first time you roll zero skulls with it, it snaps. Discard it.",
    flavor: "Whoever takes this is volunteering to be in front.",
    art: "a battered street hockey stick with tape wrapped around the blade, held like a weapon" },
  { id: "multitool", name: "Multitool", deck: "kit", type: "item", slot: "Trinket",
    rules: "Disarm an adjacent revealed trap as your action. Two uses. Tick the boxes. ☐ ☐",
    art: "a red folding multitool with pliers, tiny screwdriver and knife all fanned open" },
  { id: "snack-bag", name: "Snack Bag", deck: "kit", type: "item", slot: "Backpack",
    rules: "Two Juice Boxes. Each heals 3, one use. Take two Juice Box cards from the Pockets deck.",
    art: "a crumpled brown paper lunch bag overflowing with juice boxes and snacks" },
  { id: "homework-glasses", name: "Homework Glasses", deck: "kit", type: "item", slot: "Head",
    rules: "Mind +1. You can read Spellbooks from turn one.",
    flavor: "Whoever takes these is volunteering to be the nerd.",
    art: "a pair of thick black-rimmed glasses with tape on the bridge, lenses glinting" },
];

const juice = (n: number): Card => ({ id: `juice-box-${n}`, name: "Juice Box", deck: "pockets", type: "consumable",
  rules: "Heal 3. One use.", flavor: "Fruit punch. Probably.", qty: 1,
  art: "a dented cardboard juice box with a bendy straw, cartoon fruit on the label" });
const energy = (n: number): Card => ({ id: `energy-drink-${n}`, name: "Energy Drink", deck: "pockets", type: "consumable",
  rules: "+1 attack die on your next attack this turn. One use.", flavor: "DO NOT GIVE TO CHILDREN.",
  art: "a tall neon green energy drink can crackling with little lightning bolts" });
const gold = (n: number, v: number): Card => ({ id: `gold-${n}`, name: `Gold (${v})`, deck: "pockets", type: "consumable",
  rules: `${v} gold. Spend it at the Stairwell Shop between floors.`, flavor: v === 3 ? "A goblin was saving up." : "Slightly sticky.",
  art: v === 1 ? "a single dull gold coin with a goblin face stamped on it" : v === 2 ? "two gold coins, one bitten" : "a small handful of gold coins spilling out of a torn pocket" });

const pockets: Card[] = [
  juice(1), juice(2), juice(3), juice(4), energy(1), energy(2), gold(1, 1), gold(2, 1), gold(3, 2), gold(4, 3),
  { id: "firecracker", name: "Firecracker", deck: "pockets", type: "consumable",
    rules: "1 attack die against every adjacent monster. One use.", flavor: "Illegal in this dungeon. Everything is.",
    art: "a red paper firecracker with a lit fuse throwing sparks" },
  { id: "bandage", name: "Bandage", deck: "pockets", type: "consumable",
    rules: "Heal 1, or get an adjacent Downed player up without spending your action. One use.",
    art: "a roll of white gauze bandage with a cartoon band-aid stuck to it" },
  { id: "rope", name: "Rope", deck: "pockets", type: "item", slot: "Trinket",
    rules: "Pits are free for you. Pull an adjacent player out of a pit as a free action.",
    art: "a coil of thick hemp rope with a frayed end" },
  { id: "whistle", name: "Whistle of Doubtful Value", deck: "pockets", type: "item", slot: "Trinket",
    rules: "Action: every monster in an adjacent room with an open door comes to you.",
    flavor: "Pulls one Orc out of the boss room at a time if you're clever. Everything at once if you're not.",
    art: "a tarnished brass referee whistle on a frayed lanyard, a few tiny question marks floating off it" },
  { id: "scroll-sleep", name: "Scroll: Sleep", deck: "pockets", type: "scroll",
    rules: "One monster in line of sight skips its next 2 activations. Not Skeletons or Zombies.", flavor: "Anyone can read it. Once.",
    art: "an unrolled parchment scroll glowing soft blue with a sleeping crescent moon and Z's drawn on it" },
  { id: "scroll-heal", name: "Scroll: Heal", deck: "pockets", type: "scroll",
    rules: "Heal 4 to you or an adjacent player.", flavor: "Anyone can read it. Once.",
    art: "an unrolled parchment scroll glowing warm gold with a heart and a plus sign drawn on it" },
];

const gear: Card[] = [
  { id: "table-leg", name: "Broken Table Leg", deck: "gear", type: "item", slot: "Main hand",
    rules: "Attack +1.", flavor: "It's a club. Don't overthink it.",
    art: "a splintered wooden table leg with a few bent nails sticking out, held like a club" },
  { id: "kitchen-knife", name: "Kitchen Knife", deck: "gear", type: "item", slot: "Main hand",
    rules: "Attack +1 against monsters with 1 Health. When you kill something with it, move 2 extra squares.", flavor: "Sneaky.",
    art: "a large kitchen chef's knife with a chipped blade and a worn black handle" },
  { id: "trash-lid", name: "Trash Can Lid", deck: "gear", type: "item", slot: "Off hand",
    rules: "Defend +1.", flavor: "Smells like a shield.",
    art: "a dented galvanized metal trash can lid held up like a shield, a banana peel stuck to it" },
  { id: "frying-pan", name: "Frying Pan", deck: "gear", type: "item", slot: "Off hand",
    rules: "Defend +1. Action: throw it at a monster in line of sight for 2 attack dice. Then it's on the floor over there.",
    art: "a heavy black cast iron frying pan, slightly scorched" },
  { id: "leather-jacket", name: "Goblin-Chewed Leather Jacket", deck: "gear", type: "item", slot: "Body",
    rules: "Defend +1.", flavor: "The goblin is fine.",
    art: "a brown leather biker jacket with chewed cuffs and little bite marks along the collar" },
  { id: "orc-monocle", name: "Orc Monocle", deck: "gear", type: "item", slot: "Head",
    rules: "Mind +1. Same slot as the Glasses: the second road to Mind 4, not a stack.", flavor: "The orc did not need it.",
    art: "a large brass monocle on a chain, comically oversized, one lens cracked" },
  { id: "sneakers", name: "Stolen Sneakers", deck: "gear", type: "item", slot: "Feet",
    rules: "Move +2.", flavor: "Stolen from whom is not your problem.",
    art: "a pair of bright red high-top sneakers with mismatched laces, one glowing slightly" },
  { id: "rabbits-foot", name: "Lucky Rabbit's Foot", deck: "gear", type: "item", slot: "Trinket",
    rules: "Once per floor, reroll one die.", flavor: "The rabbit would like it back.",
    art: "a fluffy white rabbit's foot charm on a keychain with a tiny four-leaf clover" },
  { id: "trap-kit", name: "Trap Kit", deck: "gear", type: "item", slot: "Trinket",
    rules: "Disarm an adjacent revealed trap as your action. Three uses. ☐ ☐ ☐",
    art: "a small open tin of trap-disarming tools: wire cutters, a screwdriver, duct tape and a lockpick" },
  { id: "torch", name: "Torch", deck: "gear", type: "item", slot: "Off hand",
    rules: "Reveal every trap in a room the moment you enter it. Reveal secret doors you walk past.",
    art: "a wooden torch with a bright orange flame casting warm light" },
  { id: "ear-necklace", name: "Goblin Ear Necklace", deck: "gear", type: "item", slot: "Trinket",
    rules: "Goblins won't attack you if there's any other hero they can reach.", flavor: "Word gets around.",
    art: "a leather cord necklace strung with several green pointy goblin ears" },
  { id: "scroll-firebolt", name: "Scroll: Firebolt", deck: "gear", type: "scroll",
    rules: "3 attack dice at any monster in line of sight.", flavor: "Anyone can read it. Once.",
    art: "an unrolled parchment scroll with a fiery orange bolt of flame drawn on it, edges smoldering" },
  { id: "scroll-stone-skin", name: "Scroll: Stone Skin", deck: "gear", type: "scroll",
    rules: "Defend +2 until the start of your next turn.", flavor: "Anyone can read it. Once.",
    art: "an unrolled parchment scroll with a grey stone fist drawn on it, small pebbles floating around" },
  { id: "scroll-smoke-bomb", name: "Scroll: Smoke Bomb", deck: "gear", type: "scroll",
    rules: "No monster can attack anyone this round.", flavor: "Anyone can read it. Once.",
    art: "an unrolled parchment scroll with a puffy grey smoke cloud drawn on it, wisps curling off the page" },
];

const biggear: Card[] = [
  { id: "fire-axe", name: "Fire Axe", deck: "biggear", type: "item", slot: "Both hands",
    rules: "Attack +2. Opens any locked chest or door as your action. No off hand.", flavor: "IN CASE OF GOBLIN BREAK GLASS.",
    art: "a big red fire axe with a gleaming steel blade and a black rubber grip" },
  { id: "shortbow", name: "Goblin Shortbow", deck: "biggear", type: "item", slot: "Both hands",
    rules: "Attack 2 dice at any monster in line of sight. Can't be used on an adjacent monster. Replaces your Attack instead of adding to it.",
    art: "a crude short wooden bow with a quiver of mismatched arrows, goblin teeth marks on the grip" },
  { id: "chainmail-bib", name: "Orc Chainmail Bib", deck: "biggear", type: "item", slot: "Body",
    rules: "Defend +2. Subtract 2 from your movement roll. Can't wear Sneakers with it.", flavor: "They don't fit under.",
    art: "a heavy iron chainmail bib shaped like a giant baby's bib, with a crude smiley face painted on it" },
  { id: "football-helmet", name: "Football Helmet", deck: "biggear", type: "item", slot: "Head",
    rules: "The first time each floor a trap would damage you, it doesn't.",
    art: "a scuffed blue football helmet with a face cage and a cracked team sticker" },
  { id: "skeleton-key", name: "Skeleton Key", deck: "biggear", type: "item", slot: "Trinket",
    rules: "Opens one locked chest or door. Then it crumbles.",
    art: "an ornate iron key with a tiny skull for a bow, bits crumbling off it" },
  { id: "spark", name: "Spellbook: Spark", deck: "biggear", type: "spell", mind: 4, cooldown: 2,
    rules: "2 attack dice at a monster in line of sight.",
    art: "a small leather spellbook, open, with a crackling blue-white spark of lightning leaping off the page" },
  { id: "shove", name: "Spellbook: Shove", deck: "biggear", type: "spell", mind: 4, cooldown: 2,
    rules: "Push a monster in line of sight up to 3 squares directly away from you. Into a trap: it triggers. Into a wall or another monster: 1 damage.",
    art: "a small leather spellbook, open, with a big glowing green cartoon hand bursting out of it palm-first" },
  { id: "patch-up", name: "Spellbook: Patch Up", deck: "biggear", type: "spell", mind: 4, cooldown: 3,
    rules: "Heal 2 to you or an adjacent player.",
    art: "a small leather spellbook, open, with golden sparkles and a band-aid drawn on the glowing page" },
  { id: "sponsored-cape", name: "Sponsored Cape", deck: "biggear", type: "item", slot: "Trinket",
    rules: "Once per floor, when you would die, you're Downed with 1 Health instead.", flavor: "The logo is enormous.",
    art: "a bright red superhero cape with an enormous garish corporate logo of a smiling soda can printed on it" },
];

const lootbox: Card[] = [
  { id: "bookmark", name: "Bookmark", deck: "lootbox", type: "item", slot: "Trinket",
    rules: "Once per floor, set one of your cooldown dice to 0. Tick the box. ☐",
    flavor: "For the caster who just proved they're the caster.",
    art: "a worn leather bookmark with a frayed gold tassel, glowing faintly, lying across an open spellbook" },
  { id: "nope", name: "Spellbook: Nope", deck: "lootbox", type: "spell", mind: 4, cooldown: 3,
    rules: "After a monster rolls an attack against anyone in your room, cancel it.", flavor: "The announcer sighs.",
    art: "a small black leather spellbook, open, with a single glowing red stop-sign hand hovering above the page" },
  { id: "sir-reginald", name: "Sir Reginald", deck: "lootbox", type: "companion",
    rules: "Companion. Moves with the player who freed him, occupies no square. Once per turn, 1 attack die at a monster adjacent to his person. When a monster attacks his person, roll 1 die: on a skull it attacks the goose instead. Health 2. He does not come back.",
    flavor: "An ill-tempered goose.",
    art: "a furious white goose with an orange beak, wings half spread, wearing a tiny crooked knight's helmet" },
  { id: "you-did-that", name: "You did that.", deck: "lootbox", type: "text", slot: "Trinket",
    rules: "We all saw.", flavor: "No effect.",
    art: "three tiny empty goblin-sized chairs in a dark room, a single spotlight, nothing else" },
  { id: "save-the-date", name: "Save the Date", deck: "lootbox", type: "text",
    rules: "Congratulations on surviving Floor 1. Class selection is available at the bottom of Floor 2. This offer is non-transferable and the company is not responsible for what you choose.",
    art: "a fancy gold-embossed invitation card with a wax seal shaped like a dungeon stairwell" },
];

const fan: Card[] = [
  { id: "boo", name: "Boo!", deck: "fan", type: "fan",
    rules: "One monster must spend its movement moving away from the nearest hero. It can still attack if it ends adjacent to someone.",
    art: "a shadowy crowd of audience silhouettes with cupped hands shouting, a big speech bubble shape" },
  { id: "applause", name: "Applause", deck: "fan", type: "fan",
    rules: "One hero rerolls one die. Play after the roll.",
    art: "many pairs of clapping cartoon hands rising out of darkness with little motion lines" },
  { id: "dramatic-music", name: "Dramatic Music", deck: "fan", type: "fan",
    rules: "One hero rolls +1 die on their attack this round. Play before the roll.",
    art: "a skeleton orchestra conductor mid-swing with glowing musical notes swirling around" },
  { id: "wardrobe-malfunction", name: "Wardrobe Malfunction", deck: "fan", type: "fan",
    rules: "One monster's pants fall down. Defend -1 this round.",
    art: "a pair of baggy orc trousers dropped around a pair of green ankles, polka-dot underwear visible" },
  { id: "lighting-cue", name: "Lighting Cue", deck: "fan", type: "fan",
    rules: "Reveal every trap in one room or corridor. Place tokens.",
    art: "a big theatre spotlight beam sweeping across a dungeon floor, revealing a pit and a spear trap" },
  { id: "fog-machine", name: "Fog Machine", deck: "fan", type: "fan",
    rules: "No ranged attacks or spells this round, by anyone. Yes, including Performance Review. Yes, including Spark.",
    art: "a chunky stage fog machine pumping out thick clouds of purple fog" },
  { id: "hype-train", name: "Hype Train", deck: "fan", type: "fan",
    rules: "Every hero gets Move +2 this round.",
    art: "a tiny cartoon steam train made of glowing energy racing across a dungeon floor, trailing sparkles" },
  { id: "heckle", name: "Heckle", deck: "fan", type: "fan",
    rules: "A monster about to attack instead attacks a different hero of your choice that it could reach.", flavor: "Usable for good or evil.",
    art: "a single shadowy audience member standing up pointing dramatically, everyone else seated" },
  { id: "slow-clap", name: "Slow Clap", deck: "fan", type: "fan",
    rules: "One monster skips its movement this round. It can still attack if already adjacent.",
    art: "one pair of large hands clapping very slowly with a sarcastic little motion line, dim spotlight" },
  { id: "loose-floorboard", name: "Loose Floorboard", deck: "fan", type: "fan",
    rules: "Move one revealed trap token one square in any direction. If it lands under a figure, it triggers.",
    art: "a wooden floorboard popping up out of a dungeon floor with a little cloud of dust" },
  { id: "poke", name: "Poke", deck: "fan", type: "fan",
    rules: "1 attack die at any monster on the board, from the sky. It defends normally.", flavor: "Nobody knows where it came from.",
    art: "a giant finger descending from dark clouds toward a tiny startled goblin" },
  { id: "fan-mail", name: "Fan Mail", deck: "fan", type: "fan",
    rules: "Name an achievement nobody has earned. If a living hero earns it this round, you open the envelope and read it aloud.", flavor: "No mechanical effect. Enormous emotional effect.",
    art: "a heart-stamped envelope bursting with glitter and tiny hearts" },
  { id: "sponsor-message", name: "Sponsor Message", deck: "fan", type: "fan",
    rules: "The announcer must deliver a fifteen-second advertisement for a product of your choice. A hero of your choice heals 1 while everyone endures it.",
    art: "a cheesy glowing billboard in a dungeon with a giant grinning soda can mascot on it" },
  { id: "confetti", name: "Confetti", deck: "fan", type: "fan",
    rules: "Nothing happens. The announcer must say something sincerely nice about a hero of your choice.", flavor: "Best played at the worst possible moment.",
    art: "a burst of colorful confetti and streamers exploding from a party popper in a gloomy dungeon" },
];

const monsters: Card[] = [
  { id: "goblin", name: "Goblin", deck: "monster", type: "monster",
    stats: { att: 2, def: 1, hp: 1, mind: 1, move: "10" },
    loot: ["1–3  Nothing", "4–6  Draw Pockets"],
    rules: "", flavor: "Unpaid intern. Has pockets. Full of stuff that isn't his.",
    art: "a small green goblin with huge ears and a wicked grin, holding a rusty dagger and a wooden shield" },
  { id: "orc", name: "Orc", deck: "monster", type: "monster",
    stats: { att: 3, def: 2, hp: 1, mind: 2, move: "8" },
    loot: ["1–2  Nothing", "3–4  Draw Pockets", "5–6  Draw Gear"],
    rules: "", flavor: "Middle management. Hits hard, dies to a table leg.",
    art: "a bulky grey-green orc wearing a too-small necktie over crude armor, holding a cleaver and a clipboard" },
  { id: "skeleton", name: "Skeleton", deck: "monster", type: "monster",
    stats: { att: 2, def: 2, hp: 1, mind: 0, move: "6" },
    loot: ["1–4  Nothing", "5  Draw Pockets", "6  Draw Gear"],
    rules: "Immune to Sleep.", flavor: "No pockets. No brain. Occasionally a coin falls out.",
    art: "a rattling skeleton warrior with a rusty sword and a single gold coin falling out of its ribcage" },
  { id: "zombie", name: "Zombie", deck: "monster", type: "monster",
    stats: { att: 2, def: 3, hp: 1, mind: 0, move: "5" },
    loot: ["1–3  Nothing", "4  Draw Pockets", "5–6  Draw Gear"],
    rules: "Immune to Sleep.", flavor: "Was somebody once. Still wearing their stuff.",
    art: "a shambling green zombie in a torn office shirt and a lanyard, one shoe missing, reaching forward" },
  { id: "abomination", name: "Abomination", deck: "monster", type: "monster",
    stats: { att: 3, def: 3, hp: 2, mind: 3, move: "6" },
    loot: ["1–3  Draw Gear", "4–6  Draw Big Gear"],
    rules: "", flavor: "Big. Sad. Guards a goose for reasons it will not explain.",
    art: "a huge hunched purple monster with one big sad eye and a tiny goose feather stuck to its claw" },
  { id: "floor-manager", name: "The Floor Manager", deck: "monster", type: "monster",
    stats: { att: 3, def: 3, hp: 4, mind: 4, move: "6" },
    loot: ["Boss Box + Draw Big Gear"],
    special: [
      "Performance Review (Cooldown 2): 2 attack dice at any hero in line of sight. Targets whoever carries the most equipment.",
      "Delegation: while either Orc is alive, defends with 4 dice instead of 3.",
    ],
    rules: "", flavor: "A troll named Greg.",
    art: "a huge lumpy grey-green cave troll in a too-tight short-sleeved dress shirt with a clip-on tie and a lanyard, a name badge reading GREG, reading glasses, seated behind a desk with a nameplate and a coffee mug, smug" },
];

// Nine humans. Nobody is anybody; players pick one and write their own name on it.
// Each gets a portrait card and a stand-up figure, from the same description.
const HUMANS: { desc: string; flavor: string }[] = [
  { desc: "a skinny teenage boy with messy brown hair in an oversized grey hoodie and basketball shorts, holding a flashlight",
    flavor: "Was outside at 3 a.m. looking for the cat. The cat was inside. The cat is fine." },
  { desc: "a teenage boy with dark skin, round glasses and a dinosaur graphic tee, backpack straps on both shoulders, determined",
    flavor: "Camped on the sidewalk for a video game launch. The store is gone. The game, tragically, is not out." },
  { desc: "a tall woman with a blonde ponytail in a running jacket and leggings, clutching a coffee mug",
    flavor: "Runs at 2:45 every morning. Has never been late for anything. Was not late for this." },
  { desc: "a bearded dad with a belly in a flannel shirt, cargo shorts, socks and sandals, holding a TV remote",
    flavor: "Stepped out to see what the noise was. Brought the remote in case it was the TV." },
  { desc: "a young girl with black braids in a green dinosaur pajama onesie, brandishing a stuffed rabbit like a weapon",
    flavor: "Sleepwalks. Woke up in a dungeon holding Mr. Buttons. Mr. Buttons has seen things." },
  { desc: "a small elderly grandmother with white curly hair, a lavender cardigan and a big handbag, deeply unimpressed",
    flavor: "Was walking to the 24-hour pharmacy. Has been through worse. Will tell you about it." },
  { desc: "a muscular young man with brown skin in a tank top and gym shorts, a towel around his neck, confused",
    flavor: "Leaving the 24-hour gym. Has never skipped leg day. Is about to find out what legs are for." },
  { desc: "a pale goth teenage girl with short black hair, all black clothes, big headphones around her neck, bored",
    flavor: "Sat on the roof listening to music. Watched the whole thing happen. Rated it a six." },
  { desc: "a lanky middle-aged man with a mustache in a red pizza delivery polo shirt and visor cap, holding an insulated pizza delivery bag",
    flavor: "Was delivering a large pepperoni to 14 Elm Street. Elm Street is gone. The pizza is still warm, and he still expects a tip." },
];
const humanArt = (desc: string) => `waist-up portrait of ${desc}, ordinary modern everyday clothes, standing in a dark stone dungeon looking slightly alarmed but game for it, no weapons`;
const players: Card[] = HUMANS.map((h, i) => ({
  id: `human-${i + 1}`, name: "", deck: "player", type: "player", stats: HUMAN, rules: "", flavor: h.flavor, art: humanArt(h.desc),
}));

/** Stand-up figures for the plastic card stands. Sizes in inches; the height includes STANDEE_TAB at the bottom that the stand grips. */
export const STANDEE_TAB = 0.3;
const standee = (id: string, name: string, w: number, h: number, art: string, ref?: string): Card =>
  ({ id: `standee-${id}`, name, deck: "standee", type: "standee", tile: { w, h: h + STANDEE_TAB, kind: "standee" }, rules: "", art, ref });
const standeeArt = (desc: string) => `full-body figure of ${desc}, ordinary modern everyday clothes, standing facing the viewer, whole body visible from head to shoes, no weapons`;
const standees: Card[] = [
  ...HUMANS.map((h, i) => standee(`human-${i + 1}`, `Crawler ${i + 1}`, 0.75, 1.5, standeeArt(h.desc), `human-${i + 1}`)),
  standee("greg", "Greg", 1.5, 2.25, "a huge lumpy grey-green cave troll in a too-tight short-sleeved dress shirt with a clip-on tie and a lanyard, a name badge reading GREG, reading glasses, standing upright facing the viewer, holding a coffee mug in one hand and a rolled-up stack of paperwork in the other, whole body visible", "floor-manager"),
];

const env = (id: string, name: string, tier: Card["tier"], trigger: string, contents: string): Card =>
  ({ id: `env-${id}`, name, deck: "envelope", type: "envelope", tier, trigger, contents, rules: "", art: "" });
const envelopes: Card[] = [
  env("first-blood", "First Blood", "Bronze", "First monster killed on the floor", "3 gold, 1 Juice Box"),
  env("face", "Found It With Your Face", "Silver", "First player to trigger a trap", "Football Helmet"),
  env("you-monster", "You Monster", "Bronze", "Kill all three goblins in the Daycare", "2 gold, You did that."),
  env("toilet", "Why Would You Do That", "Bronze", "Reach into the toilet", "1 Energy Drink, Gold (2)"),
  env("nerd", "Nerd", "Gold", "First player to learn a Spellbook", "Scroll: Firebolt, Bookmark"),
  env("sharing", "Sharing Is Caring", "Bronze", "Give an item to another player", "2 gold"),
  env("trap-chef", "Trap Chef", "Gold", "A monster dies from a trap", "Fire Axe"),
  env("cartographer", "Cartographer", "Silver", "Open the doors to seven of the nine rooms", "5 gold"),
  env("reginald", "Sir Reginald", "Companion", "Open the cage in Room 6", "Sir Reginald"),
  env("backseat", "Backseat Driver", "Bronze", "A Viewer's card causes a monster's death", "3 gold for the Viewer, on Floor 2"),
  env("boss", "Boss Box", "Platinum", "Kill the Floor Manager", "Spellbook: Nope, 5 gold, Save the Date"),
];

// Floor tiles. Sizes are a proposal; the map file is the source of truth once they agree.
const tile = (id: string, name: string, w: number, h: number, kind: "furniture" | "trap", art: string, qty = 1): Card =>
  ({ id: `tile-${id}`, name, deck: "tile", type: "tile", tile: { w, h, kind }, qty, rules: "", art });
const tiles: Card[] = [
  tile("stairs", "Stairs Down", 2, 2, "furniture", "a wide stone staircase descending into darkness, worn steps, a faint glow from below"),
  tile("desk", "Manager's Desk", 2, 1, "furniture", "a big dark wooden office desk with a nameplate, coffee mug, stapler and a stack of paperwork"),
  tile("table", "Break Room Table", 2, 1, "furniture", "a scratched wooden table with a half-eaten sandwich, a juice box and scattered crumbs"),
  tile("chest", "Locked Chest", 1, 1, "furniture", "an iron-banded wooden treasure chest with a heavy padlock"),
  tile("rack", "Weapon Rack", 2, 2, "furniture", "a low wooden weapon stand lying on the floor, seen from directly above, with mismatched weapons laid flat across it: a fire axe, a shortbow, a frying pan, a table leg and an open spellbook"),
  tile("toilet", "Latrine", 1, 1, "furniture", "a grimy dungeon toilet with a cracked wooden seat and a suspicious green glow inside"),
  tile("shelf", "Bookshelf", 2, 1, "furniture", "a tall wooden bookshelf crammed with old leather spellbooks and scrolls, one book glowing faintly blue"),
  tile("cage", "The Cage", 2, 2, "furniture", "a large rusted iron cage with an angry white goose inside, feathers on the floor around it"),
  tile("chairs", "Tiny Chairs", 2, 1, "furniture", "a cluster of tiny wooden chairs and a small round table with crayons and a half-finished drawing of a goblin"),
  tile("sign", "Welcome Sign", 1, 1, "furniture", "a cheerful corporate welcome sign on a metal stand, blank face, with a small bronze bell beside it"),
  tile("pit", "Pit Trap", 1, 1, "trap", "a square hole in a stone dungeon floor, a dark pit with a few broken planks around the edge", 3),
  tile("spear", "Spear Trap", 1, 1, "trap", "a stone floor square with several sharp iron spikes thrust up through cracked flagstones"),
  tile("block", "Falling Block", 1, 1, "trap", "a heap of massive broken stone rubble and dust filling a square of dungeon floor"),
  tile("secret", "Secret Door", 1, 1, "trap", "a stone floor square with a thin hidden crack outlining a doorway and a small iron ring pull"),
];

export const CARDS: Card[] = [...kits, ...pockets, ...gear, ...biggear, ...lootbox, ...fan, ...monsters, ...players, ...envelopes, ...tiles, ...standees];

export const DECK_ORDER: Deck[] = ["player", "kit", "pockets", "gear", "biggear", "lootbox", "fan", "monster", "envelope", "tile", "standee"];

const byId = new Map(CARDS.map(c => [c.id, c]));
export const card = (id: string) => byId.get(id);

// ---- prompt overrides, edited from the UI, kept next to the art ----
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export const ROOT = join(import.meta.dir, "..");
const OVERRIDES = join(ROOT, "overrides.json");
type Overrides = Record<string, { art?: string }>;
export function loadOverrides(): Overrides {
  return existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, "utf8")) : {};
}
export function saveOverride(id: string, patch: { art?: string }) {
  const o = loadOverrides();
  o[id] = { ...o[id], ...patch };
  if (o[id].art !== undefined && o[id].art.trim() === "") delete o[id].art;
  if (Object.keys(o[id]).length === 0) delete o[id];
  writeFileSync(OVERRIDES, JSON.stringify(o, null, 2) + "\n");
}
/** The catalog with any edited prompts applied. */
export function cards(): Card[] {
  const o = loadOverrides();
  return CARDS.map(c => o[c.id]?.art ? { ...c, art: o[c.id].art! } : c);
}
