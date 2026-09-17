// The on-disk map format.
//
// Two layers, because they change at different rates:
//
//   board — what is PRINTED on the cardboard. Corridors and every possible room
//           on the board side. Traced once; every floor built on this board side
//           reuses it untouched.
//   floor — this quest. Which possible rooms are in play (and what they're
//           called), which are filled with solid stone, plus doors, furniture
//           and traps.
//
// A possible room that this floor doesn't name is solid stone: on the table you
// put the black blocking tiles over it. There is no stone printed on the board.
//
// Rooms and corridors live in an ASCII grid so the map is readable in a text
// editor and paintable in the browser editor. Doors sit on EDGES between two
// squares, so they cannot live in the grid; each is named once, from its
// upper/left square, facing E or S.

import type { FloorDef, Interactable, Pt, RoomDef } from "./board";

export type Dir = "N" | "S" | "E" | "W";
export type MapDoor = { x: number; y: number; dir: Dir; kind: "normal" | "locked" | "secret"; trap?: "block" };
export type MapFeature = {
  x: number; y: number;
  kind: "entrance" | "stairs" | "chest" | "rack" | "table" | "shelf" | "toilet" | "cage" | "blocker";
  label?: string;
  /** Footprint in squares, anchored at the top-left (x, y). Default 1x1. */
  w?: number; h?: number;
};
/** A monster placed on a specific square. A room with any placed monsters spawns
 *  exactly those; a room with none scatters its `monsters` list at random. */
export type MapMonster = { x: number; y: number; id: string };
export const featureCells = (f: MapFeature): Pt[] => {
  const out: Pt[] = [];
  for (let dy = 0; dy < (f.h ?? 1); dy++) for (let dx = 0; dx < (f.w ?? 1); dx++) out.push({ x: f.x + dx, y: f.y + dy });
  return out;
};
export type MapTrap = { x: number; y: number; kind: "pit" | "spear" };

/** The printed board. Shared by every floor built on this board side. */
export type BoardDef = {
  name: string;
  w: number; h: number;
  /** One string per row. '.' corridor, 'A'-'Z''a'-'z' a possible room. */
  grid: string[];
};

/** One possible room, put into play by this floor and given a name. */
export type FloorRoom = {
  /** Which possible room on the printed board, by its grid letter. */
  at: string;
  id: number;
  name: string;
  required: boolean;
  monsters: string[];
  note?: string;
};

export type FloorSpec = {
  name: string;
  note?: string;
  /** Floor cap in rounds, for the DM view's countdown. */
  cap?: number;
  /** Rounds left when the boss door opens (Floor 1's Emergency Floor Reset). Absent = no reset. */
  fuse?: number;
  /** Basename of the floor's guidebook markdown, next to the sim folder (e.g. "floor-1" -> ../floor-1.md). */
  guide?: string;
  rooms: FloorRoom[];
  /** Extra solid stone laid over corridor squares (or part of a room). One
   *  string per row, 'x' = stone. Possible rooms this floor doesn't name are
   *  already stone and need not be listed here. */
  stone?: string[];
  doors: MapDoor[];
  features: MapFeature[];
  traps: MapTrap[];
  monsters?: MapMonster[];
  /** Announcer scripts, read from the DM view. Per floor, so the content machine writes them. */
  speeches?: { title: string; when?: string; lines: string[] }[];
};

export type MapFile = { board: BoardDef; floor: FloorSpec };

export const ROOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const isRoomChar = (c: string) => ROOM_CHARS.includes(c);

const DELTA: Record<Dir, Pt> = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };
export const doorCells = (d: MapDoor): [Pt, Pt] =>
  [{ x: d.x, y: d.y }, { x: d.x + DELTA[d.dir].x, y: d.y + DELTA[d.dir].y }];

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

/** Squares of one possible room. */
export function roomCells(m: MapFile, letter: string): Pt[] {
  const out: Pt[] = [];
  for (let y = 0; y < m.board.h; y++)
    for (let x = 0; x < m.board.w; x++)
      if (m.board.grid[y]?.[x] === letter) out.push({ x, y });
  return out;
}

/** Every possible room letter present on the printed board, in reading order. */
export function possibleRooms(m: MapFile): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const row of m.board.grid)
    for (const c of row) if (isRoomChar(c) && !seen.has(c)) { seen.add(c); out.push(c); }
  return out;
}

