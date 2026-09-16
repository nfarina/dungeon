export type Slot = "main" | "off" | "body" | "head" | "feet" | "trinket" | "learned" | "pack";

export type Item = {
  name: string;
  slot: Slot;
  twoHanded?: boolean;
  atk?: number;        // extra attack dice
  def?: number;        // extra defend dice
  mind?: number;
  move?: number;
  // one-shot consumables
  use?: "heal3" | "heal4" | "heal1" | "energy" | "firecracker" | "firebolt" | "sleep" | "stoneskin" | "smokebomb"
    | "bleach"            // Floor 2: obliterate an adjacent corpse as your action
    | "restructuring"     // Floor 2: 4 dice at a monster in LOS, 1 damage to each monster adjacent to it; needs Mind 5
    | "lightsout";        // Floor 2: every monster in your room skips its next activation
  /** Scrolls that need more than "anyone" (Restructuring). */
  needMind?: number;
  /** Floor 2: the boss door opens for whoever carries this. */
  password?: boolean;
  /** Floor 2: Pet Biscuit. Sir Reginald gets Health 3, 2 dice, and soaks every attack on his person. */
  biscuit?: boolean;
  // persistent specials
  torch?: boolean;         // auto-reveal traps on room entry, finds secret doors
  rope?: boolean;          // pits cost nothing
  disarms?: number;        // charges of trap disarm
  unlocks?: number;        // charges of "open any locked thing"
  trapImmuneOnce?: boolean;
  reroll?: number;         // rerolls per floor
  goblinAversion?: boolean;
  koboldAversion?: boolean;   // Floor 2: Contractor Badge
  /** Floor 2: the Mop. Obliterate an adjacent corpse as your action, this many times, no bleach. */
  cleans?: number;
  ranged?: { dice: number; sidearm?: boolean };   // replaces melee attack, cannot hit adjacent; sidearm = shoot when out of reach, melee normally when adjacent
  bonusVs1hp?: number;
  spell?: { id: "spark" | "shove" | "patchup" | "nope" | "mopup" | "static"; cooldown: number };
  gold?: number;
  inert?: boolean;
  fragile?: boolean;       // Hockey Stick: snaps on a zero-skull attack
  capeOnce?: boolean;      // Sponsored Cape: once per floor, die -> Downed at 1 Health instead
  resetCd?: boolean;       // Bookmark: once per floor, set one cooldown die to 0
};

const g = (n: number): Item => ({ name: `Gold (${n})`, slot: "pack", gold: n, inert: true });

export const POCKETS: Item[] = [
  ...Array.from({ length: 4 }, () => ({ name: "Juice Box", slot: "pack" as Slot, use: "heal3" as const })),
  ...Array.from({ length: 2 }, () => ({ name: "Energy Drink", slot: "pack" as Slot, use: "energy" as const })),
  g(1), g(1), g(2), g(3),
  { name: "Firecracker", slot: "pack", use: "firecracker" },
  { name: "Bandage", slot: "pack", use: "heal1" },
  { name: "Rope", slot: "trinket", rope: true },
  { name: "Whistle of Doubtful Value", slot: "trinket", inert: true },
  { name: "Scroll: Sleep", slot: "pack", use: "sleep" },
  { name: "Scroll: Heal", slot: "pack", use: "heal4" },
];

export const GEAR: Item[] = [
  { name: "Broken Table Leg", slot: "main", atk: 1 },
  { name: "Kitchen Knife", slot: "main", bonusVs1hp: 1 },
  { name: "Trash Can Lid", slot: "off", def: 1 },
  { name: "Frying Pan", slot: "off", def: 1 },
  { name: "Goblin-Chewed Leather Jacket", slot: "body", def: 1 },
  { name: "Orc Monocle", slot: "head", mind: 1 },
  { name: "Stolen Sneakers", slot: "feet", move: 2 },
  { name: "Lucky Rabbit's Foot", slot: "trinket", reroll: 1 },
  { name: "Trap Kit", slot: "trinket", disarms: 3 },
  { name: "Torch", slot: "off", torch: true },
  { name: "Goblin Ear Necklace", slot: "trinket", goblinAversion: true },
  { name: "Scroll: Firebolt", slot: "pack", use: "firebolt" },
  { name: "Scroll: Stone Skin", slot: "pack", use: "stoneskin" },
  { name: "Scroll: Smoke Bomb", slot: "pack", use: "smokebomb" },
];

export const BIG_GEAR: Item[] = [
  { name: "Fire Axe", slot: "main", twoHanded: true, atk: 2, unlocks: 99 },
  { name: "Goblin Shortbow", slot: "main", twoHanded: true, ranged: { dice: 2 } },
  { name: "Orc Chainmail Bib", slot: "body", def: 2, move: -2 },
  { name: "Football Helmet", slot: "head", trapImmuneOnce: true },
  { name: "Skeleton Key", slot: "trinket", unlocks: 1 },
  { name: "Spellbook: Spark", slot: "learned", spell: { id: "spark", cooldown: 2 } },
  { name: "Spellbook: Shove", slot: "learned", spell: { id: "shove", cooldown: 2 } },
  { name: "Spellbook: Patch Up", slot: "learned", spell: { id: "patchup", cooldown: 3 } },
  { name: "Sponsored Cape", slot: "trinket", capeOnce: true },
];

