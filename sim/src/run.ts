import { simulate, type Config, type Result } from "./engine";
import { RNG } from "./rng";

const ALL_OPTIONAL = [3, 4, 6, 7, 8];
const KIT_NAMES = ["Slingshot", "HockeyStick", "Multitool", "SnackBag", "Glasses"];

export type Batch = {
  n: number;
  winRate: number; escapeRate: number; collapseRate: number; stallRate: number;
  bossKillRate: number;
  finishRounds: number[];          // rounds taken by runs that finished (boss dead + out)
  p: (q: number) => number;
  mean: number;
  meanDowns: number; meanRespawns: number; meanDead: number; wipeRate: number; anyDeadRate: number;
  meanBossRounds: number; meanHpAtBoss: number;
  closeRate: number;               // finished with <= 2 rounds to spare
  cakewalkRate: number;            // finished with >= 6 rounds to spare
  meanMargin: number;
  meanTraps: number; learnRate: number;
  nailbiter: number;               // won, but it was genuinely in doubt at the end
  inCollapseRate: number;          // got out with the ceiling already coming down
  meanFinalHp: number;
  meanLost: number;                // heroes left behind
  partialRate: number;             // floor came down, but somebody got out
  meanMinHp: number;               // lowest the party's total health ever got
  meanDoorRound: number;           // when they crack the Office open
  capBoundRate: number;            // the floor cap, not the fuse, set the deadline
  /** Rounds to spare before the FIRST tremor -- the moment pressure starts.
   *  This, not the final deadline, is what "comfortable" means at the table. */
  calmRate: number;                // out with >=5 rounds before the collapse began
  feltItRate: number;              // out during, or within 1 round of, the collapse
};

/** One party sampled the way a real evening samples: random kits, random appetite for side rooms. */
function sampleConfig(rng: RNG, base: Partial<Config>, i: number): Partial<Config> {
  const kits = rng.shuffle([...KIT_NAMES]).slice(0, 3);
  const greed = rng.next();
  const nOpt = greed < 0.15 ? 0 : greed < 0.5 ? 1 : greed < 0.85 ? 2 : 3;
  const optionalRooms = rng.shuffle([...ALL_OPTIONAL]).slice(0, nOpt);
  return { seed: 1000 + i * 7919, kits, optionalRooms, ...base };
}

export let LAST: Result[] = [];

