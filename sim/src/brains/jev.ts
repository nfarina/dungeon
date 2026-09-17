// A hero brain that plays the party with TypeSafe's Jev model: sensible team play, judged turn by turn.
//
// Code keeps the rules: it rolls the move, lists every option that is legal right now with the
// geometry worked out (walking distance, whether it can be finished this turn), and carries out
// whatever is picked. Jev only answers "which of these would an experienced player pick?", and the brain
// rolls from those probabilities, so the same situation does not always play out the same way.
//
// Every answer is cached on disk by the exact request, so replaying a seed replays the same game.
import { TypeSafeClient, type ChoiceQuestion, type JsonValue, type Questions } from "@typesafe-ai/sdk";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dist1, same, type Pt } from "../board";
import type { Game, Hero, HeroBrain, HeroDecision, Monster } from "../engine";
import { los } from "../pathing";
import { FLOOR2_ITEMS, clone } from "../content/items";

/** How each person plays, in their own family's words. Keyed by hero name. */
export const PLAYERS: Record<string, string> = {
  Vicki: "Mom, playing with her two 11-year-old sons. She tries to help the boys: picks them up when they go down, heals them or hands them healing items, and stays close when they are in trouble. Otherwise she plays normally and sensibly.",
  Ethan: "An 11-year-old boy. Aggressive: goes straight for the monsters and wants to be the one attacking. Always wants to be healed: drinks healing as soon as he is hurt and heads for whoever can heal him.",
  Lucas: "An 11-year-old boy, Ethan's twin. A wanderer: drifts off to explore rooms and search furniture on his own, often away from the rest of the party and whatever it is doing.",
};

const RULES = {
  1: "A cooperative dungeon-crawl board game played by a family: Mom and her two 11-year-old sons, with Dad as the DM. On a turn a hero rolls 2d6 and moves up to that many squares, then takes one action: attack, cast a spell, read a scroll, use a piece of furniture, pick up a friend, and so on. Attack dice roll skulls about half the time; the defender blocks skulls with shields. At 0 Health a hero is Downed: a friend standing next to them can spend their action to pick them up at 1 Health, otherwise they die at the end of the next round, and that player sits out the rest of the floor as a Viewer. Drinking a healing item is free. The goal: kill the Floor Manager in the Manager's Office, then everyone takes the stairs there before the floor collapses. Leaving without killing him is allowed but forfeits his reward.",
  2: "A cooperative dungeon-crawl board game played by a family: Mom and her two 11-year-old sons, with Dad as the DM. On a turn a hero rolls 2d6 and moves up to that many squares, then takes one action: attack, cast a spell, read a scroll, use a piece of furniture, pick up a friend, clean a corpse, and so on. Attack dice roll skulls about half the time; the defender blocks skulls with shields. At 0 Health a hero is Downed: a friend standing next to them can spend their action to pick them up at 1 Health, otherwise they die at the end of the next round, and that player sits out the rest of the floor as a Viewer. Drinking a healing item is free. This floor: dead monsters leave corpses. Grubs come out of the stairwell, walk to the largest corpse they can reach and eat it, and turn into fed janitors that hunt the party, tougher the bigger the corpse. Spark or the goose eating it removes a small corpse; medium and large corpses need Industrial Bleach, which is scarce. A grub that gets squashed goes back to the stairwell and comes out again. The boss room (the Sump, with the stairs down) only opens for the Password of the Day, which is somewhere on the floor; once the whole party is inside, the door shuts behind them and the janitors outside cannot follow. The goal: find the password, kill the Senior Custodian in the Sump, and get everyone down the stairs before the floor collapses.",
} as const;

type Option = { key: string; label: string; detail: Record<string, JsonValue>; run: () => void };
const INF = 0x3fffffff;
const HEALS: Record<string, number> = { heal4: 4, heal3: 3, heal1: 1 };

export type JevOptions = {
  apiKey: string;
  /** Directory for cached answers (one JSON file per distinct request). */
  cacheDir: string;
  signal?: AbortSignal;
  players?: Record<string, string>;
  /** 0..1: weight on how each person habitually plays (`players`) versus sensible team play. Default 0. */
  personality?: number;
};

