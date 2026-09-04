// The on-disk map format.
//
// Rooms and corridors live in an ASCII grid so the map is readable in a text
// editor and paintable in the browser editor. Doors sit on EDGES between two
// squares, so they cannot live in the grid and are listed separately, each named
// by one cell plus a direction. Everything else that sits *on* a square --
// furniture, traps, the entrance, the stairs -- is a feature with its own data.

import type { FloorDef, Interactable, Pt, RoomDef } from "./board";

export type Dir = "N" | "S" | "E" | "W";
export type MapDoor = { x: number; y: number; dir: Dir; kind: "normal" | "locked" | "secret"; trap?: "block" };
export type MapFeature = {
  x: number; y: number;
  kind: "entrance" | "stairs" | "chest" | "rack" | "table" | "shelf" | "toilet" | "cage" | "blocker";
  label?: string;
};
export type MapTrap = { x: number; y: number; kind: "pit" | "spear" };
export type MapRoom = { id: number; name: string; required: boolean; monsters: string[]; note?: string };

export type MapFile = {
  name: string;
  /** Free text for the DM: what this floor is, how it opens. */
  note?: string;
  w: number; h: number;
  /** The printed board: one string per row. '#' stone, '.' corridor,
   *  '1'-'9''A'-'Z' room id. Trace this once per board side; floors reuse it. */
  grid: string[];
  /** Per-floor overlay marking squares that are out of play this quest.
   *  One string per row, 'x' = sealed. Absent means nothing is sealed. */
  sealed?: string[];
  rooms: MapRoom[];
  doors: MapDoor[];
  features: MapFeature[];
  traps: MapTrap[];
};

export const ROOM_CHARS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const charForRoom = (id: number) => ROOM_CHARS[id - 1] ?? "?";
export const roomForChar = (c: string) => {
  const i = ROOM_CHARS.indexOf(c);
  return i < 0 ? null : i + 1;
};

const DELTA: Record<Dir, Pt> = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };
export const doorCells = (d: MapDoor): [Pt, Pt] =>
  [{ x: d.x, y: d.y }, { x: d.x + DELTA[d.dir].x, y: d.y + DELTA[d.dir].y }];

/** Furniture squares block movement and line of sight. Stairs and the entrance don't. */
export const BLOCKS: Record<MapFeature["kind"], boolean> = {
  entrance: false, stairs: false, blocker: true,
  chest: true, rack: true, table: true, shelf: true, toilet: true, cage: true,
};

const INTERACT: Partial<Record<MapFeature["kind"], Interactable>> = {
  chest: { kind: "chest", deck: "big", locked: true, noisy: true },
  rack: { kind: "rack", deck: "gear" },
  table: { kind: "table", deck: "pockets" },
  shelf: { kind: "shelf", deck: "gear", bigIfMind4: true },
  toilet: { kind: "toilet", deck: "pockets" },
  cage: { kind: "cage" },
  stairs: { kind: "stairs" },
};

/** Turn the authored map into the shape the simulator's Board already expects. */
export const isSealed = (m: MapFile, x: number, y: number) => m.sealed?.[y]?.[x] === "x";

export function toFloorDef(m: MapFile): FloorDef {
  // A sealed square is stone as far as the simulator is concerned.
  const at = (x: number, y: number) => (isSealed(m, x, y) ? "#" : m.grid[y]?.[x] ?? "#");
  const entrance = m.features.find(f => f.kind === "entrance");

  const rooms: RoomDef[] = m.rooms.map(r => {
    const ch = charForRoom(r.id);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (at(x, y) !== ch) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const inRoom = (p: { x: number; y: number }) => at(p.x, p.y) === ch;
    const feats = m.features.filter(inRoom);
    const interactive = feats.find(f => INTERACT[f.kind]);
    const trap = m.traps.find(inRoom);
    return {
      id: r.id, name: r.name, required: r.required, monsters: r.monsters,
      rect: { x0: x0 === Infinity ? 0 : x0, y0: y0 === Infinity ? 0 : y0, x1: x1 === -Infinity ? 0 : x1, y1: y1 === -Infinity ? 0 : y1 },
      furniture: feats.filter(f => BLOCKS[f.kind]).map(f => ({ x: f.x, y: f.y })),
      interact: interactive ? { at: { x: interactive.x, y: interactive.y }, what: INTERACT[interactive.kind]! } : undefined,
      trap: trap ? { at: { x: trap.x, y: trap.y }, kind: trap.kind } : undefined,
    };
  });

  return {
    w: m.w, h: m.h,
    regionRows: m.grid,
    entrance: entrance ? { x: entrance.x, y: entrance.y } : { x: 0, y: 0 },
    corridors: [],
    rooms,
    doors: m.doors.map(d => {
      const [a, b] = doorCells(d);
      return { a, b, kind: d.kind, trap: d.trap };
    }),
    corridorTraps: m.traps
      .filter(t => roomForChar(at(t.x, t.y)) === null)
      .map(t => ({ at: { x: t.x, y: t.y }, kind: t.kind })),
  };
}

/** Pretty-print a map file: one line per grid row and per record, so git diffs
 *  and hand edits stay readable. */
export function formatMapJson(m: MapFile): string {
  const j = JSON.stringify(m, null, 2)
    .replace(/\[\n\s+("(?:[^"\\]|\\.)*"(?:,\n\s+"(?:[^"\\]|\\.)*")*)\n\s+\]/g,
      (_, body: string) => "[\n    " + body.split(/,\n\s+/).join(",\n    ") + "\n  ]")
    .replace(/\{\n\s+"x": (\d+),\n\s+"y": (\d+),([\s\S]*?)\n\s+\}/g,
      (_, x: string, y: string, rest: string) =>
        `{ "x": ${x}, "y": ${y}, ${rest.trim().replace(/\n\s+/g, " ")} }`);
  return j + "\n";
}
