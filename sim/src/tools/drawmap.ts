import { Board, SOLID, CORRIDOR } from "../board";
import { FLOOR1 } from "../content/floor1-map";
import { FLOOR2 } from "../content/floor2";
const FLOOR = process.argv[2] === "2" ? FLOOR2 : FLOOR1;

const b = new Board(FLOOR);
// Render at 2x so wall EDGES and doors are visible between cells.
const W = b.w * 2 + 1, H = b.h * 2 + 1;
const g: string[][] = Array.from({ length: H }, () => Array(W).fill(" "));

const cellChar = (x: number, y: number) => {
  const r = b.regionAt(x, y);
  if (r === SOLID) return "█";
  if (b.blocked[b.idx(x, y)]) return "F";
  if (FLOOR.entrance.x === x && FLOOR.entrance.y === y) return "@";
  for (const rm of FLOOR.rooms)
    if (rm.interact && rm.interact.at.x === x && rm.interact.at.y === y && rm.interact.what.kind === "stairs") return "X";
  for (const rm of FLOOR.rooms)
    if (rm.trap && rm.trap.at.x === x && rm.trap.at.y === y) return rm.trap.kind === "pit" ? "o" : "^";
  for (const t of FLOOR.corridorTraps) if (t.at.x === x && t.at.y === y) return t.kind === "pit" ? "o" : "^";
  if (r === CORRIDOR) return "·";
  return String(r);
};

for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
  g[y * 2 + 1][x * 2 + 1] = cellChar(x, y);
  // walls to the east and south
  for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
    const nx = x + dx, ny = y + dy;
    const a = b.regionAt(x, y), c = b.regionAt(nx, ny);
    const d = b.door({ x, y }, { x: nx, y: ny });
    let ch = " ";
    if (d) ch = d.kind === "secret" ? "s" : d.kind === "locked" ? "L" : d.trap ? "B" : "D";
    else if (a === SOLID && c === SOLID) ch = " ";
    else if (a !== c) ch = dx ? "│" : "─";
    g[y * 2 + 1 + dy][x * 2 + 1 + dx] = ch;
  }
}
console.log(g.map(r => r.join("")).join("\n"));
console.log(`
legend  digits=room id  ·=corridor  █=solid  F=furniture  @=entrance  X=stairs
        o=pit  ^=spear  D=door  L=locked  s=secret  B=falling-block door`);