export function jevBrain(o: JevOptions): HeroBrain {
  const client = new TypeSafeClient({ apiKey: o.apiKey });
  const players = o.players ?? PLAYERS;
  const personality = o.personality ?? 0;
  let cacheReady: Promise<unknown> | null = null;

  async function ask(state: Record<string, JsonValue>, questions: Questions) {
    const body = { model: client.defaultModel, state, questions };
    const file = `${o.cacheDir}/${createHash("sha1").update(JSON.stringify(body)).digest("hex")}.json`;
    const hit = Bun.file(file);
    if (await hit.exists()) return { answers: (await hit.json()) as Record<string, any>, cached: true };
    if (o.signal?.aborted) throw new Error("aborted");
    const res = await client.systemOne({ state, questions }, { signal: o.signal });
    cacheReady ??= mkdir(o.cacheDir, { recursive: true });
    await cacheReady;
    await Bun.write(file, JSON.stringify(res.answers));
    return { answers: res.answers as Record<string, any>, cached: false };
  }

  return async (g: Game, h: Hero) => {
    // Drinking is the rules brain's fixed threshold (2 Health, or 3 with an awake monster close). Asked as a
    // judgment, Jev left heroes at 1 Health holding a Juice Box about half the time.
    const pre = g.beginHeroTurn(h, true);
    if (!pre) return;
    const roll = g.moveBudget(h);
    const options = listOptions(g, h, roll, pre.fleeing);
    const criteria = Object.fromEntries(options.map(op => [op.key, { do: op.label, ...op.detail }]));
    const movement = "`acting_hero.move_roll` is already rolled. `reachable_this_turn` says whether an option can be finished this turn; otherwise the hero only gets partway there.";

    const questions: Questions = {
      sensible: {
        type: "choice",
        instructions: {
          question: "Which option would an experienced player pick for `acting_hero` on this turn, playing together with the rest of the party to keep everyone alive and win?",
          focus: "Judge the play itself from the situation.",
          movement,
        },
        criteria,
      } satisfies ChoiceQuestion,
      tension: {
        type: "score",
        instructions: "How tense does this moment feel for the family at the table?",
        criteria: ["Routine: nobody is in real danger", "Some danger: a hero could get hurt", "Nail-biter: a hero could go down or die this round"],
      },
      engaged: { type: "noul", instructions: "Would the two 11-year-olds at the table be excited by what is happening right now, rather than bored?" },
    };
    // Off by default: with the players' habits weighted in, every turn followed the quirk and the party fell apart.
    if (personality > 0) questions.action = {
      type: "choice",
      instructions: {
        question: "Which option would `player` actually pick for `acting_hero` on this turn?",
        focus: "Predict what this particular person would do, from `player.plays_like` and the situation. It does not have to be the best move.",
        movement,
      },
      criteria,
    } satisfies ChoiceQuestion;

    const t0 = performance.now();
    const decision: HeroDecision = {
      player: h.name, personality, options: [], chosen: "", favourite: true, tension: null, engaged: null,
      ms: 0, cached: false, error: null,
    };
    let chosen: Option;
    try {
      const { answers, cached } = await ask(describe(g, h, roll, personality > 0 ? players : null), questions);
      decision.cached = cached;
      const sense = answers.sensible.probabilities as Record<string, number>;
      const habit = (answers.action?.probabilities ?? {}) as Record<string, number>;
      decision.options = options.map(op => ({
        key: op.key, label: op.label, persona: habit[op.key] ?? 0, sensible: sense[op.key] ?? 0,
        p: personality * (habit[op.key] ?? 0) + (1 - personality) * (sense[op.key] ?? 0),
      })).sort((a, b) => b.p - a.p);
      decision.tension = answers.tension.score;
      decision.engaged = answers.engaged.noul;
      // Roll among the plausible picks; long shots under 8% are ignored.
      const pool = decision.options.filter(x => x.p >= 0.08);
      const total = pool.reduce((a, x) => a + x.p, 0);
      let r = g.rng.next() * total, pick = pool[0] ?? decision.options[0];
      for (const x of pool) { r -= x.p; if (r <= 0) { pick = x; break; } }
      chosen = options.find(op => op.key === pick.key)!;
      decision.favourite = pick.key === decision.options[0].key;
    } catch (e) {
      if (o.signal?.aborted) throw e;
      // No answer: fall back to the obvious move so the game can go on, and say so in the frame.
      decision.error = (e as Error).message;
      chosen = options[0];
      decision.options = options.map((op, i) => ({ key: op.key, label: op.label, p: i === 0 ? 1 : 0, persona: 0, sensible: 0 }));
    }
    decision.ms = Math.round(performance.now() - t0);
    decision.chosen = chosen.key;
    g.decision = decision;
    g.cfg.record && g.say(`${h.name} (rolled ${roll}): ${chosen.label}`);
    chosen.run();
  };
}

