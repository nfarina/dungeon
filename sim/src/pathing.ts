import { Board, NEIGHBORS, type Pt, SOLID } from "./board";

export type EdgePolicy = {
  openDoors: Uint8Array;           // by door index
  foundSecrets: Uint8Array;
  canOpenDoors: boolean;           // heroes yes, monsters no
  canUnlock: boolean;              // has key / axe / willing to knock
  occupied: (x: number, y: number) => boolean;   // cells that cannot be entered
  avoid?: (x: number, y: number) => boolean;     // soft-blocked (revealed traps)
};

export const ek = (a: Pt, b: Pt) => `${a.x},${a.y}|${b.x},${b.y}`;

/** e is the precomputed edge value: -1 wall, 0 free, otherwise doorIndex+1. */
export function edgeOk(board: Board, e: number, p: EdgePolicy): boolean {
  if (e < 0) return false;
  if (e === 0) return true;
  const di = e - 1;
  if (p.openDoors[di]) return true;
  const d = board.doors[di];
  if (d.kind === "secret") return !!p.foundSecrets[di] && p.canOpenDoors;
  if (d.kind === "locked") return p.canOpenDoors && p.canUnlock;
  return p.canOpenDoors;              // normal closed door: heroes open it for free
}

export function edgePassable(board: Board, a: Pt, b: Pt, p: EdgePolicy): boolean {
  const k = board.dirOf(a, b);
  if (k < 0) return false;
  return edgeOk(board, board.edge[(board.idx(a.x, a.y) * 4) + k], p);
}

export type Field = { dist: Int32Array; prev: Int32Array };

/**
 * Dijkstra-ish BFS from one or more sources, cost 1 per square, avoid-cells 8.
 * Multi-source matters for furniture: a chest occupies an unwalkable square, so
 * "get to the chest" means "get to a square beside it".
 */
export function field(board: Board, from: Pt | Pt[], p: EdgePolicy): Field {
  const n = board.w * board.h;
  const dist = new Int32Array(n).fill(0x3fffffff);
  const prev = new Int32Array(n).fill(-1);
  // small-integer bucket queue
  const buckets: number[][] = [];
  const push = (i: number, d: number) => { (buckets[d] ||= []).push(i); };
  for (const f of Array.isArray(from) ? from : [from]) {
    const s = board.idx(f.x, f.y);
    if (dist[s] === 0) continue;
    dist[s] = 0;
    push(s, 0);
  }
  for (let d = 0; d < buckets.length; d++) {
    const b = buckets[d];
    if (!b) continue;
    for (let qi = 0; qi < b.length; qi++) {
      const cur = b[qi];
      if (dist[cur] !== d) continue;
      const cx = cur % board.w, cy = (cur - cx) / board.w;
      const base = cur * 4;
      for (let k = 0; k < 4; k++) {
        const nb = NEIGHBORS[k];
        const nx = cx + nb.x, ny = cy + nb.y;
        if (!edgeOk(board, board.edge[base + k], p)) continue;
        if (p.occupied(nx, ny)) continue;
        const w = p.avoid?.(nx, ny) ? 8 : 1;
        const ni = board.idx(nx, ny);
        if (d + w < dist[ni]) { dist[ni] = d + w; prev[ni] = cur; push(ni, d + w); }
      }
    }
  }
  return { dist, prev };
}

export function pathTo(board: Board, f: Field, target: Pt): Pt[] {
  const out: Pt[] = [];
  let i = board.idx(target.x, target.y);
  if (f.dist[i] >= 0x3fffffff) return out;
  while (i !== -1) {
    const x = i % board.w;
    out.push({ x, y: (i - x) / board.w });
    i = f.prev[i];
  }
  return out.reverse();
}

/** Line of sight between cell centres. Blocked by solid cells, furniture, closed doors. */
export function los(board: Board, a: Pt, b: Pt, openDoors: Uint8Array): boolean {
  if (a.x === b.x && a.y === b.y) return true;
  const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 8;
  let cx = a.x, cy = a.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = Math.round(a.x + (b.x - a.x) * t);
    const py = Math.round(a.y + (b.y - a.y) * t);
    if (px === cx && py === cy) continue;
    const dx = px - cx, dy = py - cy;
    if (dx !== 0 && dy !== 0) {
      // diagonal step: need one orthogonal route to be clear
      const viaA = seeThrough(board, { x: cx, y: cy }, { x: px, y: cy }, openDoors) &&
                   seeThrough(board, { x: px, y: cy }, { x: px, y: py }, openDoors);
      const viaB = seeThrough(board, { x: cx, y: cy }, { x: cx, y: py }, openDoors) &&
                   seeThrough(board, { x: cx, y: py }, { x: px, y: py }, openDoors);
      if (!viaA && !viaB) return false;
    } else if (!seeThrough(board, { x: cx, y: cy }, { x: px, y: py }, openDoors)) return false;
    cx = px; cy = py;
    if (cx === b.x && cy === b.y) return true;
  }
  return cx === b.x && cy === b.y;
}

function seeThrough(board: Board, a: Pt, b: Pt, openDoors: Uint8Array): boolean {
  if (!board.inBounds(b.x, b.y)) return false;
  if (board.blocked[board.idx(b.x, b.y)]) return false;
  const k = board.dirOf(a, b);
  if (k < 0) return false;
  const e = board.edge[(board.idx(a.x, a.y) * 4) + k];
  if (e < 0) return false;
  if (e === 0) return true;
  return !!openDoors[e - 1];
}
