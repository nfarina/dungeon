// What actually gets used in a game of Floor 1?
import { Game, type Config } from "../engine";
import { RNG } from "../rng";
import { POCKETS, GEAR, BIG_GEAR } from "../content/items";

const ALL_OPTIONAL = [3, 4, 6, 7, 8];
const KITS = ["Slingshot", "HockeyStick", "Multitool", "SnackBag", "Glasses"];
const N = Number(process.argv[2] ?? 2000);
const base: Partial<Config> = process.argv[3] === "rec"
  ? { lootRich: true, richRack: true, guaranteedSpellbook: true, collapseStart: "both",
      collapseRound: 22, collapseAfterDoor: 5, collapseMode: "soft", collapseGrace: 5 }
  : {};

const rng = new RNG(99);
const drawn = { pockets: 0, gear: 0, big: 0 };
const ach = new Map<string, number>();
const held = new Map<string, number>();
const kitWins = new Map<string, { n: number; atk: number; def: number }>();
let learners = 0, mind4 = 0, mind4AndBook = 0, bigDraws = 0, secretFound = 0;
let atk = 0, def = 0, gold = 0, roomsCleared = 0;
const roomCleared = new Map<number, number>();
const roomLooted = new Map<number, number>();

const start = { pockets: POCKETS.length, gear: GEAR.length, big: BIG_GEAR.length };
const pulled = 3; // loot-box exclusives removed from the decks at setup (plus Spark, moved to the rack)

for (let i = 0; i < N; i++) {
  const kits = rng.shuffle([...KITS]).slice(0, 3);
  const greed = rng.next();
  const nOpt = greed < 0.15 ? 0 : greed < 0.5 ? 1 : greed < 0.85 ? 2 : 3;
  const g = new Game({ seed: 5000 + i * 7919, kits, optionalRooms: rng.shuffle([...ALL_OPTIONAL]).slice(0, nOpt), ...base });
  const deck0 = { pockets: g.decks.pockets.length, gear: g.decks.gear.length, big: g.decks.big.length };
  const r = g.run();
  drawn.pockets += deck0.pockets - g.decks.pockets.length;
  drawn.gear += deck0.gear - g.decks.gear.length;
  drawn.big += deck0.big - g.decks.big.length;
  bigDraws += deck0.big - g.decks.big.length;
  for (const a of g.achievements) ach.set(a, (ach.get(a) ?? 0) + 1);
  for (const h of g.heroes) {
    for (const it of g.items(h)) held.set(it.name, (held.get(it.name) ?? 0) + 1);
    atk += g.atk(h); def += g.def(h); gold += h.gold;
    if (g.mind(h) >= 4) mind4++;
  }
  kits.forEach((k, j) => {
    const h = g.heroes[j];
    const e = kitWins.get(k) ?? { n: 0, atk: 0, def: 0 };
    e.n++; e.atk += g.atk(h); e.def += g.def(h);
    kitWins.set(k, e);
  });
  for (const [id, rm] of g.board.rooms) {
    if (!g.monsters.some(m => m.alive && m.room === id)) roomCleared.set(id, (roomCleared.get(id) ?? 0) + 1);
    if (rm.interact && g.usedInteract.has(id)) roomLooted.set(id, (roomLooted.get(id) ?? 0) + 1);
  }
  if (r.learnedSpell) learners++;
  if (g.foundSecrets.some(x => x)) secretFound++;
  roomsCleared += r.roomsCleared;
}

const pc = (x: number) => `${((x / N) * 100).toFixed(1)}%`;
console.log(`\n=== CONTENT UTILISATION — ${N} games ${base.collapseRound ? "(recommended ruleset)" : "(as written)"} ===\n`);
console.log(`Deck sizes after pulling loot-box exclusives: pockets ${start.pockets}, gear ${start.gear - 3}, big ${start.big - 2}`);
console.log(`  (${pulled} cards are removed from the decks to fill envelopes, per section 7; Spark sits on the Armory rack)\n`);
console.log(`Cards drawn per game    pockets ${(drawn.pockets / N).toFixed(1)} of ${start.pockets}`);
console.log(`                        gear    ${(drawn.gear / N).toFixed(1)} of ${start.gear - 3}`);
console.log(`                        BIG     ${(drawn.big / N).toFixed(2)} of ${start.big - 2}   <-- the whole spellbook economy`);
console.log(`\nRooms cleared per game  ${(roomsCleared / N).toFixed(1)} of 9`);
console.log(`Gold per game           ${(gold / N).toFixed(1)}`);
console.log(`Hero ends floor with    ${(atk / (N * 3)).toFixed(2)} attack dice, ${(def / (N * 3)).toFixed(2)} defend dice (started 2 / 2)`);
console.log(`Somebody had Mind 4+    ${pc(mind4 / 3 * 3 / 3 * 3)} of hero-slots... (${(mind4 / N).toFixed(2)} heroes per game)`);
console.log(`Somebody LEARNED a spell ${pc(learners)}   <-- the Mind/Spellbook system's actual usage rate`);
console.log(`Secret door found       ${pc(secretFound)}`);

console.log(`\nPer-room: cleared / furniture used`);
for (const [id, rm] of new Game({}).board.rooms)
  console.log(`  ${String(id)} ${rm.name.padEnd(20)} cleared ${pc(roomCleared.get(id) ?? 0).padStart(6)}` +
    (rm.interact && rm.interact.what.kind !== "stairs" ? `   ${rm.interact.what.kind} used ${pc(roomLooted.get(id) ?? 0)}` : ""));

console.log(`\nAchievements earned:`);
for (const [k, v] of [...ach.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${k.padEnd(28)} ${pc(v)}`);

console.log(`\nMost-held items at the end of the floor (per game, 3 heroes):`);
for (const [k, v] of [...held.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14))
  console.log(`  ${k.padEnd(32)} ${(v / N).toFixed(2)}`);

console.log(`\nStarting kits — final attack / defend dice of the hero who took it:`);
for (const [k, v] of [...kitWins.entries()].sort((a, b) => (b[1].atk / b[1].n) - (a[1].atk / a[1].n)))
  console.log(`  ${k.padEnd(14)} atk ${(v.atk / v.n).toFixed(2)}  def ${(v.def / v.n).toFixed(2)}`);
console.log();
