// Board model.
//
// The HeroQuest board is a plain grid. Rooms are rectangles; the leftover
// squares that are corridor are listed explicitly; everything else is solid
// (the black between rooms). Walls are EDGES, not squares, so distances match
// the real board. You may only cross a room boundary through a door.

export type Pt = { x: number; y: number };
export type Rect = { x0: number; y0: number; x1: number; y1: number };

export type DoorKind = "normal" | "locked" | "secret";
export type DoorDef = {
  a: Pt;            // cell on one side
  b: Pt;            // cell on the other side
  kind: DoorKind;
  trap?: "block";   // falling block trap on this door
};

export type Interactable =
  | { kind: "chest"; deck: "big"; locked: true; noisy: true }
  | { kind: "rack"; deck: "gear" }
  | { kind: "table"; deck: "pockets" }
  | { kind: "shelf"; deck: "gear"; bigIfMind4: true }
  | { kind: "toilet"; deck: "pockets" }
  | { kind: "cage" }
  | { kind: "stairs" };

export type RoomDef = {
  id: number;
  name: string;
  rect: Rect;
  required: boolean;
  monsters: string[];
  furniture: Pt[];                       // blocks movement + line of sight
  interact?: { at: Pt; what: Interactable };
  trap?: { at: Pt; kind: "pit" | "spear" };
};

export type FloorDef = {
  w: number;
  h: number;
  /** Authored region grid, one string per row: '#' solid, '.' corridor, room char.
   *  When present it wins over `corridors` + room rects, so rooms need not be
   *  rectangles. See mapfile.ts. */
  regionRows?: string[];
  corridors: Rect[];
  rooms: RoomDef[];
  doors: DoorDef[];
  entrance: Pt;
  corridorTraps: { at: Pt; kind: "pit" | "spear" }[];
};

export const SOLID = -2, CORRIDOR = -1;

const key = (x: number, y: number) => y * 1000 + x;
const edgeKey = (a: Pt, b: Pt) =>
  a.y * 1e9 + a.x * 1e6 + b.y * 1000 + b.x;

export class Board {
  readonly w: number;
  readonly h: number;
  readonly region: Int16Array;      // SOLID | CORRIDOR | roomId
  readonly blocked: Uint8Array;     // furniture
  readonly doorAt = new Map<number, DoorDef>(); // both directions
  readonly rooms = new Map<number, RoomDef>();
  readonly def: FloorDef;
  /** doors[i] is the i-th door; edge[] refers to them by index. */
  readonly doors: DoorDef[];
  /** edge[(y*w+x)*4 + dir]: -1 wall, 0 free, otherwise doorIndex+1. dir order = NEIGHBORS. */
  readonly edge: Int16Array;

  constructor(def: FloorDef) {
    this.def = def;
    this.w = def.w; this.h = def.h;
    this.region = new Int16Array(def.w * def.h).fill(SOLID);
    this.blocked = new Uint8Array(def.w * def.h);
    if (def.regionRows) {
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
        const c = def.regionRows[y]?.[x] ?? "#";
        const room = ROOM_CHARS.indexOf(c);
        this.region[y * def.w + x] = c === "." ? CORRIDOR : room >= 0 ? room + 1 : SOLID;
      }
      for (const r of def.rooms) this.rooms.set(r.id, r);
    } else {
      for (const c of def.corridors)
        for (let y = c.y0; y <= c.y1; y++)
          for (let x = c.x0; x <= c.x1; x++) this.region[y * def.w + x] = CORRIDOR;
      for (const r of def.rooms) {
        this.rooms.set(r.id, r);
        for (let y = r.rect.y0; y <= r.rect.y1; y++)
          for (let x = r.rect.x0; x <= r.rect.x1; x++) this.region[y * def.w + x] = r.id;
      }
    }
    for (const r of def.rooms) for (const f of r.furniture) this.blocked[f.y * def.w + f.x] = 1;
    this.doors = def.doors;
    const doorIdx = new Map<number, number>();
    def.doors.forEach((d, i) => {
      this.doorAt.set(edgeKey(d.a, d.b), d);
      this.doorAt.set(edgeKey(d.b, d.a), d);
      doorIdx.set(edgeKey(d.a, d.b), i);
      doorIdx.set(edgeKey(d.b, d.a), i);
    });
    this.edge = new Int16Array(def.w * def.h * 4).fill(-1);
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
      for (let k = 0; k < 4; k++) {
        const nx = x + NEIGHBORS[k].x, ny = y + NEIGHBORS[k].y;
        if (!this.inBounds(nx, ny)) continue;
        if (!this.isFloor(nx, ny) || !this.isFloor(x, y)) continue;
        const di = doorIdx.get(edgeKey({ x, y }, { x: nx, y: ny }));
        if (di !== undefined) this.edge[((y * def.w + x) * 4) + k] = di + 1;
        else if (this.region[y * def.w + x] === this.region[ny * def.w + nx]) this.edge[((y * def.w + x) * 4) + k] = 0;
      }
    }
  }

  doorIndex(a: Pt, b: Pt): number {
    const k = this.dirOf(a, b);
    if (k < 0) return -1;
    const e = this.edge[(this.idx(a.x, a.y) * 4) + k];
    return e > 0 ? e - 1 : -1;
  }
  dirOf(a: Pt, b: Pt): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    for (let k = 0; k < 4; k++) if (NEIGHBORS[k].x === dx && NEIGHBORS[k].y === dy) return k;
    return -1;
  }

  /** Every square belonging to a room, in reading order. */
  cellsOf(id: number): Pt[] {
    const out: Pt[] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
      if (this.region[y * this.w + x] === id) out.push({ x, y });
    return out;
  }

  /** A walkable square near the middle of a room -- where the party heads for. */
  center(id: number): Pt {
    const cells = this.cellsOf(id);
    if (!cells.length) return { x: 0, y: 0 };
    const cx = cells.reduce((a, c) => a + c.x, 0) / cells.length;
    const cy = cells.reduce((a, c) => a + c.y, 0) / cells.length;
    let best = cells[0], bd = Infinity;
    for (const c of cells) {
      if (!this.isFloor(c.x, c.y)) continue;
      const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  idx(x: number, y: number) { return y * this.w + x; }
  inBounds(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  regionAt(x: number, y: number) { return this.inBounds(x, y) ? this.region[this.idx(x, y)] : SOLID; }
  roomIdAt(p: Pt) { const r = this.regionAt(p.x, p.y); return r >= 0 ? r : null; }
  isFloor(x: number, y: number) { return this.inBounds(x, y) && this.region[this.idx(x, y)] !== SOLID && !this.blocked[this.idx(x, y)]; }
  door(a: Pt, b: Pt): DoorDef | undefined { return this.doorAt.get(edgeKey(a, b)); }
}

export const ROOM_CHARS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const NEIGHBORS: Pt[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
export const dist1 = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const adjacent = (a: Pt, b: Pt) => dist1(a, b) === 1;
export const same = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;
export { key, edgeKey };
