export type MonsterDef = {
  id: string; name: string;
  atk: number; def: number; hp: number; mind: number; move: number;
  loot: (d6: number) => "none" | "pockets" | "gear" | "big";
  undead?: boolean;   // immune to Sleep
  boss?: boolean;
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
