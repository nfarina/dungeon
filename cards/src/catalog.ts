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
  | "companion"  // Companion cards (the goose)
  | "junk"       // Keepsakes with no effect: notes, trophies, invitations
  | "shop"       // Cards that only exist on the Stairwell Shop's shelf between floors
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
  /** Which loot box(es) copies of this card start in. Set aside at setup, not shuffled into the deck. */
  envelope?: string;
  /** How many of the `qty` copies go into envelopes. Default: all of them, when `envelope` is set. */
  reserved?: number;
  /** Envelopes. */
  tier?: "Bronze" | "Silver" | "Gold" | "Platinum" | "Companion";
  trigger?: string;
  contents?: string;
  /** Envelopes: contents that have no dedicated copy and must be pulled from a deck when stuffing. Marked ◆ on the label. */
  pull?: string;
  /** Tiles: footprint in board squares (1 square = 1 inch). Standees: printed size in inches, tab included. */
  tile?: { w: number; h: number; kind: "furniture" | "trap" | "standee" };
  /** Tiles: which map piece this is, so size and count follow the map editor. A feature kind, a blocker's label, a trap kind, "secret door" or "falling block". */
  mapKey?: string;
  /** Subject description for the art generator. The style prefix lives in style.md. */
  art: string;
  /** Id of a card whose current art is sent along as a second reference image: "this exact character" (or object). */
  ref?: string;
  /** Tiles: this card is the printed back of that tile (the looted or used state). It follows that tile's size and count. */
  backOf?: string;
  /** Name of the matching entry in the sim, when it differs. */
  simName?: string;
  /** On the Stairwell Shop's shelf between floors: price in gold and which shelf the menu lists it under. Set from SHOP below. */
  shop?: { price: number; shelf: Shelf; qty?: number };
  /** Which floor introduced the card. Default 1. The workshop filters on it so a new floor prints on its own. */
  floor?: 1 | 2;
  /** Not shuffled into its deck: set out in a piece of furniture or carried by a monster (says which). */
  placed?: string;
};

export type Shelf = "Reading Material" | "Hardware" | "Apparel" | "Impulse Buys" | "Snacks & First Aid";
export const SHELVES: Shelf[] = ["Reading Material", "Hardware", "Apparel", "Impulse Buys", "Snacks & First Aid"];

