// Floor 2 balance runner. `bun run src/floor2.ts report 2000`, `... sweep 1500`, `... brains 1500`.
// Kept apart from run.ts (Floor 1) because the questions are different: corpses, grubs, the password.
import { FLOOR2_CONFIG, simulate, type Config, type Result } from "./engine";
import { FLOOR2 } from "./content/floor2";
import { RNG } from "./rng";

const OPTIONAL = FLOOR2.rooms.filter(r => !r.required && r.interact?.what.kind !== "stairs").map(r => r.id);

/** One evening: a random appetite for side rooms. Kits don't apply; the party is the real one. */
function sample(rng: RNG, base: Partial<Config>, i: number): Partial<Config> {
  const greed = rng.next();
  const nOpt = greed < 0.15 ? 1 : greed < 0.5 ? 2 : greed < 0.85 ? 3 : 4;
  const optionalRooms = rng.shuffle([...OPTIONAL]).slice(0, nOpt);
  return { ...FLOOR2_CONFIG, seed: 1000 + i * 7919, optionalRooms, ...base };
}

export let LAST: Result[] = [];

export type Summary = ReturnType<typeof summarize>;
export function summarize(rs: Result[]) {
  const n = rs.length;
  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
  const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
  const wins = rs.filter(r => r.outcome === "win");
  const f2 = rs.map(r => r.f2!).filter(Boolean);
  return {
    n,
    win: wins.length / n,
    escape: rs.filter(r => r.outcome === "escaped-no-boss").length / n,
    collapsed: rs.filter(r => r.outcome === "collapsed").length / n,
    wiped: rs.filter(r => r.outcome === "wiped").length / n,
    stalled: rs.filter(r => r.outcome === "stalled").length / n,
    anyDead: rs.filter(r => r.heroesDead > 0).length / n,
    rounds: med(wins.map(r => r.rounds)),
    doorRound: avg(rs.map(r => r.doorRound).filter(x => x !== null) as number[]),
    passwordRound: avg(f2.map(x => x.passwordRound).filter(x => x !== null) as number[]),
    corpsesMade: avg(f2.map(x => x.corpsesMade)),
    cleaned: avg(f2.map(x => x.corpsesCleaned)),
    left: avg(f2.map(x => x.corpsesLeft)),
    fedSmall: avg(f2.map(x => x.janitorsFed.small)),
    fedMedium: avg(f2.map(x => x.janitorsFed.medium)),
    fedLarge: avg(f2.map(x => x.janitorsFed.large)),
    fedAny: f2.filter(x => x.janitorsFed.small + x.janitorsFed.medium + x.janitorsFed.large > 0).length / n,
    janitorsKilled: avg(f2.map(x => x.janitorsKilled)),
    chased: avg(f2.map(x => x.chasedRounds)),
    snacks: avg(f2.map(x => x.bossSnacks)),
    snackAny: f2.filter(x => x.bossSnacks > 0).length / n,
    bleachFound: avg(f2.map(x => x.bleachFound)),
    bleachUsed: avg(f2.map(x => x.bleachUsed)),
    bySpark: avg(f2.map(x => x.cleanedBy.spark)),
    byGoose: avg(f2.map(x => x.cleanedBy.goose)),
    kills: avg(rs.map(r => r.monstersKilled)),
    roomsOpened: avg(rs.map(r => r.roomsOpened)),
    capBound: rs.filter(r => r.collapseBegan !== null).length / n,
  };
}

export function batch(n: number, base: Partial<Config> = {}, seed = 42) {
  const rng = new RNG(seed);
  const rs: Result[] = [];
  for (let i = 0; i < n; i++) rs.push(simulate(sample(rng, base, i)));
  LAST = rs;
  return summarize(rs);
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const f1 = (x: number) => (Number.isNaN(x) ? " -- " : x.toFixed(1));

function report(s: Summary) {
  console.log(`outcome    win (boss dead, everyone out)      ${pct(s.win)}`);
  console.log(`           escaped without killing the boss ${pct(s.escape)}`);
  console.log(`           floor came down on somebody      ${pct(s.collapsed)}`);
  console.log(`           all three dead                   ${pct(s.wiped)}   stalled ${pct(s.stalled)}`);
  console.log(`           someone dies                     ${pct(s.anyDead)}`);
  console.log(`clock      rounds to finish, median ${f1(s.rounds)}   password round ${f1(s.passwordRound)}   boss door round ${f1(s.doorRound)}   collapse began ${pct(s.capBound)}`);
  console.log(`corpses    made ${f1(s.corpsesMade)}   cleaned ${f1(s.cleaned)} (spark ${f1(s.bySpark)}, goose ${f1(s.byGoose)})   left at the end ${f1(s.left)}   bleach found ${f1(s.bleachFound)} used ${f1(s.bleachUsed)}`);
  console.log(`janitors   fed: small ${f1(s.fedSmall)} medium ${f1(s.fedMedium)} large ${f1(s.fedLarge)}   games with any fed ${pct(s.fedAny)}   killed ${f1(s.janitorsKilled)}   rounds chased ${f1(s.chased)}`);
  console.log(`boss       snacks per game ${f1(s.snacks)}   games with a snack ${pct(s.snackAny)}`);
  console.log(`tour       kills ${f1(s.kills)}   rooms opened ${f1(s.roomsOpened)}`);
}

const row = (label: string, s: Summary) =>
  `${label.padEnd(30)} win ${pct(s.win).padStart(6)}  dead ${pct(s.anyDead).padStart(6)}  fed ${f1(s.fedSmall + s.fedMedium + s.fedLarge)}  chased ${f1(s.chased).padStart(4)}  snacks ${f1(s.snacks)}  rounds ${f1(s.rounds)}`;

if (import.meta.main) {
  const cmd = process.argv[2] ?? "report";
  const N = Number(process.argv[3] ?? 2000);
  if (cmd === "report") {
    console.log(`\n=== FLOOR 2 as written — ${N} runs ===\n`);
    report(batch(N));
  }
  if (cmd === "trace") {
    const seed = Number(process.argv[3] ?? 7);
    const rng = new RNG(seed);
    const r = simulate({ ...sample(rng, {}, seed), trace: true });
    console.log(`\n${r.outcome} in ${r.rounds} rounds; dead ${r.heroesDead}; corpses cleaned ${r.f2!.corpsesCleaned}, fed ${JSON.stringify(r.f2!.janitorsFed)}, snacks ${r.f2!.bossSnacks}`);
  }
  if (cmd === "brains") {
    console.log(`\n=== cleaner vs runner — ${N} runs each ===\n`);
    for (const cp of ["cleaner", "runner"] as const) console.log(row(cp, batch(N, { cleanPolicy: cp })));
    console.log(row("no grubs at all", batch(N, { grubCap: 0 })));
    console.log(row("no cap, cleaner", batch(N, { collapseRound: null })));
  }
  if (cmd === "sweep") {
    console.log(`\n=== dials — ${N} runs each ===\n`);
    for (const every of [1, 2, 3]) console.log(row(`grub every ${every}`, batch(N, { grubEvery: every })));
    for (const cap of [4, 6, 8]) console.log(row(`grub cap ${cap}`, batch(N, { grubCap: cap })));
    for (const mv of [5, 6, 8]) console.log(row(`fed move ${mv}`, batch(N, { fedMove: mv })));
    for (const c of [22, 26, 30]) console.log(row(`floor cap ${c}`, batch(N, { collapseRound: c })));
    console.log(row("no All Hands", batch(N, { allHands: false })));
    console.log(row("no Snack", batch(N, { bossSnack: false })));
  }
}
