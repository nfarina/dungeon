export type MonsterDef = {
  id: string; name: string;
  atk: number; def: number; hp: number; mind: number; move: number;
  loot: (d6: number) => "none" | "pockets" | "gear" | "big";
  undead?: boolean;   // immune to Sleep
  boss?: boolean;
  /** Floor 2: the corpse tile this monster leaves. Janitors leave none. */
  size?: "small" | "medium" | "large";
  /** Floor 2: "grub" ignores heroes and hunts corpses; "fed" is a grub that ate one and now hunts heroes. */
  janitor?: "grub" | "fed";
  /** Floor 2: the Shift Lead carries the boss-door password. */
  password?: boolean;
};

export const MONSTERS: Record<string, MonsterDef> = {
  goblin: { id: "goblin", name: "Goblin", atk: 2, def: 1, hp: 1, mind: 1, move: 10,
    loot: d => (d <= 3 ? "none" : "pockets") },
  orc: { id: "orc", name: "Orc", atk: 3, def: 2, hp: 1, mind: 2, move: 8,
    loot: d => (d <= 2 ? "none" : d <= 5 ? "pockets" : "gear") },
  skeleton: { id: "skeleton", name: "Skeleton", atk: 2, def: 2, hp: 1, mind: 0, move: 6, undead: true,
    loot: d => (d <= 4 ? "none" : "pockets") },
  zombie: { id: "zombie", name: "Zombie", atk: 2, def: 3, hp: 1, mind: 0, move: 5, undead: true,
    loot: d => (d <= 3 ? "none" : d <= 5 ? "pockets" : "gear") },
  abomination: { id: "abomination", name: "Abomination", atk: 3, def: 3, hp: 2, mind: 3, move: 6,
    loot: d => (d <= 3 ? "gear" : "big") },
  boss: { id: "boss", name: "The Floor Manager", atk: 3, def: 3, hp: 4, mind: 4, move: 6, boss: true,
    loot: () => "big" },
};

/** Floor 2 (floor-2.md section 4). Kept apart from MONSTERS so the Floor 1 card check stays honest. */
export const FLOOR2_MONSTERS: Record<string, MonsterDef> = {
  rat: { id: "rat", name: "Cave Rat", atk: 2, def: 1, hp: 1, mind: 1, move: 10, size: "small",
    loot: d => (d <= 3 ? "none" : "pockets") },
  kobold: { id: "kobold", name: "Kobold Miner", atk: 3, def: 2, hp: 1, mind: 2, move: 8, size: "medium",
    loot: d => (d <= 2 ? "none" : d <= 4 ? "pockets" : "gear") },
  bear: { id: "bear", name: "Cave Bear", atk: 3, def: 3, hp: 2, mind: 2, move: 6, size: "large",
    loot: d => (d <= 3 ? "gear" : "big") },
  shiftlead: { id: "shiftlead", name: "The Shift Lead", atk: 3, def: 3, hp: 2, mind: 3, move: 8, size: "medium", password: true,
    loot: () => "gear" },
  grub: { id: "grub", name: "Grub", atk: 0, def: 0, hp: 1, mind: 0, move: 4, janitor: "grub",
    loot: () => "none" },
  fedSmall: { id: "fedSmall", name: "Bloated Grub", atk: 2, def: 2, hp: 1, mind: 0, move: 6, janitor: "fed",
    loot: () => "none" },
  fedMedium: { id: "fedMedium", name: "Custodian", atk: 3, def: 3, hp: 2, mind: 0, move: 6, janitor: "fed",
    loot: () => "none" },
  fedLarge: { id: "fedLarge", name: "Facilities Manager", atk: 4, def: 3, hp: 3, mind: 0, move: 6, janitor: "fed",
    loot: () => "none" },
  custodian: { id: "custodian", name: "The Senior Custodian", atk: 4, def: 3, hp: 5, mind: 4, move: 6, boss: true,
    loot: () => "big" },
};
export const FED_FORM: Record<NonNullable<MonsterDef["size"]>, MonsterDef> = {
  small: FLOOR2_MONSTERS.fedSmall, medium: FLOOR2_MONSTERS.fedMedium, large: FLOOR2_MONSTERS.fedLarge,
};
export const ALL_MONSTERS: Record<string, MonsterDef> = { ...MONSTERS, ...FLOOR2_MONSTERS };
