// One recorded game, for the map editor's Sim view: every hero turn and DM phase as a frame.
// Plays on the map it is given (the editor's copy, saved or not) with the same party sampling
// and ruleset the batch reports use, so a replay is one draw from the numbers in the report.
import { Game, type Frame, type Result } from "./engine";
import { toFloorDef, type MapFile } from "./mapfile";
import { RECOMMENDED, optionalRooms, sampleFloor1, sampleFloor2 } from "./presets";
import { RNG } from "./rng";

export type Replay = {
  seed: number; floor: 1 | 2;
  party: { names: string[]; kits: string[] | null; optionalRooms: { id: number; name: string }[] };
  result: Result;
  frames: Frame[];
};

export function replay(map: MapFile, floor: 1 | 2, seed: number): Replay {
  const def = toFloorDef(map);
  const rng = new RNG(seed);
  // Floor 1's side rooms are the report's fixed list when the map still has them; an edited map uses its own.
  const opt = optionalRooms(def);
  const base = floor === 2
    ? sampleFloor2(rng, {}, 0, opt)
    : sampleFloor1(rng, RECOMMENDED, 0, [3, 4, 6, 7, 8].every(id => opt.includes(id)) ? [3, 4, 6, 7, 8] : opt);
  const g = new Game({ ...base, seed, floor, floorDef: def, record: true });
  const result = g.run();
  return {
    seed, floor,
    party: {
      names: g.heroes.map(h => h.name),
      kits: floor === 1 ? g.cfg.kits : null,
      optionalRooms: g.cfg.optionalRooms.map(id => ({ id, name: def.rooms.find(r => r.id === id)?.name ?? `Room ${id}` })),
    },
    result, frames: g.frames,
  };
}

if (import.meta.main) {
  const floor = Number(process.argv[3] ?? 1) as 1 | 2;
  const map = await Bun.file(new URL(`./content/floor${floor}.map.json`, import.meta.url).pathname).json() as MapFile;
  const r = replay(map, floor, Number(process.argv[2] ?? 1));
  for (const f of r.frames) {
    console.log(`\n-- round ${f.round} ${f.phase}${f.who ? " " + f.who : ""}`);
    for (const l of f.lines) console.log("   " + l);
  }
  console.log(`\n${r.result.outcome} in ${r.result.rounds} rounds, ${r.frames.length} frames, ${JSON.stringify(r).length} bytes`);
}
