// The rulesets and the "one evening" party samplers, kept free of CLI side effects so the
// map server can import them (importing run.ts runs its command line).
import { FLOOR2_CONFIG, type Config } from "./engine";
import { FLOOR2 } from "./content/floor2";
import { RNG } from "./rng";
import type { FloorDef } from "./board";

/** Floor 1 as we play it. `bun run src/run.ts report` measures this. */
export const RECOMMENDED: Partial<Config> = {
  lootRich: true, richRack: true, guaranteedSpellbook: true,
  collapseStart: "both", collapseRound: 22, collapseAfterDoor: 5,
  collapseMode: "soft", collapseGrace: 4, collapseEscalation: "gentle",
  bossHp: 4,
};

const FLOOR1_OPTIONAL = [3, 4, 6, 7, 8];
const KIT_NAMES = ["Slingshot", "HockeyStick", "Multitool", "SnackBag", "Glasses"];

/** Floor 1: one party sampled the way a real evening samples: random kits, random appetite for side rooms. */
export function sampleFloor1(rng: RNG, base: Partial<Config>, i: number, optional = FLOOR1_OPTIONAL): Partial<Config> {
  const kits = rng.shuffle([...KIT_NAMES]).slice(0, 3);
  const greed = rng.next();
  const nOpt = greed < 0.15 ? 0 : greed < 0.5 ? 1 : greed < 0.85 ? 2 : 3;
  const optionalRooms = rng.shuffle([...optional]).slice(0, nOpt);
  return { seed: 1000 + i * 7919, kits, optionalRooms, ...base };
}

/** Rooms a party may detour into: not required, not the stairs room. */
export const optionalRooms = (f: FloorDef) => f.rooms.filter(r => !r.required && r.interact?.what.kind !== "stairs").map(r => r.id);
const FLOOR2_OPTIONAL = optionalRooms(FLOOR2);

/** Floor 2: the real carry-over party, with a random appetite for side rooms. */
export function sampleFloor2(rng: RNG, base: Partial<Config>, i: number, optional = FLOOR2_OPTIONAL): Partial<Config> {
  const greed = rng.next();
  const nOpt = greed < 0.15 ? 1 : greed < 0.5 ? 2 : greed < 0.85 ? 3 : 4;
  const optionalRooms = rng.shuffle([...optional]).slice(0, nOpt);
  return { ...FLOOR2_CONFIG, seed: 1000 + i * 7919, optionalRooms, ...base };
}