export const isStoned = (m: MapFile, x: number, y: number) => m.floor.stone?.[y]?.[x] === "x";

/**
 * Collapse the two layers into the single region grid the simulator's Board
 * wants: corridor, a numbered room, or stone.
 */
export function toFloorDef(m: MapFile): FloorDef {
  const byLetter = new Map(m.floor.rooms.map(r => [r.at, r]));
  // Board wants '1'-'9''A'-'Z' for room ids.
  const idChar = (id: number) => "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[id - 1] ?? "#";
  const regionRows: string[] = [];
  for (let y = 0; y < m.board.h; y++) {
    let row = "";
    for (let x = 0; x < m.board.w; x++) {
      const c = m.board.grid[y]?.[x] ?? ".";
      if (isStoned(m, x, y) || c === "#") { row += "#"; continue; }
      if (c === ".") { row += "."; continue; }
      const fr = byLetter.get(c);
      row += fr ? idChar(fr.id) : "#";
    }
    regionRows.push(row);
  }

  const open = (x: number, y: number) => regionRows[y]?.[x] !== undefined && regionRows[y][x] !== "#";
  const entrance = m.floor.features.find(f => f.kind === "entrance");

  const rooms: RoomDef[] = m.floor.rooms.map(r => {
    const cells = roomCells(m, r.at).filter(c => open(c.x, c.y));
    const xs = cells.map(c => c.x), ys = cells.map(c => c.y);
    const inRoom = (p: { x: number; y: number }) => m.board.grid[p.y]?.[p.x] === r.at;
    const feats = m.floor.features.filter(f => featureCells(f).some(inRoom));
    const interactive = feats.find(f => INTERACT[f.kind]);
    const trap = m.floor.traps.find(inRoom);
    const placed = (m.floor.monsters ?? []).filter(inRoom);
    return {
      id: r.id, name: r.name, required: r.required,
      monsters: placed.length ? placed.map(p => p.id) : r.monsters,
      spawns: placed.length ? placed.map(p => ({ x: p.x, y: p.y })) : undefined,
      rect: {
        x0: xs.length ? Math.min(...xs) : 0, y0: ys.length ? Math.min(...ys) : 0,
        x1: xs.length ? Math.max(...xs) : 0, y1: ys.length ? Math.max(...ys) : 0,
      },
      furniture: feats.filter(f => BLOCKS[f.kind]).flatMap(f => featureCells(f).filter(inRoom)),
      interact: interactive
        ? { at: { x: interactive.x, y: interactive.y }, cells: featureCells(interactive), what: INTERACT[interactive.kind]! }
        : undefined,
      trap: trap ? { at: { x: trap.x, y: trap.y }, kind: trap.kind } : undefined,
    };
  });

  const inAnyRoom = (p: MapMonster) => m.floor.rooms.some(r => m.board.grid[p.y]?.[p.x] === r.at);
  return {
    w: m.board.w, h: m.board.h,
    regionRows,
    corridorMonsters: (m.floor.monsters ?? []).filter(p => open(p.x, p.y) && !inAnyRoom(p)).map(p => ({ at: { x: p.x, y: p.y }, id: p.id })),
    entrance: entrance ? { x: entrance.x, y: entrance.y } : { x: 0, y: 0 },
    corridors: [],
    rooms,
    doors: m.floor.doors.map(d => {
      const [a, b] = doorCells(d);
      return { a, b, kind: d.kind, trap: d.trap };
    }),
    corridorTraps: m.floor.traps
      .filter(t => !isRoomChar(m.board.grid[t.y]?.[t.x] ?? "."))
      .map(t => ({ at: { x: t.x, y: t.y }, kind: t.kind })),
  };
}

/** Pretty-print: one line per grid row and per record, so diffs stay readable. */
export function formatMapJson(m: MapFile): string {
  return JSON.stringify(m, null, 2)
    .replace(/\[\n\s+("(?:[^"\\]|\\.)*"(?:,\n\s+"(?:[^"\\]|\\.)*")*)\n\s+\]/g,
      (_, body: string) => "[\n      " + body.split(/,\n\s+/).join(",\n      ") + "\n    ]")
    .replace(/\{\n\s+"x": (\d+),\n\s+"y": (\d+),([\s\S]*?)\n\s+\}/g,
      (_, x: string, y: string, rest: string) =>
        `{ "x": ${x}, "y": ${y}, ${rest.trim().replace(/\n\s+/g, " ")} }`) + "\n";
}
