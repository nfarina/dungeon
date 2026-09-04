// Validate the dice engine against the expectations written into floor-1.md 4.1.
import { RNG, rollSkulls, rollShields } from "../rng";

const rng = new RNG(7);
const N = 400000;

function killChance(attDice: number, defDice: number, hp = 1) {
  let k = 0;
  for (let i = 0; i < N; i++) {
    const d = Math.max(0, rollSkulls(rng, attDice) - rollShields(rng, defDice, true));
    if (d >= hp) k++;
  }
  return k / N;
}
function dmgPerAttack(attDice: number, heroDef: number) {
  let t = 0;
  for (let i = 0; i < N; i++) t += Math.max(0, rollSkulls(rng, attDice) - rollShields(rng, heroDef, false));
  return t / N;
}
function netVsBoss(attDice: number, bossDef: number) {
  let t = 0;
  for (let i = 0; i < N; i++) t += Math.max(0, rollSkulls(rng, attDice) - rollShields(rng, bossDef, true));
  return t / N;
}

const rows: [string, number, string][] = [
  ["Hero 2 dice kills a Goblin (def 1)", killChance(2, 1), "~67%"],
  ["Hero 2 dice kills an Orc (def 2)", killChance(2, 2), "~55% (plan) / 59% (true HQ math)"],
  ["Hero 2 dice kills a Skeleton (def 2)", killChance(2, 2), ""],
  ["Hero 2 dice kills a Zombie (def 3)", killChance(2, 3), ""],
  ["Goblin (2) damage per attack vs hero def 2", dmgPerAttack(2, 2), "~0.56"],
  ["Orc (3) damage per attack vs hero def 2", dmgPerAttack(3, 2), "~0.9"],
  ["Hero 2 dice net damage on Greg (def 3)", netVsBoss(2, 3), "~0.5"],
  ["Hero 2 dice net damage on Greg (def 4, Delegation)", netVsBoss(2, 4), ""],
  ["Hero 3 dice net damage on Greg (def 3)", netVsBoss(3, 3), ""],
  ["Hero 4 dice net damage on Greg (def 3)", netVsBoss(4, 3), ""],
];
console.log("\n=== dice engine vs floor-1.md 4.1 ===\n");
for (const [label, v, expect] of rows)
  console.log(`  ${label.padEnd(52)} ${v.toFixed(3).padStart(6)}   ${expect}`);
console.log();