/** "the Cave Rat", but "The Shift Lead" stays as it is. */
const the = (name: string) => /^the /i.test(name) ? name : `the ${name}`;
const hpText = (x: { hp: number; maxHp?: number; def?: { hp: number } }) => `${Math.max(0, x.hp)}/${x.maxHp ?? x.def!.hp}`;

/** What the table can see, from the acting hero's point of view. Unexplored rooms stay unknown. */
function describe(g: Game, h: Hero, roll: number, players: Record<string, string> | null): Record<string, JsonValue> {
  const f = g.walkField(h);
  const d = (p: Pt) => { const v = g.adjacentDist(f, p); return g.melee(h.pos, p) ? 0 : v >= INF ? null : v; };
  const roomOf = (p: Pt) => { const id = g.board.roomIdAt(p); return id === null ? "a corridor" : g.board.rooms.get(id)!.name; };
  const canCast = !g.cfg.castNeedsMind || g.mind(h) >= 4;
  const dl = g.hardDeadline(), begins = g.collapseBegins();
  const boss = g.monsters.find(m => m.def.boss);
  const visible = seenMonsters(g, h);
  const recent = [...g.frames.slice(-6).flatMap(fr => fr.lines), ...g.said].map(l => l.trim()).slice(-14);
  const state: Record<string, JsonValue> = {
    game_rules: RULES[g.cfg.floor],
    round: g.round,
    clock: g.cfg.collapseMode === "hard"
      ? (begins === null ? "No time limit."
        : `The floor comes down at the end of round ${begins}, ${begins - g.round} rounds from now: anyone still on the floor dies.`)
      : g.collapseFrom !== null ? `The floor is collapsing now and is gone after round ${dl}.`
      : begins !== null ? `The floor starts collapsing at round ${begins}, ${begins - g.round} rounds from now.` : "No time limit.",
    objective: {
      boss: boss ? (boss.alive ? `alive (${boss.def.name}, ${hpText(boss)} Health)` : "dead") : "none",
      ...(g.cfg.floor === 2 ? { party_has_password: g.partyHasPassword() } : {}),
      rooms_explored: `${g.visitedRooms().size} of ${g.floor.rooms.length}`,
      party_plan: `head for ${g.board.rooms.get(g.currentRoom())?.name}`,
    },
    ...(players ? { player: { name: h.name, plays_like: players[h.name] ?? "Plays normally." } } : {}),
    acting_hero: {
      name: h.name, health: hpText(h), move_roll: roll, standing_in: roomOf(h.pos),
      attack_dice: g.atk(h), defend_dice: g.def(h), mind: g.mind(h),
      equipment: g.items(h).filter(i => i.slot !== "learned").map(i => i.name),
      pack: h.pack.map(i => i.name),
      spells: h.learned.map(l => `${l.item.name.replace("Spellbook: ", "")}: ${!canCast ? "can't cast (Mind under 4)" : l.cd ? `cooling down, ${l.cd} rounds` : "ready"}`),
      ...(h.goose > 0 ? { goose: `Sir Reginald, ${h.goose}/${h.gooseMax} Health` } : {}),
    },
    party: g.heroes.filter(o => o !== h).map(o => ({
      name: o.name,
      status: o.dead ? "dead" : o.exited ? "left the floor" : o.downed ? `DOWNED: dies at the end of round ${o.downedRound + 1} unless picked up` : `${hpText(o)} Health`,
      ...(o.dead || o.exited ? {} : { squares_away: d(o.pos), standing_in: roomOf(o.pos) }),
      carries_healing: o.pack.filter(i => i.use && HEALS[i.use]).map(i => i.name),
    })),
    monsters_in_view: visible.map(m => ({
      name: m.def.name, health: hpText(m), attack_dice: m.def.atk, defend_dice: m.def.def,
      squares_away: d(m.pos), awake: m.active && m.asleep === 0,
      ...(m.def.boss ? { boss: true } : {}), ...(m.def.janitor === "fed" ? { fed_janitor: "hunts the party" } : {}),
    })),
    recent_events: recent,
  };
  if (g.cfg.floor === 2) {
    state.corpses = g.corpses.map(c => ({ size: c.size, squares_away: d(c.pos) })).sort((a, b) => (a.squares_away ?? 99) - (b.squares_away ?? 99)).slice(0, 8);
    state.cleanup_crew = {
      grubs_walking_to_corpses: g.monsters.filter(m => m.alive && m.def.janitor === "grub").length,
      fed_janitors_hunting: g.monsters.filter(m => m.alive && m.def.janitor === "fed").length,
      grubs_waiting_in_stairwell: g.queue,
    };
  }
  return state;
}