export const EXTRA: Record<string, Item> = {
  "Spellbook: Nope": { name: "Spellbook: Nope", slot: "learned", spell: { id: "nope", cooldown: 3 } },
  "Bookmark": { name: "Bookmark", slot: "trinket", resetCd: true },
};

export const KITS: Record<string, Item[]> = {
  Slingshot: [{ name: "Slingshot", slot: "main", ranged: { dice: 1, sidearm: true } }],
  HockeyStick: [{ name: "Hockey Stick", slot: "main", atk: 1, fragile: true }],
  Multitool: [{ name: "Multitool", slot: "trinket", disarms: 2 }],
  SnackBag: [{ name: "Juice Box", slot: "pack", use: "heal3" }, { name: "Juice Box", slot: "pack", use: "heal3" }],
  Glasses: [{ name: "Homework Glasses", slot: "head", mind: 1 }],
};

export function clone(i: Item): Item { return JSON.parse(JSON.stringify(i)); }

// ---------------------------------------------------------------------------
// Floor 2 (floor-2.md section 6). New cards, and what is left of the Floor 1 decks
// once the party's hands, the shop and the retired cards are taken out.
// ---------------------------------------------------------------------------

export const FLOOR2_ITEMS: Record<string, Item> = {
  "Industrial Bleach": { name: "Industrial Bleach", slot: "pack", use: "bleach" },
  "Wizard's Bathrobe": { name: "Wizard's Bathrobe", slot: "body", mind: 1 },
  "Scroll: Restructuring": { name: "Scroll: Restructuring", slot: "pack", use: "restructuring", needMind: 5 },
  "Password of the Day": { name: "Password of the Day", slot: "pack", password: true, inert: true },
  "Pet Biscuit": { name: "Pet Biscuit", slot: "pack", biscuit: true, inert: true },
  "Orc Chainmail Bib": { name: "Orc Chainmail Bib", slot: "body", def: 2, move: -2 },
  "Goblin Shortbow": { name: "Goblin Shortbow", slot: "main", twoHanded: true, ranged: { dice: 2 } },
  "Leaf Blower": { name: "Leaf Blower", slot: "main", twoHanded: true },   // Trap Chef's prize; its Shove is not modelled
};

/** Floor 2 Gear deck additions (floor-2.md 6.2): basic +1 kit and two scrolls. */
export const FLOOR2_GEAR: Item[] = [
  { name: "Hard Hat", slot: "head", def: 1 },
  { name: "Steel-Toed Boots", slot: "feet", def: 1 },
  { name: "Wet Floor Sign", slot: "off", def: 1 },
  { name: "Hi-Vis Vest", slot: "body", def: 1 },
  { name: "Push Broom", slot: "main", atk: 1 },
  { name: "Mop", slot: "main", atk: 1, cleans: 1 },
  { name: "Contractor Badge", slot: "trinket", koboldAversion: true },
  { name: "Scroll: Lights Out", slot: "pack", use: "lightsout" },
];
/** Floor 2 Big Gear deck (floor-2.md 6.3). Leaf Blower's Shove and the Cattle Prod's stun are not modelled. */
export const FLOOR2_BIG_GEAR: Item[] = [
  { name: "Cattle Prod", slot: "main", atk: 1 },
  { name: "Spellbook: Static", slot: "learned", spell: { id: "static", cooldown: 3 } },
  { name: "Janitor's Keyring", slot: "trinket", unlocks: 3 },
  { name: "Spellbook: Mop-Up", slot: "learned", spell: { id: "mopup", cooldown: 2 } },
  { name: "Steel Lunchbox", slot: "pack", use: "heal3" },
];
/** Reprinted Floor 1 Pockets cards that go back into the Floor 2 deck (floor-2.md 6.1). */
export const FLOOR2_POCKETS_RESTOCK: Item[] = [
  { name: "Gold (2)", slot: "pack", gold: 2, inert: true }, { name: "Gold (2)", slot: "pack", gold: 2, inert: true },
  { name: "Bandage", slot: "pack", use: "heal1" }, { name: "Energy Drink", slot: "pack", use: "energy" },
];

const RETIRED = new Set(["Broken Table Leg", "Trash Can Lid", "Frying Pan", "Orc Monocle", "Torch", "Goblin Shortbow"]);
/** In someone's hands or bought at the shop, so not in a deck. */
const HELD = new Set(["Kitchen Knife", "Goblin Ear Necklace", "Scroll: Stone Skin", "Spellbook: Shove", "Spellbook: Patch Up",
  "Fire Axe", "Orc Chainmail Bib", "Football Helmet", "Skeleton Key", "Spellbook: Spark", "Sponsored Cape",
  "Bandage", "Whistle of Doubtful Value", "Scroll: Sleep"]);

export const FLOOR2_DECKS = {
  pockets: [...POCKETS.filter(i => !HELD.has(i.name)), ...FLOOR2_POCKETS_RESTOCK],
  gear: [...GEAR.filter(i => !RETIRED.has(i.name) && !HELD.has(i.name)), ...FLOOR2_GEAR],
  big: FLOOR2_BIG_GEAR,
};
