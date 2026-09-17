// One recorded game, for the map editor's Sim view: every hero turn and DM phase as a frame.
// Plays on the map it is given (the editor's copy, saved or not) with the same party sampling
// and ruleset the batch reports use, so a replay is one draw from the numbers in the report.
import { Game, type Frame, type Result } from "./engine";
import { toFloorDef, type MapFile } from "./mapfile";
import { RECOMMENDED, optionalRooms, sampleFloor1, sampleFloor2 } from "./presets";
import { RNG } from "./rng";
import { jevBrain } from "./brains/jev";

export type Replay = {
  seed: number; floor: 1 | 2;
  brain: "rules" | "jev";
  party: { names: string[]; kits: string[] | null; optionalRooms: { id: number; name: string }[] };
  result: Result;
  frames: Frame[];
};

function setup(map: MapFile, floor: 1 | 2, seed: number) {
  const def = toFloorDef(map);
  const rng = new RNG(seed);
  // Floor 1's side rooms are the report's fixed list when the map still has them; an edited map uses its own.
  const opt = optionalRooms(def);
  const base = floor === 2
    ? sampleFloor2(rng, {}, 0, opt)
    : sampleFloor1(rng, RECOMMENDED, 0, [3, 4, 6, 7, 8].every(id => opt.includes(id)) ? [3, 4, 6, 7, 8] : opt);
  const g = new Game({ ...base, seed, floor, floorDef: def, record: true });
  const party: Replay["party"] = {
    names: g.heroes.map(h => h.name),
    kits: floor === 1 ? g.cfg.kits : null,
    optionalRooms: g.cfg.optionalRooms.map(id => ({ id, name: def.rooms.find(r => r.id === id)?.name ?? `Room ${id}` })),
  };
  return { g, party };
}

export function replay(map: MapFile, floor: 1 | 2, seed: number): Replay {
  const { g, party } = setup(map, floor, seed);
  const result = g.run();
  return { seed, floor, brain: "rules", party, result, frames: g.frames };
}

/** The same game with the heroes played by Jev as the real family. Frames arrive through `onFrame` as they are decided. */
export async function replayJev(map: MapFile, floor: 1 | 2, seed: number, o: {
  apiKey: string; signal?: AbortSignal; personality?: number;
  onStart: (meta: Omit<Replay, "result" | "frames">) => void; onFrame: (f: Frame) => void;
}): Promise<Result> {
  const { g, party } = setup(map, floor, seed);
  o.onStart({ seed, floor, brain: "jev", party });
  g.onFrame = o.onFrame;
  return g.runAsync(jevBrain({ apiKey: o.apiKey, signal: o.signal, personality: o.personality, cacheDir: new URL("../.cache/jev", import.meta.url).pathname }));
}

if (import.meta.main) {
  // bun run src/replay.ts <seed> <floor> [jev]
  const floor = Number(process.argv[3] ?? 1) as 1 | 2;
  const seed = Number(process.argv[2] ?? 1);
  const map = await Bun.file(new URL(`./content/floor${floor}.map.json`, import.meta.url).pathname).json() as MapFile;
  const show = (f: Frame) => {
    console.log(`\n-- round ${f.round} ${f.phase}${f.who ? " " + f.who : ""}`);
    const d = f.decision;
    if (d) console.log(`   [jev ${d.ms}ms${d.cached ? " cached" : ""}${d.error ? " ERROR " + d.error : ""}] ${d.options.slice(0, 4).map(o => `${o.key} ${(o.p * 100).toFixed(0)}%`).join(", ")} | tension ${d.tension?.toFixed(1)}`);
    for (const l of f.lines) console.log("   " + l);
  };
  if (process.argv[4] === "jev") {
    const t0 = performance.now();
    const key = process.env.TYPESAFE_API_KEY ?? (await Bun.file(new URL("../../.typesafe.key", import.meta.url).pathname).text()).trim();
    const result = await replayJev(map, floor, seed, { apiKey: key, onStart: () => {}, onFrame: show });
    console.log(`\n${result.outcome} in ${result.rounds} rounds (${((performance.now() - t0) / 1000).toFixed(1)}s)`);
  } else {
    const r = replay(map, floor, seed);
    r.frames.forEach(show);
    console.log(`\n${r.result.outcome} in ${r.result.rounds} rounds, ${r.frames.length} frames, ${JSON.stringify(r).length} bytes`);
  }
}
