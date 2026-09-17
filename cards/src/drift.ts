// Rules drift: does each printed loot card still say what floor-1.md says it does?
// Code pairs cards with their design-doc row by name; TypeSafe (Jev) judges the meaning.
//   bun run src/drift.ts          # flagged cards only
//   bun run src/drift.ts --all    # every card with its raw numbers

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CARDS, ROOT, type Card } from "./catalog";

const REPO = join(ROOT, "..");
const KEY = (process.env.TYPESAFE_API_KEY ?? readFileSync(join(REPO, ".typesafe.key"), "utf8")).trim();
const showAll = process.argv.includes("--all");

// Rows of the 6.1-6.3 tables: | **Name** | Qty or Slot | Effect |
type DocRow = { section: string; name: string; middle: string; effect: string };
function docRows(): DocRow[] {
  const md = readFileSync(join(REPO, "floor-1.md"), "utf8");
  const rows: DocRow[] = [];
  let section = "";
  for (const line of md.split("\n")) {
    if (line.startsWith("### ")) section = line.slice(4);
    if (line.startsWith("## 7")) break;
    const m = line.match(/^\| \*\*(.+?)\*\* \| (.*?) \| (.+) \|$/);
    if (m && section.startsWith("6.")) rows.push({ section, name: m[1], middle: m[2], effect: m[3] });
  }
  return rows;
}

const noul = (question: string, yes: object, no: object) =>
  ({ type: "noul", instructions: question, criteria: { true: yes, false: no } });

const QUESTIONS = {
  contradicts: noul(
    "Does `card.rules` state a number, condition, or effect that conflicts with `design_doc.effect`?",
    { what: "The two disagree about how the card works", examples: ["Attack +1 vs Attack +2", "Heal 3 vs Heal 4", "one use vs three uses", "adjacent vs line of sight"] },
    { what: "Same mechanics, even if worded differently or shortened", not_for: "Jokes or designer commentary that appear in only one of them" },
  ),
  missing: noul(
    "Does `design_doc.effect` contain a game rule a player needs at the table that appears nowhere on the printed `card`?",
    { what: "A restriction, cost, target, duration, or bonus is missing from the printed card", examples: ["doc says 'Can't be used on an adjacent monster' but the card doesn't"] },
    { what: "Everything a player needs is printed", not_for: "Designer notes about balance, strategy tips, jokes, or instructions for the announcer" },
  ),
  extra: noul(
    "Does `card.rules` add a game rule that `design_doc.effect` does not mention?",
    { what: "The card grants or restricts something the design doc never describes" },
    { what: "Every rule on the card is covered by the design doc", not_for: "Clarifying wording such as when or where gold is spent" },
  ),
  clarity: {
    type: "score",
    instructions: "How well could an 11-year-old apply `card.rules` during a board game turn without asking the game master?",
    criteria: [
      "Confusing: key terms or timing are unclear, they would need to ask",
      "Mostly clear: one detail might prompt a question",
      "Clear: they could use it right away",
    ],
  },
};

type Answers = {
  contradicts: { noul: number }; missing: { noul: number }; extra: { noul: number };
  clarity: { score: number; confidence: number };
};

async function judge(card: Card, row: DocRow): Promise<Answers> {
  const state = {
    card: { name: card.name, slot: card.slot, mind_required: card.mind, cooldown: card.cooldown, rules: card.rules, flavor: card.flavor },
    design_doc: { name: row.name, effect: row.effect },
  };
  const res = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "jev-latest", state, questions: QUESTIONS }),
  });
  if (!res.ok) throw new Error(`${card.name}: HTTP ${res.status} ${await res.text()}`);
  return (await res.json()).answers;
}

const rows = docRows();
const loot = CARDS.filter(c => ["pockets", "gear", "biggear"].includes(c.deck) && (c.floor ?? 1) === 1);
const pairs: [Card, DocRow][] = [];
for (const card of loot) {
  const row = rows.find(r => r.name === card.name) ?? rows.find(r => card.name.startsWith(r.name + " ("));
  if (!row) console.log(`?  ${card.name}: no row in floor-1.md section 6`);
  else pairs.push([card, row]);
}
for (const row of rows) if (!loot.some(c => c.name === row.name || c.name.startsWith(row.name + " ("))) console.log(`?  ${row.name}: in floor-1.md but no card`);

const t0 = performance.now();
const results = await Promise.all(pairs.map(async ([card, row]) => ({ card, row, a: await judge(card, row) })));
const ms = performance.now() - t0;

const FLAG = 0.5;
let flagged = 0;
for (const { card, row, a } of results) {
  const issues = [
    a.contradicts.noul >= FLAG && `contradicts doc (${a.contradicts.noul.toFixed(2)})`,
    a.missing.noul >= FLAG && `missing a doc rule (${a.missing.noul.toFixed(2)})`,
    a.extra.noul >= FLAG && `adds a rule (${a.extra.noul.toFixed(2)})`,
    a.clarity.score < 1 && `may confuse kids (clarity ${a.clarity.score.toFixed(2)})`,
  ].filter(Boolean);
  if (issues.length) flagged++;
  if (!issues.length && !showAll) continue;
  console.log(`\n${issues.length ? "!" : " "} ${card.name}  ${issues.join(", ")}`);
  console.log(`    card: ${card.rules}`);
  console.log(`    doc:  ${row.effect}`);
  if (showAll) console.log(`    contradicts ${a.contradicts.noul.toFixed(2)}  missing ${a.missing.noul.toFixed(2)}  extra ${a.extra.noul.toFixed(2)}  clarity ${a.clarity.score.toFixed(2)} (conf ${a.clarity.confidence.toFixed(2)})`);
}
console.log(`\n${flagged}/${results.length} cards flagged, ${results.length} requests in ${(ms / 1000).toFixed(1)}s`);