export const DECK_NAMES: Record<Deck, string> = {
  kit: "Starting Kit", pockets: "Pockets", gear: "Gear", biggear: "Big Gear", fan: "Fan Deck",
  monster: "Monster", player: "Crawler", companion: "Companion", junk: "Junk", shop: "Stairwell Shop", envelope: "Loot Box Label", tile: "Floor Tile", standee: "Standee",
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

// Identical cards are one entry with a qty. `reserved` copies start in loot boxes instead of the deck.
const juice: Card = { id: "juice-box", name: "Juice Box", deck: "pockets", type: "consumable", qty: 5, envelope: "First Blood", reserved: 1,
  rules: "Heal 3. One use.", flavor: "Fruit punch. Probably.",
  art: "a dented cardboard juice box with a bendy straw, cartoon fruit on the label" };
const energy: Card = { id: "energy-drink", name: "Energy Drink", deck: "pockets", type: "consumable", qty: 3, envelope: "Why Would You Do That", reserved: 1,
  rules: "+1 attack die on your next attack this turn. One use.", flavor: "DO NOT GIVE TO CHILDREN.",
  art: "a tall neon green energy drink can crackling with little lightning bolts" };
const GOLD_ART: Record<number, string> = {
  1: "a single dull gold coin with a goblin face stamped on it", 2: "two gold coins, one bitten",
  3: "a small handful of gold coins spilling out of a torn pocket", 5: "a fat leather coin pouch tipped over, gold coins spilling out across the floor",
};
const gold = (v: number, qty: number, envelope?: string, reserved?: number, flavor = "Slightly sticky."): Card => ({
  id: `gold-${v}`, name: `Gold (${v})`, deck: "pockets", type: "consumable", qty, envelope, reserved,
  rules: `${v} gold. Spend it at the Stairwell Shop between floors.`, flavor, art: GOLD_ART[v] });

const pockets: Card[] = [
  juice, energy, gold(1, 2),
  gold(2, 4, "You Monster, Why Would You Do That, Sharing Is Caring", 3),
  gold(3, 3, "First Blood, Backseat Driver", 2, "A goblin was saving up."),
  gold(5, 2, "Cartographer, Boss Box", 2, "Payroll."),
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

// Cards printed for the loot boxes. Each belongs to a real deck (its back says so) and `envelope` names the box it starts in.
// Anything an envelope needs that is NOT here (Fire Axe, Firebolt, Football Helmet) is pulled from its deck when stuffing.
const extras: Card[] = [
  { id: "bookmark", name: "Bookmark", deck: "gear", type: "item", slot: "Trinket", envelope: "Nerd",
    rules: "Once per floor, set one of your cooldown dice to 0. Tick the box. ☐",
    flavor: "For the caster who just proved they're the caster.",
    art: "a worn leather bookmark with a frayed gold tassel, glowing faintly, lying across an open spellbook" },
  { id: "nope", name: "Spellbook: Nope", deck: "biggear", type: "spell", mind: 4, cooldown: 3, envelope: "Boss Box",
    rules: "After a monster rolls an attack against anyone in your room, cancel it.", flavor: "The announcer sighs.",
    art: "a small black leather spellbook, open, with a single glowing red stop-sign hand hovering above the page" },
  { id: "sir-reginald", name: "Sir Reginald", deck: "companion", type: "companion", envelope: "Sir Reginald",
    rules: "Companion. Moves with the player who freed him, occupies no square. Once per turn, 1 attack die at a monster adjacent to his person. When a monster attacks his person, roll 1 die: on a skull it attacks the goose instead. Health 2. He does not come back.",
    flavor: "An ill-tempered goose.",
    art: "a furious white goose with an orange beak, wings half spread, wearing a tiny crooked knight's helmet" },
  { id: "soggy-note", name: "Soggy Note", deck: "junk", type: "text", envelope: "Why Would You Do That",
    rules: "Don't forget to grab supplies from storage. I don't care if someone is in the bathroom already!!!",
    flavor: "Signed G. Smells exactly how you'd expect.",
    art: "a torn, damp scrap of parchment with smeared handwriting and a crude arrow, held between two fingers at arm's length" },
  { id: "you-did-that", name: "You did that.", deck: "junk", type: "text", envelope: "You Monster",
    rules: "We all saw.", flavor: "No effect.",
    art: "three tiny empty goblin-sized chairs in a dark room, a single spotlight, nothing else" },
  { id: "save-the-date", name: "Save the Date", deck: "junk", type: "text", envelope: "Boss Box",
    rules: "Congratulations on surviving Floor 1. Class selection is available at the bottom of Floor 2. This offer is non-transferable and the company is not responsible for what you choose.",
    art: "a fancy gold-embossed invitation card with a wax seal shaped like a dungeon stairwell" },
];

// The Stairwell Shop, between Floors 1 and 2. Most of the shelf is cards already printed for Floor 1 that never
// got found (SHOP below prices them); these two exist only in the shop. One copy of each, no restocks.
const shop: Card[] = [
  { id: "ball-bearings", name: "Bag of Ball Bearings", deck: "shop", type: "item", slot: "Trinket",
    rules: "Your Slingshot rolls 2 attack dice instead of 1.", flavor: "Rounder than pebbles. Meaner, too.",
    art: "a small drawstring canvas bag tipped over, shiny steel ball bearings spilling out beside a wooden slingshot" },
  { id: "mystery-box", name: "Mystery Box", deck: "shop", type: "text", qty: 2,
    rules: "Hand this to the announcer for one face-down draw from the Pockets deck. No refunds. No peeking.",
    flavor: "The shopkeeper won't say. The shopkeeper doesn't know.",
    art: "a small cardboard box wrapped in brown paper and tied with string, a big painted question mark on the side, faintly glowing at the seams" },
];

/** What is on the shelf and for how much. Prices are steep on purpose: 22 gold buys about one real card per player. */
const SHOP: Record<string, { price: number; shelf: Shelf; qty?: number }> = {
  // Shelves are store departments, not builds: nothing on the menu should read as "the tank shelf".
  "shove": { price: 9, shelf: "Reading Material" },
  "patch-up": { price: 9, shelf: "Reading Material" },
  "scroll-firebolt": { price: 4, shelf: "Reading Material" },
  "scroll-smoke-bomb": { price: 4, shelf: "Reading Material" },
  "scroll-stone-skin": { price: 3, shelf: "Reading Material" },
  "ball-bearings": { price: 7, shelf: "Hardware" },
  "trap-kit": { price: 4, shelf: "Hardware" },
  "sneakers": { price: 5, shelf: "Apparel" },
  "leather-jacket": { price: 5, shelf: "Apparel" },
  "rabbits-foot": { price: 6, shelf: "Impulse Buys" },
  "mystery-box": { price: 3, shelf: "Impulse Buys", qty: 2 },
  "juice-box": { price: 2, shelf: "Snacks & First Aid" },
  "bandage": { price: 2, shelf: "Snacks & First Aid" },
};

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
  { desc: "a Chinese woman in her thirties with a neat black bob, wearing teal hospital scrubs under an open puffy jacket, a hospital ID badge on a lanyard, a tote bag over one shoulder, calm and very tired",
    flavor: "Walked out of a twelve-hour ER shift. Has stitched up worse than this. Would very much like to sit down." },
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
const standee = (id: string, name: string, w: number, h: number, art: string, ref?: string, qty?: number): Card =>
  ({ id: `standee-${id}`, name, deck: "standee", type: "standee", tile: { w, h: h + STANDEE_TAB, kind: "standee" }, rules: "", art, ref, qty });
const standeeArt = (desc: string) => `full-body figure of ${desc}, ordinary modern everyday clothes, standing facing the viewer, whole body visible from head to shoes, no weapons`;
const standees: Card[] = [
  ...HUMANS.map((h, i) => standee(`human-${i + 1}`, `Crawler ${i + 1}`, 0.75, 1.5, standeeArt(h.desc), `human-${i + 1}`)),
  standee("greg", "Greg", 1.5, 2.25, "a huge lumpy grey-green cave troll in a too-tight short-sleeved dress shirt with a clip-on tie and a lanyard, a name badge reading GREG, reading glasses, standing upright facing the viewer, holding a coffee mug in one hand and a rolled-up stack of paperwork in the other, whole body visible", "floor-manager"),
];

const env = (id: string, name: string, tier: Card["tier"], trigger: string, contents: string, pull?: string): Card =>
  ({ id: `env-${id}`, name, deck: "envelope", type: "envelope", tier, trigger, contents, pull, rules: "", art: "" });
const envelopes: Card[] = [
  env("first-blood", "First Blood", "Bronze", "First monster killed on the floor", "3 gold, 1 Juice Box"),
  env("face", "Found It With Your Face", "Silver", "First player to trigger a trap", "Football Helmet", "Football Helmet, from Gear"),
  env("you-monster", "You Monster", "Bronze", "Kill all three goblins in the Daycare", "2 gold, You did that."),
  env("toilet", "Why Would You Do That", "Bronze", "Reach into the toilet", "1 Energy Drink, Gold (2), Soggy Note"),
  env("nerd", "Nerd", "Gold", "First player to learn a Spellbook", "Scroll: Firebolt, Bookmark", "Scroll: Firebolt, from Pockets"),
  env("sharing", "Sharing Is Caring", "Bronze", "Give an item to another player", "2 gold"),
  env("trap-chef", "Trap Chef", "Gold", "A monster dies from a trap", "Fire Axe", "Fire Axe, from Big Gear"),
  env("cartographer", "Cartographer", "Silver", "Open the doors to six of the nine rooms", "5 gold"),
  env("reginald", "Sir Reginald", "Companion", "Open the cage in Room 6", "Sir Reginald"),
  env("backseat", "Backseat Driver", "Bronze", "A Viewer's card causes a monster's death", "3 gold for the Viewer, on Floor 2"),
  env("boss", "Boss Box", "Platinum", "Kill the Floor Manager", "Spellbook: Nope, 5 gold, Save the Date"),
];

// Floor tiles. Sizes are a proposal; the map file is the source of truth once they agree.
// Sizes and counts here are fallbacks: cards() replaces them with whatever the map file has for `mapKey`.
const tile = (id: string, name: string, w: number, h: number, kind: "furniture" | "trap", art: string, mapKey: string, qty = 1): Card =>
  ({ id: `tile-${id}`, name, deck: "tile", type: "tile", tile: { w, h, kind }, qty, rules: "", art, mapKey });
const tiles: Card[] = [
  tile("stairs", "Stairs Down", 2, 2, "furniture", "a wide stone staircase descending into darkness, worn steps, a faint glow from below", "stairs"),
  tile("desk", "Manager's Desk", 2, 1, "furniture", "a big dark wooden office desk with a nameplate, coffee mug, stapler and a stack of paperwork", "desk"),
  tile("table", "Break Room Table", 2, 1, "furniture", "a scratched wooden table with a half-eaten sandwich, a juice box and scattered crumbs", "table"),
  tile("chest", "Locked Chest", 1, 1, "furniture", "an iron-banded wooden treasure chest with a heavy padlock", "chest"),
  tile("rack", "Weapon Rack", 2, 2, "furniture", "a low wooden weapon stand lying on the floor, seen from directly above, with mismatched weapons laid flat across it: a fire axe, a shortbow, a frying pan, a table leg and an open spellbook", "rack"),
  tile("toilet", "Latrine", 1, 1, "furniture", "a grimy dungeon toilet with a cracked wooden seat and a suspicious green glow inside", "toilet"),
  tile("shelf", "Bookshelf", 2, 1, "furniture", "a tall wooden bookshelf crammed with old leather spellbooks and scrolls, one book glowing faintly blue", "shelf"),
  tile("cage", "The Cage", 2, 2, "furniture", "a large rusted iron cage with an angry white goose inside, feathers on the floor around it", "cage"),
  tile("chairs", "Tiny Chairs", 2, 1, "furniture", "a cluster of tiny wooden chairs and a small round table with crayons and a half-finished drawing of a goblin", "tiny chairs"),
  tile("sign", "Welcome Sign", 1, 1, "furniture", "a cheerful corporate welcome sign on a metal stand, blank face, with a small bronze bell beside it", "welcome sign"),
  tile("pit", "Pit Trap", 1, 1, "trap", "a square hole in a stone dungeon floor, a dark pit with a few broken planks around the edge", "pit"),
  tile("spear", "Spear Trap", 1, 1, "trap", "a stone floor square with several sharp iron spikes thrust up through cracked flagstones", "spear"),
  tile("block", "Falling Block", 1, 1, "trap", "a heap of massive broken stone rubble and dust filling a square of dungeon floor", "falling block"),
  tile("secret", "Secret Door", 1, 1, "trap", "a stone floor square with a thin hidden crack outlining a doorway and a small iron ring pull", "secret door"),
];

// The other side of a furniture tile: what it looks like once the party has been through it.
// Flip the tile on the board when it's looted. Generated with the front as a reference so it's clearly the same object.
const used = (id: string, art: string): Card => {
  const front = tiles.find(t => t.id === `tile-${id}`)!;
  return { id: `${front.id}-used`, name: `${front.name}, used`, deck: "tile", type: "tile", tile: { ...front.tile! }, rules: "", art, ref: front.id, backOf: front.id };
};
const tileBacks: Card[] = [
  used("desk", "the same desk after being ransacked: every drawer pulled out, papers scattered everywhere, the mug tipped over and the nameplate knocked askew"),
  used("table", "the same table after the party has been through it: the sandwich gone, only crumbs left, the juice box crushed flat"),
  used("chest", "the same chest with its lid thrown wide open and nothing inside, the broken padlock lying on the floor beside it"),
  used("rack", "the same weapon stand, now completely empty, only dust outlines and a broken strap where the weapons were"),
  used("toilet", "the same toilet with the lid off and the seat up, the green glow gone, a dropped rubber glove beside it"),
  used("shelf", "the same bookshelf half emptied, the remaining books toppled over, one shelf sagging, a torn page on the floor"),
  used("cage", "the same cage with its door hanging open and nothing inside, a few white feathers scattered on the floor of it"),
  used("chairs", "the same tiny chairs knocked over, crayons scattered across the floor, the drawing torn in half"),
  used("sign", "the same welcome sign knocked flat on its face on the floor, the bell dented and lying on its side"),
];

// ---------------------------------------------------------------------------
// Floor 2 (floor-2.md). Everything here is `floor: 2` so it prints on its own.
// ---------------------------------------------------------------------------
const f2 = <T extends Card>(c: T): T => ({ ...c, floor: 2 });

const f2pockets: Card[] = ([
  { id: "bleach", name: "Industrial Bleach", deck: "pockets", type: "consumable", qty: 5, placed: "furniture",
    rules: "Obliterate a corpse on your square or adjacent to you. One use. Or drink it: lose 1 Health. Why would you.",
    flavor: "DO NOT DRINK. Seriously.",
    art: "a big white plastic jug of industrial bleach with a red skull warning label and a splash cap, slightly dented" },
  { id: "juice-box-f2-placed", name: "Juice Box", deck: "pockets", type: "consumable", placed: "the Bunk",
    rules: "Heal 3. One use.", flavor: "Warm. Nobody minds.",
    art: "a dented cardboard juice box with a bendy straw, cartoon fruit on the label" },
  { id: "scroll-heal-f2-placed", name: "Scroll: Heal", deck: "pockets", type: "scroll", placed: "the Bench",
    rules: "Heal 4 to you or an adjacent player.", flavor: "Taped inside a locker, next to the eye wash.",
    art: "an unrolled parchment scroll glowing warm gold with a heart and a plus sign drawn on it" },
  { id: "skeleton-key-f2-placed", name: "Skeleton Key", deck: "biggear", type: "item", slot: "Trinket", placed: "the Tool rack",
    rules: "Opens one locked chest. Then it crumbles. On this floor the Fire Axe opens nothing locked.",
    flavor: "Hanging on the tool rack where a key should never hang.",
    art: "an ornate iron key with a tiny skull for a bow, bits crumbling off it, hanging from a nail on a pegboard" },
  // The only Floor 1 Pockets card that has to be reprinted: Vicki still holds the original. Gold is NOT reprinted —
  // the shop took all 21 spent gold back into the box, so the Floor 1 coins cover both the Floor 2 deck and its envelopes.
  // Both spare Energy Drinks are free too (three printed, Ethan holds one).
  { id: "bandage-f2", name: "Bandage", deck: "pockets", type: "consumable",
    rules: "Heal 1, or get an adjacent Downed player up without spending your action. One use.", flavor: "Mostly clean.",
    art: "a roll of white gauze bandage, partly unrolled, with a small red cross on the wrapper" },
] as Card[]).map(f2);

const f2gear: Card[] = ([
  { id: "hard-hat", name: "Hard Hat", deck: "gear", type: "item", slot: "Head", rules: "Defend +1.", flavor: "Required on site.",
    art: "a scuffed yellow construction hard hat with a faded company sticker on the front" },
  { id: "steel-boots", name: "Steel-Toed Boots", deck: "gear", type: "item", slot: "Feet", rules: "Defend +1.", flavor: "Kick things.",
    art: "a pair of heavy brown leather work boots with steel toe caps showing through the worn leather" },
  { id: "wet-floor-sign", name: "Wet Floor Sign", deck: "gear", type: "item", slot: "Off hand", rules: "Defend +1.", flavor: "Caution: you.",
    art: "a yellow folding wet floor caution sign with a slipping stick figure, held up like a shield" },
  { id: "hi-vis-vest", name: "Hi-Vis Vest", deck: "gear", type: "item", slot: "Body", rules: "Defend +1.", flavor: "Nobody will run you over. They will still hit you.",
    art: "a bright orange high-visibility safety vest with silver reflective stripes, hanging on a hook" },
  { id: "push-broom", name: "Push Broom", deck: "gear", type: "item", slot: "Main hand", rules: "Attack +1.", flavor: "Wide. Satisfying.",
    art: "a wide wooden push broom with stiff black bristles and a long handle, held ready like a polearm" },
  { id: "mop", name: "Mop", deck: "gear", type: "item", slot: "Main hand",
    rules: "Attack +1. Once: obliterate an adjacent corpse as your action, no bleach. Then it's just a mop. Tick the box. ☐",
    flavor: "Property of Facilities.",
    art: "a grey string mop on a wooden handle, the mop head dripping something faintly green" },
  { id: "contractor-badge", name: "Contractor Badge", deck: "gear", type: "item", slot: "Trinket",
    rules: "Kobolds won't attack you if there's any other hero they can reach.", flavor: "Union rules.",
    art: "a laminated contractor ID badge on a lanyard with a blurry photo of a kobold and a barcode" },
  { id: "scroll-lights-out", name: "Scroll: Lights Out", deck: "gear", type: "scroll",
    rules: "Every monster in your room skips its next activation.", flavor: "Anyone can read it. Once.",
    art: "a rolled parchment scroll with a wax seal, an image of a light switch flipped down glowing on it" },
] as Card[]).map(f2);

const f2biggear: Card[] = ([
  { id: "cattle-prod", name: "Cattle Prod", deck: "biggear", type: "item", slot: "Main hand",
    rules: "Attack +1. A monster you damage with it skips its next activation.", flavor: "Bzzt.",
    art: "a long yellow-and-black electric cattle prod with crackling blue sparks at the tip" },
  { id: "keyring", name: "Janitor's Keyring", deck: "biggear", type: "item", slot: "Trinket",
    rules: "Opens a locked chest or door as your action. Three uses. Tick the boxes. ☐ ☐ ☐ Does not know the password.",
    flavor: "Forty keys. Three that work.",
    art: "a huge steel ring crowded with dozens of mismatched keys, hanging from a belt clip" },
  { id: "mop-up", name: "Spellbook: Mop-Up", deck: "biggear", type: "spell", mind: 4, cooldown: 3,
    rules: "Obliterate a corpse in line of sight.",
    art: "a small leather spellbook, open, with a glowing blue mop and bucket floating above the page" },
  { id: "static", name: "Spellbook: Static", deck: "biggear", type: "spell", mind: 4, cooldown: 3,
    rules: "1 damage to every monster adjacent to you. No defence roll.",
    art: "a small leather spellbook, open, with a crackling ring of static electricity radiating out from the page" },
  { id: "lunchbox", name: "Steel Lunchbox", deck: "biggear", type: "item", slot: "Trinket",
    rules: "Once per floor, heal 3. Tick the box. ☐", flavor: "There is always something in it.",
    art: "a battered steel workman's lunchbox with a domed lid, slightly open, a warm glow inside" },
  // Placed or in an envelope, not shuffled.
  { id: "bathrobe", name: "Wizard's Bathrobe", deck: "biggear", type: "item", slot: "Body", placed: "the Laundry shelf",
    rules: "Mind +1.", flavor: "Terrycloth. Stacks with the Glasses, which is the whole point.",
    art: "a fluffy purple terrycloth bathrobe covered in tiny gold stars and moons, on a wooden hanger" },
  { id: "scroll-restructuring", name: "Scroll: Restructuring", deck: "biggear", type: "scroll", mind: 5, placed: "the Shift Lead's desk",
    rules: "Mind 5 to read. 4 attack dice at a monster in line of sight, and 1 damage to every monster adjacent to it. One use.",
    flavor: "Effective immediately.",
    art: "an ornate parchment scroll with a red corporate seal, a glowing orange org chart on it with several boxes crossed out" },
  { id: "chainmail-bib-f2", name: "Orc Chainmail Bib", deck: "biggear", type: "item", slot: "Body", placed: "the Evidence locker",
    rules: "Defend +2. Subtract 2 from your movement roll. Can't wear Sneakers with it.", flavor: "They don't fit under.",
    art: "a heavy chainmail bib apron with a leather neck strap, dented and stained" },
  { id: "shortbow-f2", name: "Goblin Shortbow", deck: "biggear", type: "item", slot: "Both hands", envelope: "Nice Shot",
    rules: "Attack 2 dice at any monster in line of sight. Can't be used on an adjacent monster. Replaces your Attack instead of adding to it.",
    flavor: "Goblin-sized. Still works.",
    art: "a small crude wooden shortbow with a frayed string and three mismatched arrows" },
  { id: "leaf-blower", name: "Leaf Blower", deck: "biggear", type: "item", slot: "Both hands", envelope: "Trap Chef",
    rules: "Action: Shove. Push a monster or a corpse in line of sight up to 3 squares directly away from you. Into a pit: it goes in. A monster into a wall or another monster: 1 damage.",
    flavor: "Not a weapon. Not not a weapon.",
    art: "a loud orange gas-powered leaf blower with a long black nozzle, leaves and dust blasting out of it" },
] as Card[]).map(f2);

const f2extras: Card[] = ([
  { id: "password", name: "Password of the Day", deck: "junk", type: "text", placed: "whichever of the Shift Lead, the Feed trough or the Ash shelf they reach first",
    rules: "Today's password is whatever the announcer says it is. Read it aloud at the Sump door. Do not write it down.",
    flavor: "Signed, the Shift Lead. Underlined twice.",
    art: "a yellow sticky note with a scribbled word crossed out and rewritten, stuck to a clipboard" },
  { id: "class-selection", name: "Class Selection Available", deck: "junk", type: "text", envelope: "Boss Box",
    rules: "Congratulations on surviving Floor 2. As promised, class selection is now available. Each Crawler will be offered classes based on their conduct so far. Conduct has been noted.",
    flavor: "The offer is genuine. The classes are being drafted as we speak.",
    art: "an official-looking golden certificate with an embossed seal, a blank line where a name goes, and a small footnote in tiny print" },
  { id: "pet-biscuit", name: "Pet Biscuit", deck: "companion", type: "item", slot: "Companion upgrade", envelope: "Good Boy",
    rules: "Reginald gains base Health of 3. <b>Together:</b> his person attacks with +1 die, and when a monster hurts his person they may shout \"Reginald!\" and the goose takes the damage instead. <b>Apart:</b> on his person's turn he moves up to 6 and attacks an adjacent monster with 2 dice. He opens, searches and carries nothing. <b>Throw him as an action:</b> 2 attack dice at a monster in line of sight, and he lands beside it, apart. Rejoin by ending a move on each other's square.",
    flavor: "Who's a good boy. He is. He knows.",
    art: "a large bone-shaped dog biscuit with a tiny crown stamped into it, resting on a red velvet cushion" },
  { id: "reginald-standee", name: "Sir Reginald", deck: "standee", type: "standee", tile: { w: 0.75, h: 1 + STANDEE_TAB, kind: "standee" }, rules: "", ref: "sir-reginald",
    art: "full-body figure of a furious white goose with an orange beak, wings half spread, wearing a tiny crooked knight's helmet, standing facing the viewer, whole body visible" },
] as Card[]).map(f2);

const f2monsters: Card[] = ([
  { id: "rat", name: "Cave Rat", deck: "monster", type: "monster", stats: { att: 2, def: 1, hp: 1, mind: 1, move: "10" },
    loot: ["1–3  Nothing", "4–6  Draw Pockets"], rules: "Leaves a small corpse.", flavor: "Unionized. Has a lanyard. Does not have a name tag.",
    art: "a large scruffy brown cave rat standing on its hind legs wearing a lanyard, yellow teeth bared" },
  { id: "kobold", name: "Kobold Miner", deck: "monster", type: "monster", stats: { att: 3, def: 2, hp: 1, mind: 2, move: "8" },
    loot: ["1–2  Nothing", "3–4  Draw Pockets", "5–6  Draw Gear"], rules: "Leaves a medium corpse.", flavor: "Contractor. Paid by the corpse. Hasn't been paid.",
    art: "a wiry red-scaled kobold in a miner's helmet with a headlamp, holding a pickaxe, dusty overalls" },
  { id: "bear", name: "Cave Bear", deck: "monster", type: "monster", stats: { att: 3, def: 3, hp: 2, mind: 2, move: "6" },
    loot: ["1–3  Draw Gear", "4–6  Draw Big Gear"], rules: "Leaves a large corpse.", flavor: "Not staff. Nobody has told the bear this.",
    art: "a huge shaggy dark brown cave bear rearing up on its hind legs, roaring, a torn hi-vis vest snagged on one claw" },
  { id: "shift-lead", name: "The Shift Lead", deck: "monster", type: "monster", stats: { att: 3, def: 3, hp: 2, mind: 3, move: "8" },
    loot: ["Password of the Day + Draw Gear"], rules: "Leaves a medium corpse. The password opens the Sump door.", flavor: "Has the password. Has a clipboard. Has had enough.",
    art: "a tall kobold in a short-sleeved dress shirt and a hard hat, holding a clipboard and a coffee mug, exhausted and furious" },
  { id: "grub", name: "Grub", deck: "monster", type: "monster", stats: { att: 0, def: 0, hp: 1, mind: 0, move: "4" },
    loot: ["Nothing. Ever."],
    special: [
      "Ignores heroes. Moves 4 toward the largest corpse it can reach (ties: nearest) and eats it on arrival.",
      "Then flip it: small corpse → Bloated Grub, medium → Custodian, large → Facilities Manager.",
      "Squashed: back to the stairwell queue. It will be back.",
      "Janitors leave no corpse.",
    ],
    rules: "", flavor: "Facilities. Please do not interact with the staff.",
    art: "a fat pale blind grub the size of a dog, segmented and glistening, wearing a tiny janitor's cap, mouth open" },
  { id: "bloated-grub", name: "Bloated Grub", deck: "monster", type: "monster", stats: { att: 2, def: 2, hp: 1, mind: 0, move: "6" },
    loot: ["Nothing"], rules: "Hunts the nearest hero by open route. No corpse.", flavor: "Ate a rat. Feels great.",
    art: "a swollen pale grub with a rat's tail hanging out of its mouth, wearing a tiny janitor's cap, moving with purpose" },
  { id: "custodian", name: "Custodian", deck: "monster", type: "monster", stats: { att: 3, def: 3, hp: 2, mind: 0, move: "6" },
    loot: ["Nothing"], rules: "Hunts the nearest hero by open route. No corpse.", flavor: "Ate a kobold. Has a pickaxe now. Sort of.",
    art: "a large upright grub with a kobold's helmet fused to its head and a pickaxe held in a new pair of stubby arms, janitor's cap on top" },
  { id: "facilities-manager", name: "Facilities Manager", deck: "monster", type: "monster", stats: { att: 4, def: 3, hp: 3, mind: 0, move: "6" },
    loot: ["Nothing"], rules: "Hunts the nearest hero by open route. No corpse.", flavor: "Ate a bear. Got promoted.",
    art: "an enormous bloated grub with bear fur sprouting in patches and bear claws on stubby arms, a janitor's cap and a clip-on tie, looming" },
  { id: "senior-custodian", name: "The Senior Custodian", deck: "monster", type: "monster", stats: { att: 4, def: 3, hp: 5, mind: 4, move: "6" },
    loot: ["Boss Box + Draw Big Gear"],
    special: [
      "Snack: if a corpse is in the room, eats it at the start of its turn, heals 2, and still attacks.",
      "Mop (Cooldown 2): 2 attack dice at every adjacent hero, when two or more are adjacent.",
      "Understaffed: while any fed janitor is alive, defends with 4 dice instead of 3.",
    ],
    rules: "", flavor: "A grub that ate something with a very large skeleton, a long time ago.",
    art: "a colossal ancient grub filling a cavern, pale and wrinkled, wearing a ragged janitor's cap and a name badge, a giant mop in one stubby arm, bones scattered around it" },
] as Card[]).map(f2);

const f2standees: Card[] = ([
  standee("rat", "Cave Rat", 0.75, 1, "full-body figure of a large scruffy brown cave rat standing on its hind legs wearing a lanyard, facing the viewer, whole body visible", "rat", 4),
  standee("kobold", "Kobold Miner", 0.75, 1.5, "full-body figure of a wiry red-scaled kobold in a miner's helmet with a headlamp, holding a pickaxe, dusty overalls, facing the viewer, whole body visible", "kobold", 2),
  standee("bear", "Cave Bear", 1.25, 1.75, "full-body figure of a huge shaggy dark brown cave bear rearing up on its hind legs, facing the viewer, whole body visible", "bear", 2),
  standee("shift-lead", "The Shift Lead", 0.75, 1.5, "full-body figure of a tall kobold in a short-sleeved dress shirt and a hard hat, holding a clipboard and a coffee mug, facing the viewer, whole body visible", "shift-lead"),
  standee("bloated-grub", "Bloated Grub", 0.75, 1, "full-body figure of a swollen pale grub with a rat's tail hanging out of its mouth, wearing a tiny janitor's cap, facing the viewer", "bloated-grub", 3),
  standee("custodian", "Custodian", 1, 1.5, "full-body figure of a large upright grub with a kobold's helmet fused to its head and a pickaxe in stubby arms, janitor's cap, facing the viewer, whole body visible", "custodian", 4),
  standee("facilities-manager", "Facilities Manager", 1.25, 1.75, "full-body figure of an enormous bloated grub with patches of bear fur and bear claws, a janitor's cap and a clip-on tie, facing the viewer, whole body visible", "facilities-manager", 2),
  standee("sump-door", "The Sump Door", 1.5, 2.25, "a massive riveted steel industrial door with a big red AUTHORIZED PERSONNEL ONLY sign, a rusty intercom speaker grille with a glowing green button beside it, a small drain at the bottom, seen straight on, whole door visible"),
  standee("senior-custodian", "The Senior Custodian", 1.5, 2.25, "full-body figure of a colossal ancient pale wrinkled grub wearing a ragged janitor's cap and a name badge, holding a giant mop, facing the viewer, whole body visible", "senior-custodian"),
] as Card[]).map(f2);

const f2envelopes: Card[] = ([
  env("nice-shot", "Nice Shot", "Gold", "Kill a monster from range with a weapon. Spells don't count.", "Goblin Shortbow"),
  env("good-boy", "Good Boy", "Companion", "Sir Reginald eats a corpse", "Pet Biscuit"),
  env("clean-freak", "Clean Freak", "Silver", "Obliterate three corpses", "4 gold, 1 Industrial Bleach", "Gold (2) \u00d72 and an Industrial Bleach, from the spares"),
  env("health-inspector", "Health Inspector", "Gold", "Kill a fed janitor", "5 gold", "one Gold (5), from the Floor 1 coins"),
  env("drink", "Why Would You Drink That", "Bronze", "Drink the bleach", "3 gold, 1 Juice Box", "one Gold (3) and a Juice Box, from Pockets"),
  env("trap-chef-f2", "Trap Chef", "Gold", "A monster dies from a trap", "Leaf Blower"),
  env("boss-f2", "Boss Box", "Platinum", "Kill the Senior Custodian", "8 gold, Class Selection Available", "Gold (5) + Gold (3), from the Floor 1 coins"),
] as Card[]).map(f2);

const f2tile = (id: string, name: string, w: number, h: number, kind: "furniture" | "trap", art: string, mapKey: string, qty = 1): Card =>
  f2({ ...tile(id, name, w, h, kind, art, mapKey), qty });
const f2tiles: Card[] = [
  f2tile("stairs-f2", "Stairs Down", 1, 2, "furniture", "a wide stone staircase descending into darkness, worn steps, a faint glow from below", "stairs"),
  f2tile("front-desk", "Front Desk", 2, 1, "furniture", "a chipped laminate reception desk seen from directly above, with a bell, a sign-in sheet and a dead potted plant", "front desk"),
  f2tile("shelving", "Shelving", 2, 1, "furniture", "a steel utility shelving unit seen from directly above, stacked with cleaning supplies, jugs and rags", "shelving"),
  f2tile("shift-desk", "Shift Lead's Desk", 2, 1, "furniture", "a battered metal office desk seen from directly above, covered in clipboards, a rotary phone and a sticky note", "shift lead's desk"),
  f2tile("bench", "Bench", 1, 2, "furniture", "a wooden locker room bench seen from directly above, a towel and a single boot left on it", "bench"),
  f2tile("feed-trough", "Feed Trough", 2, 1, "furniture", "a long wooden feed trough seen from directly above, half full of suspicious kibble", "feed trough"),
  f2tile("tool-rack", "Tool Rack", 1, 2, "furniture", "a pegboard tool rack seen from directly above, lying flat, hung with wrenches, a hammer and a coil of rope", "tool rack"),
  f2tile("pipe-rack", "Pipe Rack", 2, 1, "furniture", "a rack of rusted iron pipes and valves seen from directly above, steam leaking from one joint", "pipe rack"),
  f2tile("filing-cabinet", "Filing Cabinet", 1, 2, "furniture", "a tall grey steel filing cabinet seen from directly above, one drawer slightly open with papers sticking out", "filing cabinet"),
  f2tile("laundry-shelf", "Laundry Shelf", 2, 1, "furniture", "a wooden laundry shelf seen from directly above, stacked with folded towels and one fluffy purple bathrobe", "laundry shelf"),
  f2tile("lunch-table", "Lunch Table", 2, 2, "furniture", "a square cafeteria table seen from directly above, with trays, a spilled drink and a half-eaten sandwich", "lunch table"),
  f2tile("ash-shelf", "Ash Shelf", 2, 1, "furniture", "a soot-stained stone shelf seen from directly above, with urns, a shovel and a pile of grey ash", "ash shelf"),
  f2tile("evidence-locker", "Evidence Locker", 2, 1, "furniture", "a steel evidence locker seen from directly above, padlocked, with numbered tags and a chain", "evidence locker"),
  f2tile("bunk", "Bunk", 1, 2, "furniture", "a rickety wooden bunk bed seen from directly above, a thin mattress and a chewed blanket", "bunk"),
  f2tile("sump-pump", "Sump Pump", 2, 2, "furniture", "a huge rusted industrial sump pump seen from directly above, with pipes, a wheel valve and a puddle of dark water", "sump pump"),
  f2tile("corpse-small", "Small Corpse", 1, 1, "trap", "a dead cave rat lying on a stone floor square seen from directly above, X eyes, lanyard beside it", "corpse", 8),
  f2tile("corpse-medium", "Medium Corpse", 1, 1, "trap", "a dead kobold miner lying on a stone floor square seen from directly above, X eyes, helmet rolled off, pickaxe dropped", "corpse", 6),
  f2tile("corpse-large", "Large Corpse", 1, 1, "trap", "a dead cave bear slumped on a stone floor square seen from directly above, X eyes, one paw over the edge of the square", "corpse", 3),
  f2tile("grub-tile", "Grub", 1, 1, "trap", "a fat pale blind grub curled on a stone floor square seen from directly above, wearing a tiny janitor's cap", "grub", 8),
];
const f2used = (id: string, art: string): Card => {
  const front = f2tiles.find(t => t.id === `tile-${id}`)!;
  return f2({ id: `${front.id}-used`, name: `${front.name}, used`, deck: "tile", type: "tile", tile: { ...front.tile! }, rules: "", art, ref: front.id, backOf: front.id });
};
const f2tileBacks: Card[] = [
  f2used("front-desk", "the same reception desk ransacked, drawers pulled out, the bell knocked over, papers everywhere"),
  f2used("shelving", "the same shelving unit stripped bare, one shelf collapsed, a single empty jug on its side"),
  f2used("shift-desk", "the same desk with every clipboard flung off, the phone off the hook, a sticky note torn away"),
  f2used("bench", "the same bench tipped on its side, the towel on the floor"),
  f2used("feed-trough", "the same trough overturned and empty, kibble scattered across the floor"),
  f2used("tool-rack", "the same pegboard with every tool gone, only outlines and empty pegs"),
  f2used("pipe-rack", "the same pipe rack with a valve wrenched off, steam gushing, a pipe lying loose"),
  f2used("filing-cabinet", "the same filing cabinet with every drawer yanked out and papers heaped around it"),
  f2used("laundry-shelf", "the same laundry shelf with the towels toppled and the bathrobe gone"),
  f2used("lunch-table", "the same cafeteria table with the trays swept off and every chair knocked over"),
  f2used("ash-shelf", "the same shelf with the urns tipped and ash spilled everywhere"),
  f2used("evidence-locker", "the same locker forced open, the chain cut, empty inside"),
  f2used("bunk", "the same bunk with the mattress dragged off and the blanket in a heap"),
];

export const CARDS: Card[] = [...kits, ...pockets, ...gear, ...biggear, ...extras, ...shop, ...fan, ...monsters, ...players, ...envelopes, ...tiles, ...tileBacks, ...standees,
  ...f2pockets, ...f2gear, ...f2biggear, ...f2extras, ...f2monsters, ...f2envelopes, ...f2tiles, ...f2tileBacks, ...f2standees]
  .map(c => SHOP[c.id] ? { ...c, shop: SHOP[c.id] } : c);
for (const id of Object.keys(SHOP)) if (!CARDS.some(c => c.id === id)) throw new Error(`SHOP prices "${id}" but no such card`);

/** The shelf, in menu order. */
export function shopStock(all: Card[] = CARDS): Card[] {
  return SHELVES.flatMap(s => all.filter(c => c.shop?.shelf === s).sort((a, b) => b.shop!.price - a.shop!.price));
}

export const DECK_ORDER: Deck[] = ["player", "kit", "pockets", "gear", "biggear", "companion", "junk", "shop", "fan", "monster", "envelope", "tile", "standee"];

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
/** The map editor's files, one per floor. Tiles read their footprint and count from them, so a resize there shows up here. */
export const MAP_FILES: Record<number, string> = {
  1: join(ROOT, "..", "sim", "src", "content", "floor1.map.json"),
  2: join(ROOT, "..", "sim", "src", "content", "floor2.map.json"),
};
export const MAP_FILE = MAP_FILES[1];
export type Footprint = { w: number; h: number; n: number };

/** Every piece on a floor's map, keyed the way `Card.mapKey` is, as one entry per distinct size with a count.
 *  A labelled piece is keyed by its label (Floor 2 names every piece); an unlabelled one by its kind (Floor 1). */
export function mapFootprints(floor = 1): Record<string, Footprint[]> {
  const file = MAP_FILES[floor];
  if (!file || !existsSync(file)) return {};
  const fl = JSON.parse(readFileSync(file, "utf8")).floor ?? {};
  const out: Record<string, Footprint[]> = {};
  const add = (key: string, w = 1, h = 1) => {
    const list = out[key.trim().toLowerCase()] ??= [];
    const e = list.find(s => s.w === w && s.h === h);
    if (e) e.n++; else list.push({ w, h, n: 1 });
  };
  for (const f of fl.features ?? []) {
    if (f.kind === "blocker") { if (f.label) add(f.label, f.w, f.h); }
    else add(f.label ?? f.kind, f.w, f.h);
  }
  for (const t of fl.traps ?? []) add(t.kind);
  for (const d of fl.doors ?? []) { if (d.kind === "secret") add("secret door"); if (d.trap === "block") add("falling block"); }
  return out;
}

/** Unlabeled generic furniture on the map: it can't be matched to a tile, so it's worth flagging. */
export function unlabeledBlockers(floor = 1): { x: number; y: number; w: number; h: number }[] {
  const file = MAP_FILES[floor];
  if (!file || !existsSync(file)) return [];
  const fl = JSON.parse(readFileSync(file, "utf8")).floor ?? {};
  return (fl.features ?? []).filter((f: any) => f.kind === "blocker" && !f.label).map((f: any) => ({ x: f.x, y: f.y, w: f.w ?? 1, h: f.h ?? 1 }));
}

export function cards(): Card[] {
  const o = loadOverrides();
  const fps = { 1: mapFootprints(1), 2: mapFootprints(2) };
  const fronts = CARDS.flatMap(c => {
    const base = o[c.id]?.art ? { ...c, art: o[c.id].art! } : c;
    if (c.type !== "tile" || !c.mapKey) return [base];
    const sizes = fps[c.floor ?? 1][c.mapKey];
    if (!sizes?.length) return [base];
    // one card per distinct size on the map; the first keeps the plain id so existing art and overrides still apply
    return sizes.map((s, i) => ({ ...base, id: i ? `${c.id}-${s.w}x${s.h}` : c.id, qty: s.n, tile: { ...c.tile!, w: s.w, h: s.h } }));
  });
  // tile backs follow their front: one per size variant, same footprint and count
  return fronts.flatMap(c => {
    if (!c.backOf) return [c];
    const of = fronts.filter(f => !f.backOf && (f.id === c.backOf || (f.id.startsWith(c.backOf + "-") && /-\d+x\d+$/.test(f.id))));
    return of.map((f, i) => ({ ...c, id: i ? `${c.id}-${f.tile!.w}x${f.tile!.h}` : c.id, backOf: f.id, qty: f.qty, tile: { ...c.tile!, w: f.tile!.w, h: f.tile!.h } }));
  });
}