export function batch(n: number, base: Partial<Config> = {}, seed = 42): Batch {
  const rng = new RNG(seed);
  const rs: Result[] = [];
  for (let i = 0; i < n; i++) rs.push(simulate(sampleConfig(rng, base, i)));
  LAST = rs;

  const fin = rs.filter(r => r.outcome === "win");
  const rounds = fin.map(r => r.rounds).sort((a, b) => a - b);
  const p = (q: number) => rounds.length ? rounds[Math.min(rounds.length - 1, Math.floor(q * rounds.length))] : NaN;
  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
  const margins = fin.map(r => r.margin).filter(m => m !== null) as number[];
  // Distance from the exit to the first tremor, not to the final deadline.
  const pressure = fin.map(r => (r.collapseScheduled === null ? Infinity : r.collapseScheduled - r.rounds));

  return {
    n,
    winRate: fin.length / n,
    escapeRate: rs.filter(r => r.outcome === "escaped-no-boss").length / n,
    collapseRate: rs.filter(r => r.outcome === "collapsed").length / n,
    stallRate: rs.filter(r => r.outcome === "stalled").length / n,
    bossKillRate: rs.filter(r => r.bossKilled).length / n,
    finishRounds: rounds,
    p, mean: avg(rounds),
    meanDowns: avg(rs.map(r => r.downs)),
    meanRespawns: avg(rs.map(r => r.respawns)),
    meanDead: avg(rs.map(r => r.heroesDead)),
    wipeRate: rs.filter(r => r.outcome === "wiped").length / n,
    anyDeadRate: rs.filter(r => r.heroesDead > 0).length / n,
    meanBossRounds: avg(rs.map(r => r.bossFightRounds).filter(x => x !== null) as number[]),
    meanHpAtBoss: avg(rs.map(r => r.heroHpAtBossKill).filter(x => x !== null) as number[]),
    closeRate: margins.length ? margins.filter(m => m <= 2).length / rs.length : 0,
    cakewalkRate: margins.length ? margins.filter(m => m >= 6).length / rs.length : 0,
    meanMargin: avg(margins),
    meanTraps: avg(rs.map(r => r.trapsTriggered)),
    learnRate: rs.filter(r => r.learnedSpell).length / n,
    nailbiter: fin.filter(r =>
      (r.margin !== null && r.margin <= 2) || r.inCollapse || r.finalPartyHp <= 5 ||
      (r.lastDownRound !== null && r.rounds - r.lastDownRound <= 2)).length / n,
    inCollapseRate: fin.filter(r => r.inCollapse).length / n,
    meanFinalHp: avg(fin.map(r => r.finalPartyHp)),
    meanLost: avg(rs.map(r => r.heroesLost)),
    calmRate: pressure.filter(m => m >= 5).length / n,
    feltItRate: fin.filter((r, i) => pressure[i] <= 1).length / n,
    partialRate: rs.filter(r => r.outcome === "collapsed" && r.heroesLost < 3).length / n,
    meanMinHp: avg(rs.map(r => r.minPartyHp)),
    meanDoorRound: avg(rs.map(r => r.doorRound).filter(x => x !== null) as number[]),
    capBoundRate: rs.filter(r => r.capBound).length / n,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const f1 = (x: number) => (Number.isNaN(x) ? " -- " : x.toFixed(1));

function histogram(xs: number[], width = 46) {
  if (!xs.length) return;
  const lo = xs[0], hi = xs[xs.length - 1];
  const counts = new Map<number, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  const max = Math.max(...counts.values());
  for (let r = lo; r <= hi; r++) {
    const c = counts.get(r) ?? 0;
    console.log(`  ${String(r).padStart(3)} | ${"█".repeat(Math.round((c / max) * width))} ${c}`);
  }
}

const cmd = process.argv[2] ?? "baseline";
const N = Number(process.argv[3] ?? 4000);

if (cmd === "baseline") {
  console.log(`\n=== NO TIMER — how long does the floor actually take? (${N} runs) ===\n`);
  const b = batch(N, { collapseRound: null });
  console.log(`boss killed        ${pct(b.bossKillRate)}`);
  console.log(`party wiped        ${pct(b.wipeRate)}   (all three dead — rule 1.4)`);
  console.log(`stalled >80 rounds ${pct(b.stallRate)}`);
  console.log(`rounds to clear    mean ${f1(b.mean)}  p10 ${b.p(0.10)}  p25 ${b.p(0.25)}  median ${b.p(0.5)}  p75 ${b.p(0.75)}  p90 ${b.p(0.90)}  p95 ${b.p(0.95)}`);
  console.log(`downs per game     ${f1(b.meanDowns)}   deaths ${f1(b.meanDead)}   at least one death ${pct(b.anyDeadRate)}`);
  console.log(`boss fight length  ${f1(b.meanBossRounds)} rounds   party HP left at kill ${f1(b.meanHpAtBoss)} / 18`);
  console.log(`traps eaten        ${f1(b.meanTraps)}   somebody learned a spell in ${pct(b.learnRate)}`);
  console.log(`\nrounds-to-finish distribution:`);
  histogram(b.finishRounds);
}

if (cmd === "sweep") {
  console.log(`\n=== COLLAPSE TIMER SWEEP (${N} runs per value) ===\n`);
  console.log("collapse |  win   escape  collapse |  close  cakewalk | margin  downs");
  console.log("---------|--------------------------|------------------|--------------");
  for (const c of [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 34]) {
    const b = batch(N, { collapseRound: c });
    console.log(
      `   ${String(c).padStart(2)}    | ${pct(b.winRate).padStart(6)} ${pct(b.escapeRate).padStart(6)} ${pct(b.collapseRate).padStart(8)}  |` +
      ` ${pct(b.closeRate).padStart(6)} ${pct(b.cakewalkRate).padStart(8)} | ${f1(b.meanMargin).padStart(5)}  ${f1(b.meanDowns)}`);
  }
  console.log(`\nwin = Greg dead AND everyone down the stairs before the collapse`);
  console.log(`escape = everyone got out but Greg lived (party bailed on the timer)`);
  console.log(`collapse = somebody was still on the floor when it came down`);
  console.log(`close = finished with <=2 rounds to spare   cakewalk = >=6 to spare`);
}

// ---------------------------------------------------------------------------

const row = (label: string, b: Batch) =>
  `${label.padEnd(34)} ${pct(b.winRate).padStart(6)} ${pct(b.escapeRate).padStart(7)} ${pct(b.collapseRate).padStart(8)} |` +
  ` ${pct(b.nailbiter).padStart(7)} ${pct(b.cakewalkRate).padStart(8)} | ${f1(b.meanFinalHp).padStart(5)} ${f1(b.meanDowns).padStart(5)} ${f1(b.meanLost).padStart(5)}`;

const HEAD = `${"variant".padEnd(34)}    win  escape collapse |   nail  cakewalk |    HP  downs  lost\n${"-".repeat(34)}------------------------------|------------------|--------------------`;

const row2 = (label: string, b: Batch) =>
  `${label.padEnd(26)} ${pct(b.winRate).padStart(6)} ${pct(b.collapseRate).padStart(8)} ${pct(b.wipeRate).padStart(6)} |` +
  ` ${pct(b.feltItRate).padStart(7)} ${pct(b.calmRate).padStart(6)} | ${f1(b.meanDead).padStart(5)} ${pct(b.anyDeadRate).padStart(7)} ${f1(b.meanDowns).padStart(5)}`;
const HEAD2 = `${"variant".padEnd(26)}    win collapse  wiped |  feltit   calm |  dead  ≥1dead downs\n${"-".repeat(26)}--------------------------|----------------|--------------------`;

if (cmd === "variants") {
  console.log(`\n=== RULE VARIANTS (${N} runs each) ===\n`);
  console.log(HEAD);
  const V: [string, Partial<Config>][] = [
    ["hard cliff @22", { collapseRound: 22 }],
    ["hard cliff @24", { collapseRound: 24 }],
    ["hard cliff @26", { collapseRound: 26 }],
    ["soft collapse from 18 (+5)", { collapseRound: 18, collapseMode: "soft", collapseGrace: 5 }],
    ["soft collapse from 20 (+5)", { collapseRound: 20, collapseMode: "soft", collapseGrace: 5 }],
    ["soft collapse from 22 (+5)", { collapseRound: 22, collapseMode: "soft", collapseGrace: 5 }],
    ["soft from 20, hidden timer", { collapseRound: 20, collapseMode: "soft", collapseGrace: 5, timerKnown: false }],
    ["boss-door fuse: 5 rounds", { collapseStart: "bossdoor", collapseAfterDoor: 5, collapseRound: 99 }],
    ["boss-door fuse: 7 rounds", { collapseStart: "bossdoor", collapseAfterDoor: 7, collapseRound: 99 }],
    ["boss-door fuse: 9 rounds", { collapseStart: "bossdoor", collapseAfterDoor: 9, collapseRound: 99 }],
    ["boss-door fuse 7, soft (+4)", { collapseStart: "bossdoor", collapseAfterDoor: 7, collapseMode: "soft", collapseGrace: 4, collapseRound: 99 }],
    ["no Fan deck (viewers idle)", { collapseRound: 22, fanDeck: false }],
  ];
  for (const [label, cfg] of V) console.log(row(label, batch(N, cfg)));
  console.log(`\nnail = won but it was in doubt (<=2 rounds spare, or out during the collapse,`);
  console.log(`       or <=5 party HP left, or someone was down in the last 2 rounds)`);
  console.log(`HP   = total party health at the stairs, out of 18`);
}

if (cmd === "fuse") {
  console.log(`\n=== BOSS-DOOR FUSE LENGTH (${N} runs each) ===\n`);
  console.log(HEAD);
  for (const k of [4, 5, 6, 7, 8, 9, 10, 12])
    console.log(row(`fuse ${k} rounds (hard)`, batch(N, { collapseStart: "bossdoor", collapseAfterDoor: k, collapseRound: 99 })));
  console.log();
  for (const k of [3, 4, 5, 6, 7, 8])
    console.log(row(`fuse ${k} + soft grace 4`, batch(N, { collapseStart: "bossdoor", collapseAfterDoor: k, collapseMode: "soft", collapseGrace: 4, collapseRound: 99 })));
}

if (cmd === "twoclock") {
  console.log(`\n=== TWO CLOCKS: generous floor cap + short fuse on the Office door (${N} runs) ===\n`);
  console.log(HEAD);
  for (const cap of [22, 26, 30, 99])
    for (const fuse of [5, 6, 7, 8])
      console.log(row(`cap ${cap === 99 ? "none" : cap}, door fuse ${fuse}`,
        batch(N, { collapseStart: "both", collapseRound: cap === 99 ? null : cap, collapseAfterDoor: fuse })));
}

if (cmd === "boss") {
  console.log(`\n=== GREG'S HEALTH, under cap 26 + door fuse 7 (${N} runs) ===\n`);
  console.log(HEAD);
  for (const hp of [4, 5, 6, 7, 8])
    console.log(row(`Greg ${hp} HP`, batch(N, { collapseStart: "both", collapseRound: 26, collapseAfterDoor: 7, bossHp: hp })));
  console.log(`\n--- and with no timer at all, for reference ---`);
  for (const hp of [4, 6, 8]) {
    const b = batch(N, { bossHp: hp });
    console.log(`Greg ${hp} HP: clears in ${f1(b.mean)} rounds, boss fight ${f1(b.meanBossRounds)} rounds, ${f1(b.meanHpAtBoss)}/18 party HP left at the kill`);
  }
}

if (cmd === "final") {
  console.log(`\n=== CANDIDATE RULESETS (${N} runs each) ===\n`);
  console.log(HEAD);
  const V: [string, Partial<Config>][] = [
    ["A. no timer (as written)", {}],
    ["B. hard cliff @22", { collapseRound: 22 }],
    ["C. cap 26 + door fuse 7", { collapseStart: "both", collapseRound: 26, collapseAfterDoor: 7 }],
    ["D. C + soft collapse (+4)", { collapseStart: "both", collapseRound: 26, collapseAfterDoor: 7, collapseMode: "soft", collapseGrace: 4 }],
    ["E. D + Greg 6 HP", { collapseStart: "both", collapseRound: 26, collapseAfterDoor: 7, collapseMode: "soft", collapseGrace: 4, bossHp: 6 }],
    ["F. E + no Fan deck", { collapseStart: "both", collapseRound: 26, collapseAfterDoor: 7, collapseMode: "soft", collapseGrace: 4, bossHp: 6 }],
  ];
  for (const [label, cfg] of V) console.log(row(label, batch(N, cfg)));
}

if (cmd === "grid") {
  console.log(`\n=== GREG'S HEALTH x FUSE LENGTH (no floor cap, ${N} runs each) ===\n`);
  console.log(HEAD2);
  for (const hp of [4, 6, 8, 10]) {
    for (const fuse of [8, 10, 12, 14])
      console.log(row2(`Greg ${hp} HP, fuse ${fuse}`,
        batch(N, { collapseStart: "bossdoor", collapseAfterDoor: fuse, bossHp: hp, collapseRound: null })));
    console.log();
  }
  console.log(`partial = the floor came down but at least one hero made it to the stairs`);
  console.log(`lowHP   = the lowest the party's combined health ever got (out of 18)`);
}

if (cmd === "tuned") {
  console.log(`\n=== TUNED CANDIDATES (${N} runs each) ===\n`);
  console.log(HEAD2);
  const rich = { lootRich: true, richRack: true, guaranteedSpellbook: true };
  const V: [string, Partial<Config>][] = [
    ["as written, no timer", {}],
    ["+ loot fixes only", { ...rich }],
    ["cliff 22 + loot", { ...rich, collapseRound: 22 }],
    ["fuse 10, Greg 6", { ...rich, collapseStart: "bossdoor", collapseAfterDoor: 10, bossHp: 6, collapseRound: null }],
    ["fuse 12, Greg 8", { ...rich, collapseStart: "bossdoor", collapseAfterDoor: 12, bossHp: 8, collapseRound: null }],
    ["fuse 14, Greg 10", { ...rich, collapseStart: "bossdoor", collapseAfterDoor: 14, bossHp: 10, collapseRound: null }],
    ["cap26 fuse12 Greg8", { ...rich, collapseStart: "both", collapseRound: 26, collapseAfterDoor: 12, bossHp: 8 }],
    ["cap26 fuse12 Greg8 soft", { ...rich, collapseStart: "both", collapseRound: 26, collapseAfterDoor: 12, bossHp: 8, collapseMode: "soft", collapseGrace: 3 }],
  ];
  for (const [label, cfg] of V) console.log(row2(label, batch(N, cfg)));
}

if (cmd === "softfuse") {
  console.log(`\n=== SHORT FUSE + SURVIVABLE COLLAPSE (${N} runs each) ===\n`);
  console.log(`Greg hits the reset when you open the Office. When the count hits zero the`);
  console.log(`ceiling starts coming down: 1 damage to everyone still on the floor that`);
  console.log(`round, 2 the next, 3 the next... until the grace runs out.\n`);
  console.log(HEAD2);
  const rich = { lootRich: true, richRack: true, guaranteedSpellbook: true };
  for (const hp of [4, 6]) {
    for (const fuse of [5, 6, 7, 8])
      for (const grace of [3, 4, 5])
        console.log(row2(`Greg ${hp}, fuse ${fuse} +${grace} grace`, batch(N, {
          ...rich, collapseStart: "both", collapseRound: 26, collapseAfterDoor: fuse,
          collapseMode: "soft", collapseGrace: grace, bossHp: hp,
        })));
    console.log();
  }
  console.log(`feltit = got out during the collapse or with <=1 round before it started`);
  console.log(`calm   = got out with >=5 rounds before the first tremor (never felt it)`);
}

export const RECOMMENDED: Partial<Config> = {
  lootRich: true, richRack: true, guaranteedSpellbook: true,
  collapseStart: "both", collapseRound: 26, collapseAfterDoor: 5,
  collapseMode: "soft", collapseGrace: 4, collapseEscalation: "gentle",
  bossHp: 4,
};

if (cmd === "report") {
  const cfg = process.argv[4] === "aswritten" ? {} : RECOMMENDED;
  const b = batch(N, cfg);
  console.log(`\n=== ${process.argv[4] === "aswritten" ? "AS WRITTEN" : "RECOMMENDED RULESET"} — ${N} runs ===\n`);
  console.log(`outcome    win (Greg dead, everyone out)  ${pct(b.winRate)}`);
  console.log(`           escaped without killing Greg   ${pct(b.escapeRate)}`);
  console.log(`           floor came down on somebody    ${pct(b.collapseRate)}`);
  console.log(`           all three dead before that     ${pct(b.wipeRate)}`);
  console.log(`\ndrama      got out under the collapse     ${pct(b.feltItRate)}`);
  console.log(`           never felt the timer at all    ${pct(b.calmRate)}`);
  console.log(`           knockdowns per game            ${f1(b.meanDowns)}`);
  console.log(`           deaths per game                ${f1(b.meanDead)}  (a death in ${pct(b.anyDeadRate)} of games)`);
  console.log(`           lowest party HP (of 18)        ${f1(b.meanMinHp)}`);
  console.log(`           party HP at the stairs         ${f1(b.meanFinalHp)}`);
  console.log(`\nOffice opened on turn ${f1(b.meanDoorRound)} on average.`);
  console.log(`The floor-wide cap (not the door fuse) set the deadline in ${pct(b.capBoundRate)} of games.`);
  console.log(`\nrounds to finish: mean ${f1(b.mean)}  median ${b.p(0.5)}  p90 ${b.p(0.90)}`);
  histogram(b.finishRounds);
  const marg = LAST.filter(r => r.outcome === "win" && r.collapseScheduled !== null)
    .map(r => (r.collapseScheduled as number) - r.rounds).sort((a, b2) => a - b2);
  console.log(`\nrounds to spare when the last hero hit the stairs (negative = under the collapse):`);
  histogram(marg);
}

if (cmd === "escalation") {
  console.log(`\n=== HOW FAST SHOULD THE CEILING COME DOWN? (${N} runs each) ===\n`);
  console.log(HEAD2);
  const rich = { lootRich: true, richRack: true, guaranteedSpellbook: true, collapseStart: "both" as const,
    collapseRound: 26, collapseMode: "soft" as const };
  for (const esc of ["gentle", "steep"] as const)
    for (const [fuse, grace] of [[5, 5], [5, 4], [6, 4], [6, 5], [7, 4]])
      console.log(row2(`${esc.padEnd(6)} fuse ${fuse} +${grace}`,
        batch(N, { ...rich, collapseAfterDoor: fuse, collapseGrace: grace, collapseEscalation: esc })));
  console.log(`\ngentle = 1,1,2,2,3 damage per round of collapse`);
  console.log(`steep  = 1,2,3,4,5 damage per round of collapse`);
}

if (cmd === "competence") {
  console.log(`\n=== HOW MUCH DOES SKILL MOVE IT? (${N} runs each, recommended ruleset) ===\n`);
  console.log(HEAD2);
  console.log("  (no timer, so the clock can't swamp the difference)");
  for (const c of [0.3, 0.5, 0.7, 0.9, 1.0]) {
    const b = batch(N, { lootRich: true, richRack: true, guaranteedSpellbook: true, competence: c });
    console.log(`  competence ${c.toFixed(1)}   clears in ${f1(b.mean)} rounds   ` +
      `boss ${pct(b.bossKillRate)}   deaths/game ${f1(b.meanDead)}   downs ${f1(b.meanDowns)}   ` +
      `party HP at the kill ${f1(b.meanHpAtBoss)}`);
  }
  console.log();
  console.log(HEAD2);
  for (const c of [0.3, 0.7, 1.0])
    console.log(row2(`competence ${c.toFixed(1)} + clock`, batch(N, { ...RECOMMENDED, competence: c })));
  console.log(`\n0.3 = chaotic table   0.7 = the default   1.0 = always makes the smart play`);
  console.log(`Gates: kill Greg's Orcs first, spend Firebolt/Sleep/Energy Drink well, clutch heal.`);
}
