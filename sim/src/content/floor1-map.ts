import type { FloorDef } from "../board";

// ---------------------------------------------------------------------------
// ASSUMPTION: this is a plausible HeroQuest-shaped 26x19 layout that satisfies
// floor-1.md's constraint (rooms 1, 2, 5, 9 on the path from entrance to exit;
// the other five branch off). It is NOT First Light's real Quest 1 map. Every
// distance-sensitive result depends on it, so retype the real map here once you
// have the board in front of you -- nothing else in the sim needs to change.
// `bun run map` prints an ASCII picture of whatever is in this file.
// ---------------------------------------------------------------------------

export const FLOOR1: FloorDef = {
  w: 26,
  h: 19,
  entrance: { x: 6, y: 0 },
  corridors: [
    { x0: 6, y0: 0, x1: 6, y1: 18 },    // west spine (vertical)
    { x0: 13, y0: 0, x1: 13, y1: 18 },  // middle spine (vertical)
    { x0: 20, y0: 0, x1: 20, y1: 12 },  // east spine (vertical)
    { x0: 0, y0: 6, x1: 25, y1: 6 },    // main hall (horizontal)
    { x0: 0, y0: 13, x1: 18, y1: 13 },  // lower hall (horizontal)
  ],
  corridorTraps: [{ at: { x: 6, y: 5 }, kind: "pit" }],
  rooms: [
    {
      id: 1, name: "Welcome Center", required: true,
      rect: { x0: 1, y0: 1, x1: 5, y1: 5 },
      monsters: ["goblin", "goblin"],
      furniture: [],
    },
    {
      id: 2, name: "Break Room", required: true,
      rect: { x0: 1, y0: 7, x1: 5, y1: 11 },
      monsters: ["orc", "goblin"],
      furniture: [{ x: 2, y: 9 }],
      interact: { at: { x: 2, y: 9 }, what: { kind: "table", deck: "pockets" } },
      trap: { at: { x: 3, y: 7 }, kind: "pit" },   // pit in the doorway
    },
    {
      id: 3, name: "Storage", required: false,
      rect: { x0: 15, y0: 1, x1: 19, y1: 5 },
      monsters: ["skeleton", "skeleton"],
      furniture: [{ x: 17, y: 3 }],
      interact: { at: { x: 17, y: 3 }, what: { kind: "chest", deck: "big", locked: true, noisy: true } },
    },
    {
      id: 4, name: "Goblin Daycare", required: false,
      rect: { x0: 8, y0: 1, x1: 12, y1: 5 },
      monsters: ["goblin", "goblin", "goblin"],
      furniture: [{ x: 10, y: 3 }],
    },
    {
      id: 5, name: "Armory", required: true,
      rect: { x0: 8, y0: 7, x1: 12, y1: 11 },
      monsters: ["orc", "zombie"],
      furniture: [{ x: 10, y: 9 }],
      interact: { at: { x: 10, y: 9 }, what: { kind: "rack", deck: "gear" } },
      trap: { at: { x: 10, y: 10 }, kind: "spear" }, // square in front of the rack
    },
    {
      id: 6, name: "The Cage", required: false,
      rect: { x0: 7, y0: 14, x1: 11, y1: 18 },
      monsters: ["abomination"],
      furniture: [{ x: 9, y: 16 }],
      interact: { at: { x: 9, y: 16 }, what: { kind: "cage" } },
    },
    {
      id: 7, name: "Latrine", required: false,
      rect: { x0: 1, y0: 14, x1: 4, y1: 18 },
      monsters: ["zombie", "zombie"],
      furniture: [{ x: 2, y: 16 }],
      interact: { at: { x: 2, y: 16 }, what: { kind: "toilet", deck: "pockets" } },
    },
    {
      id: 8, name: "Library", required: false,
      rect: { x0: 15, y0: 8, x1: 19, y1: 11 },
      monsters: ["skeleton", "goblin"],
      furniture: [{ x: 17, y: 9 }],
      interact: { at: { x: 17, y: 9 }, what: { kind: "shelf", deck: "gear", bigIfMind4: true } },
    },
    {
      id: 9, name: "Manager's Office", required: true,
      rect: { x0: 19, y0: 13, x1: 24, y1: 18 },
      monsters: ["boss", "orc", "orc"],
      furniture: [{ x: 21, y: 15 }],
      interact: { at: { x: 22, y: 16 }, what: { kind: "stairs" } },
    },
  ],
  doors: [
    { a: { x: 6, y: 3 }, b: { x: 5, y: 3 }, kind: "normal" },    // -> 1
    { a: { x: 3, y: 6 }, b: { x: 3, y: 7 }, kind: "normal" },    // -> 2
    { a: { x: 17, y: 6 }, b: { x: 17, y: 5 }, kind: "normal" },  // -> 3
    { a: { x: 9, y: 6 }, b: { x: 9, y: 5 }, kind: "normal" },    // -> 4
    { a: { x: 10, y: 6 }, b: { x: 10, y: 7 }, kind: "normal" },  // -> 5
    { a: { x: 9, y: 13 }, b: { x: 9, y: 14 }, kind: "normal" },  // -> 6
    { a: { x: 2, y: 13 }, b: { x: 2, y: 14 }, kind: "normal", trap: "block" }, // -> 7
    { a: { x: 20, y: 9 }, b: { x: 19, y: 9 }, kind: "normal" },  // -> 8
    { a: { x: 20, y: 12 }, b: { x: 20, y: 13 }, kind: "locked" }, // -> 9 front door
    { a: { x: 18, y: 13 }, b: { x: 19, y: 13 }, kind: "secret" }, // -> 9 shortcut
  ],
};