/** Monsters the acting hero knows about: awake ones, ones in plain sight, ones in the same room. */
function seenMonsters(g: Game, h: Hero): Monster[] {
  const rid = g.board.roomIdAt(h.pos);
  return g.monsters.filter(m => m.alive && m.def.janitor !== "grub"
    && (m.active || (rid !== null && m.room === rid) || los(g.board, h.pos, m.pos, g.openDoors)));
}

function listOptions(g: Game, h: Hero, roll: number, fleeing: boolean): Option[] {
  const f = g.walkField(h);
  const opts: Option[] = [];
  const add = (key: string, label: string, detail: Record<string, JsonValue>, run: () => void) => opts.push({ key, label, detail, run });
  const at = (p: Pt) => f.dist[g.board.idx(p.x, p.y)];
  const near = (p: Pt) => g.melee(h.pos, p) ? 0 : g.adjacentDist(f, p);
  const reach = (n: number) => ({ squares_away: n >= INF ? "no route" : n, reachable_this_turn: n <= roll });
  const say = (msg: string) => g.cfg.record && g.say(msg);
  const canCast = !g.cfg.castNeedsMind || g.mind(h) >= 4;
  const standing = g.heroes.filter(o => o !== h && !o.dead && !o.exited && !o.downed);
  const mkey = (m: Monster) => `m${g.monsters.indexOf(m)}`;
  /** Walk to a square beside `p` (or as close as the roll allows). */
  const approach = (p: Pt) => {
    if (g.melee(h.pos, p)) return;
    const dest = g.bestAdjacentSpot(f, p, roll) ?? g.stepToward(h, f, p, roll);
    if (dest && !same(dest, h.pos)) g.walk(h, f, dest);
  };
  /** After walking somewhere: the obvious thing on arrival. */
  const arrive = () => {
    const foe = g.monsters.find(m => m.alive && m.active && m.def.janitor !== "grub" && g.melee(m.pos, h.pos));
    if (foe) { g.heroAttack(h, foe); return; }
    const urgent = g.urgent; g.urgent = false;
    g.tryInteract(h);
    g.urgent = urgent;
  };
  const book = (id: string) => canCast ? h.learned.find(l => l.item.spell?.id === id && l.cd === 0) : undefined;

  // Downed friends first: they die at the end of the next round.
  for (const o of g.heroes.filter(o => o.downed && !o.dead && !o.exited)) {
    add(`pickup_${o.name}`, `Go pick up ${o.name}, who is Downed`, { ...reach(near(o.pos)), urgent: `${o.name} dies at the end of round ${o.downedRound + 1} unless someone next to them picks them up` }, () => {
      approach(o.pos);
      if (g.melee(h.pos, o.pos)) g.revive(h, o); else say(`${h.name} can't reach ${o.name} this turn`);
    });
  }

  // Monsters: walk up and hit, or shoot.
  const foes = seenMonsters(g, h).map(m => ({ m, n: near(m.pos) })).filter(x => x.n < INF || los(g.board, h.pos, x.m.pos, g.openDoors))
    .sort((a, b) => a.n - b.n).slice(0, 6);
  for (const { m, n } of foes) {
    const tag = m.def.boss ? " (the boss)" : m.def.janitor === "fed" ? " (a fed janitor)" : "";
    add(`attack_${mkey(m)}`, `Attack ${the(m.def.name)}${tag}`, { ...reach(n), monster_health: hpText(m), monster_defend_dice: m.def.def }, () => {
      const inSight = () => los(g.board, h.pos, m.pos, g.openDoors);
      if (g.hasRanged(h) && !g.melee(h.pos, m.pos) && inSight()) { g.heroAttack(h, m); return; }
      approach(m.pos);
      if (g.melee(h.pos, m.pos) || ((g.hasRanged(h) || g.hasSidearm(h)) && inSight())) g.heroAttack(h, m);
      else say(`${h.name} can't reach ${the(m.def.name)} this turn`);
    });
  }

  // Spells and scrolls from where the hero stands.
  for (const { m } of foes.filter(x => los(g.board, h.pos, x.m.pos, g.openDoors)).slice(0, 3)) {
    const spark = book("spark");
    if (spark) add(`spark_${mkey(m)}`, `Cast Spark at ${the(m.def.name)} from here (2 dice)`, { monster_health: hpText(m) }, () => {
      spark.cd = spark.item.spell!.cooldown; say(`${h.name} casts Spark at the ${m.def.name}`); g.resolveAttack(h, m, 2);
    });
    const scroll = (use: string) => h.pack.find(i => i.use === use);
    const fb = scroll("firebolt");
    if (fb) add(`firebolt_${mkey(m)}`, `Read Scroll: Firebolt at ${the(m.def.name)} (3 dice, used up)`, { monster_health: hpText(m) }, () => {
      h.pack = h.pack.filter(x => x !== fb); say(`${h.name} reads Firebolt at the ${m.def.name}`); g.resolveAttack(h, m, 3);
    });
    const rs = scroll("restructuring");
    if (rs && g.mind(h) >= (rs.needMind ?? 5)) add(`restructuring_${mkey(m)}`, `Read Scroll: Restructuring at ${the(m.def.name)} (4 dice, 1 damage to everything next to it, used up)`, { monster_health: hpText(m) }, () => {
      h.pack = h.pack.filter(x => x !== rs); say(`${h.name} reads Restructuring at the ${m.def.name}`); g.resolveAttack(h, m, 4);
      for (const x of g.monsters.filter(x => x.alive && x !== m && g.melee(x.pos, m.pos))) g.hurtMonster(x, 1, h);
    });
    const sl = scroll("sleep");
    if (sl && !m.def.undead && m.asleep === 0) add(`sleep_${mkey(m)}`, `Read Scroll: Sleep on ${the(m.def.name)} (it skips two turns, used up)`, { monster_health: hpText(m) }, () => {
      h.pack = h.pack.filter(x => x !== sl); m.asleep = 2; say(`${h.name} reads Sleep on the ${m.def.name}`);
    });
  }
  const lo = h.pack.find(i => i.use === "lightsout");
  const rid = g.board.roomIdAt(h.pos);
  const crowd = rid === null ? [] : g.monsters.filter(m => m.alive && m.asleep === 0 && g.board.roomIdAt(m.pos) === rid);
  if (lo && crowd.length) add("lights_out", `Read Scroll: Lights Out (every monster in this room skips its next turn, used up)`, { monsters_in_room: crowd.length }, () => {
    h.pack = h.pack.filter(x => x !== lo); for (const m of crowd) m.asleep = Math.max(m.asleep, 1); say(`${h.name} reads Lights Out`);
  });
  const adjFoes = g.monsters.filter(m => m.alive && m.def.janitor !== "grub" && g.melee(m.pos, h.pos));
  const st = book("static");
  if (st && adjFoes.length >= 2) add("static", `Cast Static: 1 damage to each of the ${adjFoes.length} monsters next to you`, {}, () => {
    st.cd = st.item.spell!.cooldown; say(`${h.name} casts Static`); for (const m of adjFoes) g.hurtMonster(m, 1, h);
  });

  // Healing friends (and yourself).
  const pu = book("patchup");
  // Healing only where it isn't a top-up: handing a friend at 5/6 a Juice Box left nobody holding one at 1 Health.
  if (pu && h.maxHp - h.hp >= 2) add("patchup_self", `Cast Patch Up on yourself (+2 Health)`, { your_health: hpText(h) }, () => {
    pu.cd = pu.item.spell!.cooldown; h.hp = Math.min(h.maxHp, h.hp + 2); say(`${h.name} casts Patch Up on themself (${h.hp}/${h.maxHp})`);
  });
  const potions = h.pack.filter(i => i.use && HEALS[i.use]);
  for (const o of standing.filter(o => o.maxHp - o.hp >= 2)) {
    const n = near(o.pos);
    if (n > roll) continue;
    if (pu) add(`patchup_${o.name}`, `Go to ${o.name} and cast Patch Up on them (+2 Health)`, { ...reach(n), their_health: hpText(o) }, () => {
      approach(o.pos);
      if (!g.melee(h.pos, o.pos)) { say(`${h.name} can't reach ${o.name}`); return; }
      pu.cd = pu.item.spell!.cooldown; o.hp = Math.min(o.maxHp, o.hp + 2); say(`${h.name} casts Patch Up on ${o.name} (${o.hp}/${o.maxHp})`);
    });
    const potion = potions[0];
    if (potion && o.hp <= 3) add(`give_${o.name}`, `Go to ${o.name} and hand them your ${potion.name} to drink (+${HEALS[potion.use!]} Health)`, { ...reach(n), their_health: hpText(o) }, () => {
      approach(o.pos);
      if (!g.melee(h.pos, o.pos)) { say(`${h.name} can't reach ${o.name}`); return; }
      h.pack = h.pack.filter(x => x !== potion); o.hp = Math.min(o.maxHp, o.hp + HEALS[potion.use!]);
      say(`${h.name} hands ${o.name} the ${potion.name} (${o.hp}/${o.maxHp})`);
    });
  }
  // Sticking with someone: toward a friend (who may be carrying healing).
  // Only when they are actually apart: "move toward" someone two squares away is a wasted turn that always looks safe.
  for (const o of standing) {
    const n = near(o.pos);
    if (n <= 3 || n >= INF) continue;
    add(`join_${o.name}`, `Move toward ${o.name}`, { ...reach(n), their_health: hpText(o) }, () => { approach(o.pos); arrive(); });
  }

  // Floor 2: corpses and grubs.
  if (g.cfg.floor === 2) {
    const mop = h.equip.main?.cleans ? h.equip.main : null;
    const bleach = h.pack.find(i => i.use === "bleach");
    const corpses = g.corpses.map(c => ({ c, n: Math.min(at(c.pos), near(c.pos)) })).filter(x => x.n < INF).sort((a, b) => a.n - b.n).slice(0, 3);
    for (const { c, n } of corpses) {
      const ck = `${c.pos.x}_${c.pos.y}`;
      const walkTo = () => {
        const dest = at(c.pos) <= roll ? c.pos : g.bestAdjacentSpot(f, c.pos, roll) ?? g.stepToward(h, f, c.pos, roll);
        if (dest && !same(dest, h.pos)) g.walk(h, f, dest);
        return g.melee(h.pos, c.pos) || same(h.pos, c.pos);
      };
      if (h.goose > 0 && (c.size === "small" || (h.biscuit && c.size === "medium")))
        add(`goose_${ck}`, `Walk to the ${c.size} corpse and let Sir Reginald eat it`, reach(n), () => {
          if (!walkTo()) { say(`${h.name} doesn't reach the corpse`); return; }
          g.removeCorpse(c, "goose"); g.award("Good Boy", [clone(FLOOR2_ITEMS["Pet Biscuit"])]);
        });
      if (mop || bleach)
        add(`bleach_${ck}`, `Walk to the ${c.size} corpse and ${mop ? "mop it up" : "pour Industrial Bleach on it (uses the bottle)"}`, reach(n), () => {
          if (!walkTo()) { say(`${h.name} doesn't reach the corpse`); return; }
          if (mop) mop.cleans!--; else { h.pack = h.pack.filter(x => x !== bleach); g.f2.bleachUsed++; }
          g.removeCorpse(c, "bleach");
        });
      const inSight = los(g.board, h.pos, c.pos, g.openDoors);
      const spark = book("spark");
      if (spark && inSight && (c.size === "small" || !g.cfg.sparkSmallOnly))
        add(`sparkclean_${ck}`, `Cast Spark at the ${c.size} corpse to obliterate it`, { squares_away: dist1(h.pos, c.pos) }, () => {
          spark.cd = spark.item.spell!.cooldown; g.removeCorpse(c, "spark");
        });
      const mopup = book("mopup");
      if (mopup && inSight)
        add(`mopupclean_${ck}`, `Cast Mop-Up at the ${c.size} corpse to obliterate it`, { squares_away: dist1(h.pos, c.pos) }, () => {
          mopup.cd = mopup.item.spell!.cooldown; g.removeCorpse(c, "spark");
        });
    }
    for (const m of g.monsters.filter(m => m.alive && m.def.janitor === "grub" && near(m.pos) <= roll).slice(0, 2))
      add(`squash_${mkey(m)}`, g.cfg.grubsReturn ? "Squash the grub before it reaches a corpse (it goes back to the stairwell and comes out again)" : "Squash the grub before it reaches a corpse", reach(near(m.pos)), () => { approach(m.pos); if (g.melee(h.pos, m.pos)) g.heroAttack(h, m); });
  }

  // Rooms: somewhere new, somewhere unfinished, or the boss room.
  const here = g.board.roomIdAt(h.pos);
  const visited = g.visitedRooms();
  const rooms = g.floor.rooms.map(r => {
    const cells = g.board.cellsOf(r.id).filter(c => g.board.isFloor(c.x, c.y));
    const n = cells.reduce((a, c) => Math.min(a, at(c)), INF);
    const explored = visited.has(r.id) || here === r.id;
    const monstersLeft = explored ? g.monsters.filter(m => m.alive && m.room === r.id && m.def.janitor === undefined).length : null;
    // usableInteract keeps chests off the list when nobody is carrying a key.
    const furniture = explored && g.usableInteract(r.id) ? r.interact!.what.kind : null;
    return { r, n, explored, monstersLeft, furniture, boss: r.id === g.bossRoom };
  }).filter(x => x.n < INF);
  /** A square inside the room, beside its furniture, nearest the hero. (A square beside the furniture on the
   *  far side of the room's wall is useless: furniture is only used from inside.) */
  const furnitureSpot = (id: number): Pt | null => {
    const r = g.board.rooms.get(id)!;
    let best: Pt | null = null, bd = INF;
    for (const c of r.interact?.cells ?? []) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const p = { x: c.x + dx, y: c.y + dy };
      if (g.board.roomIdAt(p) !== id || !g.board.isFloor(p.x, p.y)) continue;
      const d = at(p);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  };
  /** Rule: furniture can't be used with an awake monster within 2 squares. */
  const quietAt = (p: Pt) => !g.monsters.some(m => m.alive && m.active && dist1(m.pos, p) <= 2);
  for (const x of rooms.filter(x => x.r.id === here && x.furniture)) {
    const spot = furnitureSpot(x.r.id);
    if (!spot || at(spot) > roll || !quietAt(spot)) continue;
    add(`search_${x.r.id}`, `Use the ${x.furniture} in this room`, reach(at(spot)), () => {
      const dest = g.stepToward(h, f, spot, roll);
      if (dest && !same(dest, h.pos)) g.walk(h, f, dest);
      const urgent = g.urgent; g.urgent = false;
      if (!g.tryInteract(h)) say(`${h.name} can't use the ${x.furniture} yet`);
      g.urgent = urgent;
    });
  }
  // The party's plan, worked out the way the rules brain does it (route, or nearest unexplored room until the
  // password turns up). Jev sees one turn at a time; without this, parties drift between nearby rooms all game.
  const plan = g.currentRoom();
  const worth = rooms.filter(x => x.r.id !== here && (x.boss || x.r.id === plan || !x.explored || x.monstersLeft || x.furniture)).sort((a, b) => a.n - b.n);
  for (const x of [...worth.filter(x => !x.boss && x.r.id !== plan).slice(0, 6), ...worth.filter(x => x.boss || x.r.id === plan)]) {
    const about: Record<string, JsonValue> = x.explored
      ? { explored: true, ...(x.monstersLeft ? { monsters_left: x.monstersLeft } : {}), ...(x.furniture ? { unused_furniture: x.furniture } : {}) }
      : { explored: false };
    if (x.r.id === plan) about.party_plan = "This is where the party agreed to go next";
    add(`go_${x.r.id}`, `Head for ${x.r.name}${x.boss ? " (the boss room, with the stairs down)" : ""}`, { ...reach(x.n), ...about }, () => {
      const goal = (x.furniture && !x.monstersLeft ? furnitureSpot(x.r.id) : null) ?? g.board.center(x.r.id);
      const dest = g.stepToward(h, f, goal, roll);
      if (dest && !same(dest, h.pos)) g.walk(h, f, dest); else say(`${h.name} can't get any closer to ${x.r.name}`);
      arrive();
    });
  }

  // Leaving.
  const bossDead = g.bossKilledRound !== null;
  if (bossDead || g.collapseFrom !== null || fleeing) {
    const n = at(g.stairsCell());
    if (n < INF) add("stairs", `Head for the stairs and leave the floor${bossDead ? "" : " (forfeits the boss reward)"}`, reach(n), () => {
      const dest = g.stepToward(h, f, g.stairsCell(), roll);
      if (dest && !same(dest, h.pos)) g.walk(h, f, dest);
      if (g.onStairs(h)) { h.exited = true; g.log(`${h.name} takes the stairs`); }
    });
  }

  // Backing off from whatever is awake nearby.
  const threats = g.monsters.filter(m => m.alive && m.active && m.asleep === 0 && m.def.janitor !== "grub" && dist1(m.pos, h.pos) <= 6);
  if (threats.length) add("retreat", "Back away from the monsters toward the rest of the party", { awake_monsters_within_6: threats.length }, () => {
    let best: Pt | null = null, bs = -Infinity;
    for (let y = 0; y < g.board.h; y++) for (let x = 0; x < g.board.w; x++) {
      if (f.dist[g.board.idx(x, y)] > roll || standing.some(o => o.pos.x === x && o.pos.y === y)) continue;
      const p = { x, y };
      const safety = Math.min(...threats.map(m => dist1(m.pos, p)));
      const friend = standing.length ? Math.min(...standing.map(o => dist1(o.pos, p))) : 0;
      const s = safety * 10 - friend;
      if (s > bs) { bs = s; best = p; }
    }
    if (best && !same(best, h.pos)) g.walk(h, f, best);
  });

  if (g.mind(h) >= 4 && h.pack.some(i => i.slot === "learned"))
    add("learn", "Learn the Spellbook in your pack (takes the action)", {}, () => { g.tryLearn(h); });

  if (!opts.length) add("wait", "Stay where you are", {}, () => {});
  return opts;
}
