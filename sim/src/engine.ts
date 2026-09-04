import { Board, adjacent, dist1, same, type Pt } from "./board";
import { RNG, rollSkulls, rollShields } from "./rng";
import { ek, edgePassable, field, los, pathTo, type EdgePolicy, type Field } from "./pathing";
import { FLOOR1 } from "./content/floor1-map";
import { MONSTERS, type MonsterDef } from "./content/monsters";
import { BIG_GEAR, GEAR, KITS, POCKETS, clone, type Item, type Slot } from "./content/items";

// ---------------------------------------------------------------------------
// Config: every dial we want to sweep lives here.
// ---------------------------------------------------------------------------
export type Config = {
  seed: number;
  /** Round at which the floor collapses. null = no timer (current rules). */
  collapseRound: number | null;
  /** "hard" = cliff: everyone still on the floor dies. "soft" = the floor comes
   *  down around you over several rounds, doing escalating damage. */
  collapseMode: "hard" | "soft";
  /** "round" = fuse lit at turn 1. "bossdoor" = lit when the Office door opens.
   *  "both" = whichever comes first (a generous floor cap plus a short boss fuse). */
  collapseStart: "round" | "bossdoor" | "both";
  /** collapseStart=bossdoor: how many rounds you get after the door opens. */
  collapseAfterDoor: number;
  /** soft mode: rounds from first tremor to total wipe. */
  collapseGrace: number;
  /** How fast the ceiling escalates: gentle = 1,1,2,2,3 -- steep = 1,2,3,4,5. */
  collapseEscalation: "gentle" | "steep";
  /** Section 8: dead players become Viewers and play the Fan deck. */
  fanDeck: boolean;
  /** Do the heroes know the count from turn 1? */
  timerKnown: boolean;
  /** Rounds of slack heroes leave themselves before bailing for the stairs. */
  panicMargin: number;
  /** Which optional rooms this party detours into. */
  optionalRooms: number[];
  /** 0..1. Gates the smarter plays (focus the Orcs first, spend scrolls, disarm). */
  competence: number;
  /** Starting kits, one per hero. */
  kits: string[];
  heroNames: string[];
  /** Rule variants we may want to test. */
  reviveHp: number;
  heroHp: number;
  heroAtk: number;
  heroDef: number;
  bossHp: number;
  /** Richer monster loot tables: Orcs/Zombies drop Gear on 5-6 instead of just 6. */
  lootRich: boolean;
  /** The Armory weapon rack is worth two Gear draws instead of one. */
  richRack: boolean;
  /** Put a guaranteed Spellbook on the required path (in the Armory rack). */
  guaranteedSpellbook: boolean;
  maxRounds: number;
};

export const DEFAULT_CONFIG: Config = {
  seed: 1,
  collapseRound: null,
  collapseMode: "hard",
  collapseStart: "round",
  collapseAfterDoor: 6,
  collapseGrace: 5,
  collapseEscalation: "gentle",
  fanDeck: true,
  timerKnown: true,
  panicMargin: 1,
  optionalRooms: [4, 8],
  competence: 0.7,
  kits: ["Glasses", "HockeyStick", "SnackBag"],
  heroNames: ["Vicki", "Ethan", "Lucas"],
  reviveHp: 1,
  heroHp: 6,
  heroAtk: 2,
  heroDef: 2,
  bossHp: 4,
  lootRich: false,
  richRack: false,
  guaranteedSpellbook: false,
  maxRounds: 80,
};

// ---------------------------------------------------------------------------

export type Hero = {
  name: string; pos: Pt; hp: number; maxHp: number;
  equip: Record<string, Item | null>;
  trinkets: (Item | null)[];
  pack: Item[];
  learned: { item: Item; cd: number }[];
  gold: number;
  downed: boolean; downedRound: number; exited: boolean; dead: boolean;
  inPit: boolean;
  trapImmuneUsed: boolean;
  rerollUsed: boolean;
  energy: number;          // pending +1 attack die
  stoneSkin: boolean;
  goose: number;           // goose hp, 0 = none
  deaths: number;
};

export type Monster = {
  def: MonsterDef; pos: Pt; hp: number; room: number;
  active: boolean; asleep: number; alive: boolean; cd: number;
};

export type Result = {
  outcome: "win" | "escaped-no-boss" | "collapsed" | "stalled" | "wiped";
  rounds: number;
  bossKilled: boolean;
  bossKilledRound: number | null;
  exitRound: number | null;
  margin: number | null;      // rounds to spare vs the collapse
  downs: number;
  respawns: number;
  monstersKilled: number;
  roomsCleared: number;
  minPartyHp: number;
  bossFightRounds: number | null;
  heroHpAtBossKill: number | null;
  goldFound: number;
  /** Heroes who died for the floor (rule 1.4). */
  heroesDead: number;
  learnedSpell: boolean;
  trapsTriggered: number;
  heroesLost: number;
  /** Did they get out while the ceiling was actually falling? */
  inCollapse: boolean;
  /** Total party HP at the moment the last hero hit the stairs. */
  finalPartyHp: number;
  /** Round of the most recent knockdown; how late the drama ran. */
  lastDownRound: number | null;
  /** The round the collapse actually started, if it did. */
  collapseBegan: number | null;
  /** The round it WOULD have started -- known even when they beat it. */
  collapseScheduled: number | null;
  /** Round the Manager's Office was opened -- when the fuse gets lit. */
  doorRound: number | null;
  /** True if the floor-wide cap, not the boss fuse, is what started the collapse. */
  capBound: boolean;
};

const SLOTS: Slot[] = ["main", "off", "body", "head", "feet"];

export class Game {
  board = new Board(FLOOR1);
  rng: RNG;
  cfg: Config;
  heroes: Hero[] = [];
  monsters: Monster[] = [];
  openDoors: Uint8Array;
  foundSecrets: Uint8Array;
  revealedTraps = new Set<string>();
  spentTraps = new Set<string>();
  usedInteract = new Set<number>();
  decks: Record<"pockets" | "gear" | "big", Item[]>;
  achievements = new Set<string>();
  round = 0;
  private doorVersion = 0;
  private goalFieldCache = new Map<string, Field>();
  bossKilledRound: number | null = null;
  bossEngagedRound: number | null = null;
  bossDoorRound: number | null = null;
  collapseFrom: number | null = null;
  heroesLost = 0;
  lastDownRound: number | null = null;
  urgent = false;
  stuck = 0;
  stats = { downs: 0, respawns: 0, deaths: 0, kills: 0, traps: 0, gold: 0 };
  fanShield = 0; fanReroll = 0;
  minPartyHp = 99;
  heroHpAtBossKill: number | null = null;
  route: number[];

  constructor(cfg: Partial<Config> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.openDoors = new Uint8Array(this.board.doors.length);
    this.foundSecrets = new Uint8Array(this.board.doors.length);
    this.rng = new RNG(this.cfg.seed);
    this.decks = this.buildDecks();
    this.setupHeroes();
    this.setupMonsters();
    const optional = this.cfg.optionalRooms;
    this.route = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter(r => r === 9 || [1, 2, 5].includes(r) || optional.includes(r));
  }

  // --- setup ---------------------------------------------------------------

  private buildDecks() {
    // Loot-box exclusives are pulled out of the decks, per floor-1.md.
    const pulled = new Set(["Football Helmet", "Scroll: Firebolt", "Orc Monocle",
      "Lucky Rabbit's Foot", "Spellbook: Shove"]);
    const mk = (src: Item[]) => this.rng.shuffle(src.filter(i => !pulled.has(i.name)).map(clone));
    return { pockets: mk(POCKETS), gear: mk(GEAR), big: mk(BIG_GEAR) };
  }

  /**
   * Everyone starts stacked on the entrance square; at the table the stairs up
   * sit off the board beside it, so there's room for the figures. They spread
   * out on turn one. If the entrance is somehow unwalkable, fall back to the
   * nearest square that isn't -- the editor's checks flag that case anyway.
   */
  private startSpots(n: number): Pt[] {
    const e = FLOOR1.entrance;
    if (this.board.isFloor(e.x, e.y)) return Array.from({ length: n }, () => ({ ...e }));
    const policy: EdgePolicy = {
      openDoors: this.openDoors, foundSecrets: this.foundSecrets,
      canOpenDoors: true, canUnlock: true, occupied: () => false,
    };
    const f = field(this.board, e, policy);
    let best: Pt = { ...e }, bd = Infinity;
    for (let y = 0; y < this.board.h; y++) for (let x = 0; x < this.board.w; x++) {
      const d = f.dist[this.board.idx(x, y)];
      if (d < bd && this.board.isFloor(x, y)) { bd = d; best = { x, y }; }
    }
    return Array.from({ length: n }, () => ({ ...best }));
  }

  private setupHeroes() {
    const spots = this.startSpots(this.cfg.heroNames.length);
    this.cfg.heroNames.forEach((name, i) => {
      const h: Hero = {
        name, pos: { ...spots[i] }, hp: this.cfg.heroHp, maxHp: this.cfg.heroHp,
        equip: { main: null, off: null, body: null, head: null, feet: null },
        trinkets: [null, null], pack: [], learned: [], gold: 0,
        downed: false, downedRound: -99, exited: false, dead: false, inPit: false,
        trapImmuneUsed: false, rerollUsed: false, energy: 0, stoneSkin: false,
        goose: 0, deaths: 0,
      };
      for (const item of KITS[this.cfg.kits[i]].map(clone)) this.give(h, item);
      this.heroes.push(h);
    });
    // "Sharing Is Caring" is free: someone hands someone a card on turn one.
    this.award("Sharing Is Caring", [{ name: "Lucky Rabbit's Foot", slot: "trinket", reroll: 1 }]);
  }

  private setupMonsters() {
    for (const r of FLOOR1.rooms) {
      const cells = this.roomCells(r.id).filter(c => this.board.isFloor(c.x, c.y));
      const shuffled = this.rng.shuffle([...cells]);
      r.monsters.forEach((id, i) => {
        const def = MONSTERS[id];
        this.monsters.push({
          def, pos: { ...shuffled[i % shuffled.length] },
          hp: def.boss ? this.cfg.bossHp : def.hp,
          room: r.id, active: false, asleep: 0, alive: true, cd: 0,
        });
      });
    }
  }

  roomCells(id: number): Pt[] { return this.board.cellsOf(id); }

  /** Heroes still on the floor and still breathing. */
  living() { return this.heroes.filter(h => !h.dead && !h.exited); }
  /** Living, standing, targetable. */
  standing() { return this.heroes.filter(h => !h.dead && !h.exited && !h.downed); }

  // --- derived stats -------------------------------------------------------

  items(h: Hero): Item[] {
    return [...SLOTS.map(s => h.equip[s]), ...h.trinkets, ...h.learned.map(l => l.item)]
      .filter(Boolean) as Item[];
  }
  sum(h: Hero, k: "atk" | "def" | "mind" | "move"): number {
    return this.items(h).reduce((a, i) => a + (i[k] ?? 0), 0);
  }
  atk(h: Hero) { return this.cfg.heroAtk + this.sum(h, "atk"); }
  def(h: Hero) { return this.cfg.heroDef + this.sum(h, "def") + (h.stoneSkin ? 2 : 0); }
  mind(h: Hero) { return 3 + this.sum(h, "mind"); }
  moveDice(h: Hero) { return Math.max(1, this.rng.d6() + this.rng.d6() + this.sum(h, "move")); }
  gearCount(h: Hero) { return this.items(h).length + h.pack.length; }

  has(h: Hero, pred: (i: Item) => boolean) { return this.items(h).some(pred) || h.pack.some(pred); }
  find(h: Hero, pred: (i: Item) => boolean) { return this.items(h).find(pred) ?? h.pack.find(pred); }

  // --- inventory -----------------------------------------------------------

  give(h: Hero, item: Item) {
    if (item.gold) { h.gold += item.gold; this.stats.gold += item.gold; return; }
    if (item.slot === "pack" || item.inert) { h.pack.push(item); return; }
    if (item.slot === "learned") { h.pack.push(item); return; }   // must be learned first
    this.equipOrStash(h, item);
  }

  private score(i: Item) {
    return (i.atk ?? 0) * 3 + (i.def ?? 0) * 3 + (i.mind ?? 0) * 2 + (i.move ?? 0) * 0.5
      + (i.torch ? 1 : 0) + (i.ranged ? 2 : 0) + (i.trapImmuneOnce ? 1 : 0)
      + (i.disarms ? 0.5 : 0) + (i.unlocks ? 1.5 : 0) + (i.reroll ? 1 : 0) + (i.rope ? 0.5 : 0);
  }

  private equipOrStash(h: Hero, item: Item) {
    if (item.slot === "trinket") {
      const free = h.trinkets.indexOf(null);
      if (free >= 0) { h.trinkets[free] = item; return; }
      let worst = 0;
      for (let i = 1; i < h.trinkets.length; i++)
        if (this.score(h.trinkets[i]!) < this.score(h.trinkets[worst]!)) worst = i;
      if (this.score(item) > this.score(h.trinkets[worst]!)) {
        h.pack.push(h.trinkets[worst]!); h.trinkets[worst] = item;
      } else h.pack.push(item);
      return;
    }
    const s = item.slot as Slot;
    const cur = h.equip[s];
    if (item.twoHanded) {
      const now = this.score(cur ?? { name: "", slot: s }) + this.score(h.equip.off ?? { name: "", slot: "off" });
      if (this.score(item) > now) {
        if (cur) h.pack.push(cur);
        if (h.equip.off) { h.pack.push(h.equip.off); h.equip.off = null; }
        h.equip[s] = item;
      } else h.pack.push(item);
      return;
    }
    if (s === "off" && h.equip.main?.twoHanded) { h.pack.push(item); return; }
    if (s === "body" && item.name === "Orc Chainmail Bib" && h.equip.feet?.name === "Stolen Sneakers") {
      // can't wear both; keep whichever is worth more
      if (this.score(item) <= this.score(h.equip.feet!)) { h.pack.push(item); return; }
      h.pack.push(h.equip.feet!); h.equip.feet = null;
    }
    if (!cur || this.score(item) > this.score(cur)) {
      if (cur) h.pack.push(cur);
      h.equip[s] = item;
    } else h.pack.push(item);
  }

  draw(deck: "pockets" | "gear" | "big"): Item | null {
    const d = this.decks[deck];
    return d.length ? d.pop()! : null;
  }

  award(name: string, contents: Item[]) {
    if (this.achievements.has(name)) return;
    this.achievements.add(name);
    const h = this.living()[0] ?? this.heroes[0];
    for (const c of contents) this.give(h, clone(c));
  }

  // --- policies ------------------------------------------------------------

  heroPolicy(h: Hero, ignoreHeroes = true): EdgePolicy {
    const canUnlock = this.has(h, i => !!i.unlocks) || true;  // they can always knock
    return {
      openDoors: this.openDoors, foundSecrets: this.foundSecrets,
      canOpenDoors: true, canUnlock,
      occupied: (x, y) => this.monsters.some(m => m.alive && m.pos.x === x && m.pos.y === y)
        || (!ignoreHeroes && this.standing().some(o => o !== h && o.pos.x === x && o.pos.y === y)),
      avoid: (x, y) => this.revealedTraps.has(`${x},${y}`) && !this.spentTraps.has(`${x},${y}`),
    };
  }
  monsterPolicy(m: Monster): EdgePolicy {
    return {
      openDoors: this.openDoors, foundSecrets: this.foundSecrets,
      canOpenDoors: false, canUnlock: false,
      occupied: (x, y) => this.monsters.some(o => o.alive && o !== m && o.pos.x === x && o.pos.y === y)
        || this.standing().some(h => h.pos.x === x && h.pos.y === y),
      // rule 3: never walks onto a revealed trap
      avoid: undefined,
    };
  }

  // --- main loop -----------------------------------------------------------

  run(): Result {
    while (this.round < this.cfg.maxRounds) {
      this.round++;
      this.goalFieldCache.clear();
      this.fanShield = 0; this.fanReroll = 0;
      this.tradePhase();
      this.fanDeckPhase();
      for (const h of this.heroes) this.heroTurn(h);
      this.monsterPhase();
      this.endOfRound();
      const alive = this.living();
      this.minPartyHp = Math.min(this.minPartyHp,
        alive.length ? alive.reduce((a, h) => a + Math.max(0, h.hp), 0) : this.minPartyHp);
      // "If all three heroes are dead, the floor collapses immediately."
      if (this.heroes.every(h => h.dead)) return this.result("wiped");
      if (this.heroes.every(h => h.exited || h.dead)) return this.result("done");

      const begins = this.collapseBegins();
      if (begins !== null && this.round >= begins) {
        if (this.collapseFrom === null) this.collapseFrom = this.round;
        if (this.cfg.collapseMode === "soft") {
          // The ceiling comes down harder every round you stay.
          const k = this.round - this.collapseFrom;
          const dmg = this.cfg.collapseEscalation === "steep" ? k + 1 : 1 + Math.floor(k / 2);
          for (const h of this.heroes) if (!h.exited && !h.downed) this.damage(h, dmg);
        }
      }
      const dl = this.hardDeadline();
      if (dl !== null && this.round >= dl) {
        this.heroesLost = this.living().length;
        return this.result("collapsed");
      }
    }
    return this.result("stalled");
  }

  private result(kind: "done" | "collapsed" | "stalled" | "wiped"): Result {
    const boss = this.bossKilledRound !== null;
    const outcome: Result["outcome"] =
      kind === "wiped" ? "wiped" : kind === "collapsed" ? "collapsed"
      : kind === "stalled" ? "stalled" : boss ? "win" : "escaped-no-boss";
    const exitRound = kind === "done" ? this.round : null;
    return {
      outcome, rounds: this.round, bossKilled: boss, bossKilledRound: this.bossKilledRound,
      exitRound,
      margin: (() => { const dl = this.hardDeadline(); return dl !== null && exitRound !== null ? dl - exitRound : null; })(),
      heroesLost: this.heroesLost,
      inCollapse: this.collapseFrom !== null && exitRound !== null && exitRound >= this.collapseFrom,
      finalPartyHp: this.heroes.reduce((a, h) => a + Math.max(0, h.hp), 0),
      lastDownRound: this.lastDownRound,
      collapseBegan: this.collapseFrom,
      collapseScheduled: this.collapseBegins(),
      doorRound: this.bossDoorRound,
      capBound: this.cfg.collapseRound !== null && this.bossDoorRound !== null &&
        this.cfg.collapseRound <= this.bossDoorRound + this.cfg.collapseAfterDoor,
      downs: this.stats.downs, respawns: this.stats.respawns, monstersKilled: this.stats.kills,
      roomsCleared: [...this.board.rooms.keys()].filter(id =>
        !this.monsters.some(m => m.alive && m.room === id)).length,
      minPartyHp: this.minPartyHp,
      bossFightRounds: this.bossEngagedRound !== null && this.bossKilledRound !== null
        ? this.bossKilledRound - this.bossEngagedRound + 1 : null,
      heroHpAtBossKill: this.heroHpAtBossKill,
      goldFound: this.stats.gold,
      heroesDead: this.heroes.filter(h => h.dead).length,
      learnedSpell: this.heroes.some(h => h.learned.length > 0),
      trapsTriggered: this.stats.traps,
    };
  }

  private checkAchievements() {
    if (!this.monsters.some(m => m.alive && m.room === 4) && this.board.rooms.get(4)!.monsters.length)
      this.award("You Monster", [{ name: "Gold (2)", slot: "pack", gold: 2 }]);
    if (this.board.doors.every((d, i) => d.kind === "secret" || this.openDoors[i] === 1))
      this.award("Cartographer", [{ name: "Gold (5)", slot: "pack", gold: 5 }]);
    if (this.heroes.some(h => h.goose > 0)) this.achievements.add("Sir Reginald");
  }

  private endOfRound() {
    this.checkAchievements();
    for (const h of this.heroes) {
      // Rule 1.4: still down at the end of the next full round and you are dead
      // for the floor. The figure comes off the board; your cards stay in front
      // of you, unusable, and your body rides the stairs down with the party.
      if (h.downed && !h.dead && this.round - h.downedRound >= 1) {
        h.downed = false; h.dead = true; h.deaths++; this.stats.deaths++;
      }
    }
  }

  /**
   * Rule 1.5: hand any card to an adjacent player, free. In practice the table
   * relays a spellbook to whoever can read it, and scrolls to whoever is alive.
   * Modelled as: it gets there if the two are in the same room or within 4 squares.
   */
  private tradePhase() {
    const readers = this.standing().filter(h => this.mind(h) >= 4);
    if (!readers.length) return;
    for (const h of this.heroes) {
      if (h.exited || h.dead) continue;
      const books = h.pack.filter(i => i.slot === "learned");
      for (const b of books) {
        const to = readers.find(r => r !== h &&
          (this.board.roomIdAt(r.pos) !== null && this.board.roomIdAt(r.pos) === this.board.roomIdAt(h.pos)
            || dist1(r.pos, h.pos) <= 4));
        if (!to) continue;
        h.pack = h.pack.filter(x => x !== b);
        to.pack.push(b);
      }
    }
  }

  /**
   * Section 8. A Viewer draws from the Fan deck and plays at most one card a
   * round. Rather than model all fourteen, this abstracts the deck to its
   * mechanical share: roughly half the cards do nothing a simulator can see
   * (Confetti, Fan Mail, Sponsor Message's advert), and the rest either take an
   * attack off the table (Banana Peel, Slow Clap, Boo!, Heckle, Fog Machine),
   * hand a hero a reroll (Applause, Wardrobe Malfunction, Poke) or heal 1.
   */
  private fanDeckPhase() {
    if (!this.cfg.fanDeck) return;
    for (let v = this.heroes.filter(h => h.dead).length; v > 0; v--) {
      if (this.rng.next() > 0.5) continue;          // a flavour card, or a held hand
      const r = this.rng.next();
      if (r < 0.45) this.fanShield++;
      else if (r < 0.8) this.fanReroll++;
      else {
        const hurt = this.standing().sort((a, b) => a.hp - b.hp)[0];
        if (hurt) hurt.hp = Math.min(hurt.maxHp, hurt.hp + 1);
      }
    }
  }

  // --- hero turn -----------------------------------------------------------

  private heroTurn(h: Hero) {
    if (h.exited || h.dead) return;
    for (const l of h.learned) if (l.cd > 0) l.cd--;
    h.stoneSkin = false;
    if (h.downed) return;

    // Free: drink when hurt (consumables cost no action).
    this.maybeHeal(h);

    if (h.inPit) {
      if (this.has(h, i => !!i.rope)) h.inPit = false;
      else { h.inPit = false; return; }        // climbing out costs the action
    }

    const dl = this.hardDeadline();
    const timeLeft = dl === null ? 999 : dl - this.round;
    const budget = this.turnsToExit(h) + this.cfg.panicMargin;
    // urgent: stop sightseeing, head for the Office, but still fight through it.
    this.urgent = (this.cfg.timerKnown && dl !== null && timeLeft <= budget + 4)
      || this.collapseFrom !== null;
    // desperate: no chance of killing Greg in time -- run past him for the stairs.
    const lastOneStanding = this.standing().length <= 1 && this.bossKilledRound === null
      && this.monsters.some(m => m.alive && m.room === 9);
    const fleeing = (this.cfg.timerKnown && dl !== null && timeLeft <= budget - 2)
      || (this.collapseFrom !== null && this.bossKilledRound === null && timeLeft <= 2)
      || lastOneStanding;

    // Reviving a downed friend beats almost everything.
    const down = this.heroes.find(o => o.downed && !o.exited && !o.dead);
    if (down && !fleeing) {
      if (adjacent(h.pos, down.pos)) { this.revive(h, down); return; }
      const f = this.walkField(h);
      const spot = this.bestAdjacentSpot(f, down.pos, this.moveBudget(h));
      if (spot && this.rng.next() < 0.85) {
        this.walk(h, f, spot);
        if (adjacent(h.pos, down.pos)) { this.revive(h, down); return; }
        return;
      }
    }

    const target = this.pickTarget(h, fleeing);

    // Already in melee? Swing.
    if (target && adjacent(h.pos, target.pos) && !this.hasRanged(h)) {
      this.heroAttack(h, target); return;
    }
    if (target && this.hasRanged(h) && !adjacent(h.pos, target.pos) && los(this.board, h.pos, target.pos, this.openDoors)) {
      this.heroAttack(h, target); return;
    }
    // Scroll / spell from range when it is the better play.
    if (target && this.tryCast(h, target)) return;

    // Otherwise move toward the objective.
    const goal = this.goalCell(h, fleeing, target);
    if (goal) {
      const f = this.walkField(h);
      const dest = this.stepToward(h, f, goal, this.moveBudget(h));
      if (dest) this.walk(h, f, dest);
      else this.stuck++;
    }

    // Act after moving.
    const t2 = this.pickTarget(h, fleeing);
    if (fleeing || (this.bossKilledRound !== null && this.roomDone(9))) {
      if (this.onStairs(h)) { h.exited = true; return; }
    }
    if (t2 && adjacent(h.pos, t2.pos)) { this.heroAttack(h, t2); return; }
    if (t2 && this.hasRanged(h) && los(this.board, h.pos, t2.pos, this.openDoors)) { this.heroAttack(h, t2); return; }
    if (t2 && this.tryCast(h, t2)) return;
    if (this.tryInteract(h)) return;
    if (this.tryLearn(h)) return;
  }

  private moveBudget(h: Hero) { return this.moveDice(h); }

  private walkField(h: Hero): Field {
    return field(this.board, h.pos, this.heroPolicy(h));
  }

  private turnsToExit(h: Hero): number {
    const stairs = this.stairsCell();
    const f = field(this.board, h.pos, { ...this.heroPolicy(h), avoid: undefined });
    const d = f.dist[this.board.idx(stairs.x, stairs.y)];
    if (d >= 0x3fffffff) return 99;
    const bossLeft = this.bossKilledRound === null
      ? this.monsters.filter(m => m.alive && m.room === 9).length : 0;
    return Math.ceil(d / 7) + (bossLeft > 0 ? 3 : 0) + 1;
  }

  /** The round the floor starts coming apart, or null if the fuse isn't lit yet. */
  collapseBegins(): number | null {
    const cap = this.cfg.collapseRound;
    const fuse = this.bossDoorRound === null ? null : this.bossDoorRound + this.cfg.collapseAfterDoor;
    switch (this.cfg.collapseStart) {
      case "round": return cap;
      case "bossdoor": return fuse;
      case "both":
        if (cap === null) return fuse;
        return fuse === null ? cap : Math.min(cap, fuse);
    }
  }
  /** The round after which nobody left on the floor survives. */
  hardDeadline(): number | null {
    const b = this.collapseBegins();
    if (b === null) return null;
    return this.cfg.collapseMode === "hard" ? b : b + this.cfg.collapseGrace;
  }

  stairsCell(): Pt { return this.board.rooms.get(9)!.interact!.at; }
  onStairs(h: Hero) { return same(h.pos, this.stairsCell()); }

  private roomDone(id: number) { return !this.monsters.some(m => m.alive && m.room === id); }

  private roomTargetCache: { round: number; id: number } | null = null;
  /** The party moves as a group toward the nearest room it still owes a visit. */
  private currentRoom(): number {
    if (this.roomTargetCache?.round === this.round) return this.roomTargetCache.id;
    const lead = this.standing()[0] ?? this.living()[0] ?? this.heroes[0];
    const f = field(this.board, lead.pos, { ...this.heroPolicy(lead), occupied: () => false, avoid: undefined });
    const required = [1, 2, 5];
    const open = this.route.filter(id =>
      id !== 9 && (this.urgent ? required.includes(id) : true) &&
      (!this.roomDone(id) || (!this.urgent && this.board.rooms.get(id)!.interact && !this.usedInteract.has(id))));
    let best = 9, bd = Infinity;
    for (const id of open) {
      const c = this.board.center(id);
      const d = f.dist[this.board.idx(c.x, c.y)];
      if (d < bd) { bd = d; best = id; }
    }
    this.roomTargetCache = { round: this.round, id: best };
    return best;
  }

  private pickTarget(h: Hero, fleeing: boolean): Monster | null {
    const live = this.monsters.filter(m => m.alive && m.asleep === 0);
    if (!live.length) return null;
    const near = live.filter(m => adjacent(h.pos, m.pos));
    if (near.length) return this.bestOf(h, near);
    if (fleeing) return null;
    const room = this.currentRoom();
    const pool = live.filter(m => m.room === room || m.active ||
      los(this.board, h.pos, m.pos, this.openDoors));
    if (!pool.length) return null;   // nothing to fight: go do the objective
    // reachable-ish: prefer nearest by path
    const f = this.walkField(h);
    let best: Monster | null = null, bestD = Infinity;
    for (const m of pool) {
      const d = this.adjacentDist(f, m.pos);
      const pri = this.priority(h, m);
      const score = d - pri * 4;
      if (score < bestD) { bestD = score; best = m; }
    }
    return best;
  }

  /** Higher = kill first. */
  private priority(h: Hero, m: Monster): number {
    let p = 0;
    if (m.def.boss) p -= 1;
    // Delegation: kill the staff first (only if the party is paying attention)
    if (m.room === 9 && !m.def.boss && this.rng.next() < this.cfg.competence) p += 3;
    if (m.def.id === "goblin" && this.items(h).some(i => i.goblinAversion)) p -= 1;
    if (m.hp === 1) p += 0.5;
    return p;
  }

  private bestOf(h: Hero, ms: Monster[]): Monster {
    let best = ms[0], bs = -Infinity;
    for (const m of ms) {
      const s = this.priority(h, m) - m.def.def * 0.3;
      if (s > bs) { bs = s; best = m; }
    }
    return best;
  }

  private adjacentDist(f: Field, p: Pt): number {
    let best = Infinity;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + d[0], y = p.y + d[1];
      if (!this.board.inBounds(x, y)) continue;
      best = Math.min(best, f.dist[this.board.idx(x, y)]);
    }
    return best;
  }

  private bestAdjacentSpot(f: Field, p: Pt, budget: number): Pt | null {
    let best: Pt | null = null, bd = Infinity;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + d[0], y = p.y + d[1];
      if (!this.board.inBounds(x, y)) continue;
      const dist = f.dist[this.board.idx(x, y)];
      if (dist <= budget && dist < bd) { bd = dist; best = { x, y }; }
    }
    return best;
  }

  private goalCell(h: Hero, fleeing: boolean, target: Monster | null): Pt | null {
    if (fleeing || (this.bossKilledRound !== null && this.roomDone(9))) return this.stairsCell();
    if (target) return target.pos;
    const room = this.currentRoom();
    const rd = this.board.rooms.get(room)!;
    if (!this.roomDone(room)) return this.board.center(room);
    if (rd.interact && !this.usedInteract.has(room) && !this.urgent) return rd.interact.at;
    return this.stairsCell();
  }

  /** Choose the reachable cell within budget that gets closest to `goal`. */
  /** Sources for a goal field: the goal itself, or the squares beside it if it
   *  is a piece of furniture you can only reach by standing next to it. */
  private goalSources(goal: Pt): Pt[] {
    if (this.board.isFloor(goal.x, goal.y)) return [goal];
    const out: Pt[] = [];
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const p = { x: goal.x + d[0], y: goal.y + d[1] };
      if (this.board.isFloor(p.x, p.y)) out.push(p);
    }
    return out.length ? out : [goal];
  }

  private goalField(h: Hero, goal: Pt): Field {
    const k = `${goal.x},${goal.y}`;
    let gf = this.goalFieldCache.get(k);
    if (!gf) {
      gf = field(this.board, this.goalSources(goal), { ...this.heroPolicy(h), occupied: () => false });
      this.goalFieldCache.set(k, gf);
    }
    return gf;
  }

  private stepToward(h: Hero, f: Field, goal: Pt, budget: number): Pt | null {
    const gf = this.goalField(h, goal);
    let best: Pt | null = null, bs = Infinity;
    for (let y = 0; y < this.board.h; y++) for (let x = 0; x < this.board.w; x++) {
      const i = this.board.idx(x, y);
      if (f.dist[i] > budget) continue;
      if (this.standing().some(o => o !== h && o.pos.x === x && o.pos.y === y)) continue;
      const g = gf.dist[i];
      if (g >= 0x3fffffff) continue;
      const s = g * 100 + f.dist[i];    // closest to goal, then fewest steps
      if (s < bs) { bs = s; best = { x, y }; }
    }
    return best;
  }

  private walk(h: Hero, f: Field, dest: Pt) {
    const path = pathTo(this.board, f, dest);
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1], to = path[i];
      const di = this.board.doorIndex(from, to);
      if (di >= 0 && !this.openDoors[di]) this.openDoor(h, di, from, to);
      h.pos = { ...to };
      if (this.enterCell(h)) break;      // pit stops movement
      if (h.downed) break;
    }
    if (this.has(h, i => !!i.torch)) this.torchReveal(h);
  }

  private openDoor(h: Hero, di: number, from: Pt, to: Pt) {
    const d = this.board.doors[di];
    this.openDoors[di] = 1;
    this.doorVersion++; this.goalFieldCache.clear();
    if (d.trap === "block") {
      this.stats.traps++;
      this.award("Found It With Your Face", [{ name: "Football Helmet", slot: "head", trapImmuneOnce: true }]);
      if (!this.absorbTrap(h) && rollShields(this.rng, 1, false) === 0) this.damage(h, 2);
    }
    if ((this.board.roomIdAt(from) === 9 || this.board.roomIdAt(to) === 9) && this.bossDoorRound === null)
      this.bossDoorRound = this.round;
    if (d.kind === "locked" && !this.has(h, i => !!i.unlocks)) {
      // Knocking: the two Orcs each get a free swing at the knocker.
      for (const m of this.monsters.filter(m => m.alive && m.room === 9 && !m.def.boss)) {
        m.active = true;
        this.monsterAttack(m, h);
      }
    } else if (d.kind === "locked") {
      const key = this.find(h, i => !!i.unlocks && i.unlocks < 99);
      if (key) { key.unlocks = 0; this.dropItem(h, key); }
    }
  }

  private dropItem(h: Hero, item: Item) {
    for (let i = 0; i < h.trinkets.length; i++) if (h.trinkets[i] === item) h.trinkets[i] = null;
    h.pack = h.pack.filter(p => p !== item);
  }

  /** Torch: lights the room you walk into, and finds secret doors you walk past. */
  private torchReveal(h: Hero) {
    for (const t of FLOOR1.corridorTraps)
      if (dist1(t.at, h.pos) <= 2) this.revealedTraps.add(`${t.at.x},${t.at.y}`);
    this.board.doors.forEach((d, i) => {
      if (d.kind === "secret" && (dist1(d.a, h.pos) <= 1 || dist1(d.b, h.pos) <= 1)) this.foundSecrets[i] = 1;
    });
    const rid = this.board.roomIdAt(h.pos);
    if (rid === null) return;
    const r = this.board.rooms.get(rid)!;
    if (r.trap) this.revealedTraps.add(`${r.trap.at.x},${r.trap.at.y}`);
  }

  /** Returns true if movement must stop. */
  private enterCell(h: Hero): boolean {
    const k = `${h.pos.x},${h.pos.y}`;
    if (this.spentTraps.has(k)) return false;
    const rid = this.board.roomIdAt(h.pos);
    const room = rid !== null ? this.board.rooms.get(rid)! : null;
    const trap = (room?.trap && same(room.trap.at, h.pos)) ? room.trap
      : FLOOR1.corridorTraps.find(t => same(t.at, h.pos));
    if (!trap) return false;
    this.spentTraps.add(k);
    this.revealedTraps.add(k);
    this.stats.traps++;
    this.award("Found It With Your Face", [{ name: "Football Helmet", slot: "head", trapImmuneOnce: true }]);
    if (this.absorbTrap(h)) return trap.kind === "pit";
    if (trap.kind === "pit") {
      if (!this.has(h, i => !!i.rope)) { this.damage(h, 1); h.inPit = true; }
      return true;
    }
    this.damage(h, rollSkulls(this.rng, 1) > 0 ? 2 : 1);
    return false;
  }

  private absorbTrap(h: Hero): boolean {
    if (this.items(h).some(i => i.trapImmuneOnce) && !h.trapImmuneUsed) { h.trapImmuneUsed = true; return true; }
    return false;
  }

  private maybeHeal(h: Hero) {
    const threshold = this.monsters.some(m => m.alive && m.active && dist1(m.pos, h.pos) <= 3) ? 3 : 2;
    while (h.hp <= threshold && h.hp < h.maxHp) {
      const c = h.pack.find(i => i.use === "heal4") ?? h.pack.find(i => i.use === "heal3")
        ?? h.pack.find(i => i.use === "heal1");
      if (!c) break;
      h.pack = h.pack.filter(x => x !== c);
      h.hp = Math.min(h.maxHp, h.hp + (c.use === "heal4" ? 4 : c.use === "heal3" ? 3 : 1));
    }
  }

  private revive(h: Hero, down: Hero) {
    const bandage = h.pack.find(i => i.use === "heal1");
    if (bandage) h.pack = h.pack.filter(x => x !== bandage);
    down.downed = false; down.hp = this.cfg.reviveHp;
  }

  private hasRanged(h: Hero) { return !!h.equip.main?.ranged; }

  private tryCast(h: Hero, target: Monster): boolean {
    if (!los(this.board, h.pos, target.pos, this.openDoors)) return false;
    const spark = h.learned.find(l => l.item.spell?.id === "spark" && l.cd === 0);
    if (spark && (!adjacent(h.pos, target.pos) || 2 > this.atk(h))) {
      spark.cd = spark.item.spell!.cooldown;
      this.resolveAttack(h, target, 2);
      return true;
    }
    if (this.rng.next() > this.cfg.competence) return false;
    const fb = h.pack.find(i => i.use === "firebolt");
    if (fb && (target.def.boss || target.hp > 1)) {
      h.pack = h.pack.filter(x => x !== fb);
      this.resolveAttack(h, target, 3);
      return true;
    }
    const sleep = h.pack.find(i => i.use === "sleep");
    if (sleep && !target.def.undead && (target.def.boss || target.def.id === "orc" || target.def.id === "abomination")
      && this.heroes.some(x => x.hp <= 3)) {
      h.pack = h.pack.filter(x => x !== sleep);
      target.asleep = 2;
      return true;
    }
    return false;
  }

  private heroAttack(h: Hero, m: Monster) {
    let dice = this.atk(h) + h.energy;
    const ranged = h.equip.main?.ranged;
    if (ranged) {
      if (adjacent(h.pos, m.pos)) dice = 1;      // can't use the bow point-blank
      else dice = ranged.dice + h.energy;
    }
    if (h.equip.main?.bonusVs1hp && m.hp === 1) dice += h.equip.main.bonusVs1hp;
    // Energy Drink: spend it when it might matter.
    if (!h.energy && this.rng.next() < this.cfg.competence * 0.5) {
      const e = h.pack.find(i => i.use === "energy");
      if (e && (m.def.boss || m.def.def >= 3)) { h.pack = h.pack.filter(x => x !== e); dice += 1; }
    }
    h.energy = 0;
    this.resolveAttack(h, m, dice);
  }

  private resolveAttack(h: Hero, m: Monster, dice: number) {
    let skulls = rollSkulls(this.rng, dice);
    if (skulls === 0 && h.equip.main?.fragile) h.equip.main = null;   // the stick snaps
    if (skulls === 0 && !h.rerollUsed && this.items(h).some(i => i.reroll)) {
      h.rerollUsed = true;
      skulls = rollSkulls(this.rng, dice);
    }
    if (skulls === 0 && this.fanReroll > 0) {      // Applause, from the cheap seats
      this.fanReroll--;
      skulls = rollSkulls(this.rng, dice);
    }
    let defDice = m.def.def;
    if (m.def.boss && this.monsters.some(o => o.alive && o.room === 9 && !o.def.boss)) defDice += 1; // Delegation
    const shields = rollShields(this.rng, defDice, true);
    const dmg = Math.max(0, skulls - shields);
    if (dmg > 0) this.hurtMonster(m, dmg, h);
  }

  private hurtMonster(m: Monster, dmg: number, killer: Hero | null) {
    m.hp -= dmg;
    m.active = true;
    if (m.room === 9 && this.bossEngagedRound === null) this.bossEngagedRound = this.round;
    if (m.hp > 0) return;
    m.alive = false;
    this.stats.kills++;
    this.award("First Blood", [{ name: "Juice Box", slot: "pack", use: "heal3" }, { name: "Gold (3)", slot: "pack", gold: 3 }]);
    if (m.def.boss) {
      this.bossKilledRound = this.round;
      this.heroHpAtBossKill = this.heroes.reduce((a, h) => a + Math.max(0, h.hp), 0);
    }
    if (!killer) {
      this.award("Trap Chef", [{ name: "Spellbook: Shove", slot: "learned", spell: { id: "shove", cooldown: 2 } }]);
      return;
    }
    const roll = this.rng.d6();
    let kind = m.def.loot(roll);
    if (this.cfg.lootRich && roll === 5 && (m.def.id === "orc" || m.def.id === "zombie")) kind = "gear";
    if (this.cfg.lootRich && roll >= 4 && m.def.id === "skeleton") kind = roll === 6 ? "gear" : "pockets";
    if (kind !== "none") {
      const item = this.draw(kind === "big" ? "big" : kind === "gear" ? "gear" : "pockets");
      if (item) this.give(killer, item);
    }
    if (m.def.boss) {
      const b = this.draw("big"); if (b) this.give(killer, b);
    }
  }

  private tryInteract(h: Hero): boolean {
    const rid = this.board.roomIdAt(h.pos);
    if (rid === null) return false;
    const r = this.board.rooms.get(rid)!;
    if (!r.interact || this.usedInteract.has(rid)) return false;
    if (!adjacent(h.pos, r.interact.at) && !same(h.pos, r.interact.at)) return false;
    if (this.monsters.some(m => m.alive && m.active && dist1(m.pos, h.pos) <= 2)) return false;
    const w = r.interact.what;
    if (w.kind === "stairs") return false;
    if (this.urgent) return false;
    if (w.kind === "cage") { this.usedInteract.add(rid); h.goose = 2; return true; }
    if (w.kind === "chest") {
      if (this.has(h, i => !!i.unlocks)) {
        const key = this.find(h, i => !!i.unlocks)!;
        if (key.unlocks! < 99) { key.unlocks = 0; this.dropItem(h, key); }
      } else if (rollSkulls(this.rng, this.mind(h)) === 0) {
        // Failed pick: it screams, and a goblin comes running.
        const g = this.monsters.find(m => m.alive && m.def.id === "goblin" && !m.active);
        if (g) g.active = true;
        return true;
      }
      this.usedInteract.add(rid);
      const it = this.draw("big"); if (it) this.give(h, it);
      return true;
    }
    this.usedInteract.add(rid);
    const deck = w.kind === "shelf" ? (this.mind(h) >= 4 ? "big" : "gear")
      : w.kind === "rack" ? "gear" : "pockets";
    if (w.kind === "rack" && this.cfg.guaranteedSpellbook) {
      const bk = this.decks.big.find(x => x.slot === "learned");
      if (bk) { this.decks.big = this.decks.big.filter(x => x !== bk); this.give(h, bk); }
    }
    const it = this.draw(deck as any); if (it) this.give(h, it);
    if (w.kind === "rack" && this.cfg.richRack) { const it2 = this.draw("gear"); if (it2) this.give(h, it2); }
    if (w.kind === "toilet") this.award("Why Would You Do That", [{ name: "Energy Drink", slot: "pack", use: "energy" }]);
    return true;
  }

  private tryLearn(h: Hero): boolean {
    if (this.mind(h) < 4) return false;
    const bk = h.pack.find(i => i.slot === "learned");
    if (!bk) return false;
    h.pack = h.pack.filter(x => x !== bk);
    h.learned.push({ item: bk, cd: 0 });
    this.award("Nerd", [{ name: "Scroll: Firebolt", slot: "pack", use: "firebolt" },
      { name: "Orc Monocle", slot: "head", mind: 1 }]);
    return true;
  }

  // --- monsters ------------------------------------------------------------

  private monsterPhase() {
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (m.cd > 0) m.cd--;
      if (m.asleep > 0) { m.asleep--; continue; }
      if (!m.active) {
        const doorOpen = this.board.doors.some((d, i) =>
          (this.board.roomIdAt(d.a) === m.room || this.board.roomIdAt(d.b) === m.room) && !!this.openDoors[i]);
        const seen = this.standing().some(h => los(this.board, m.pos, h.pos, this.openDoors));
        if (doorOpen && seen) m.active = true;
        else continue;
      }
      const targets = this.standing();
      if (!targets.length) continue;

      if (m.def.boss && m.cd === 0) {
        const vis = targets.filter(h => los(this.board, m.pos, h.pos, this.openDoors));
        if (vis.length) {
          const t = vis.reduce((a, b) => (this.gearCount(b) > this.gearCount(a) ? b : a));
          m.cd = 2;
          this.monsterAttack(m, t, 2);   // Performance Review
          continue;
        }
      }

      const near = targets.filter(h => adjacent(m.pos, h.pos));
      if (near.length) { this.monsterAttack(m, this.chooseVictim(m, near)); continue; }

      const p = this.monsterPolicy(m);
      const f = field(this.board, m.pos, p);
      let best: Pt | null = null, bd = Infinity, victim: Hero | null = null;
      for (const h of targets) {
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const x = h.pos.x + d[0], y = h.pos.y + d[1];
          if (!this.board.inBounds(x, y)) continue;
          if (this.revealedTraps.has(`${x},${y}`) && !this.spentTraps.has(`${x},${y}`)) continue;
          const dist = f.dist[this.board.idx(x, y)];
          if (dist <= m.def.move && dist < bd) { bd = dist; best = { x, y }; victim = h; }
        }
      }
      if (best && victim) {
        const path = pathTo(this.board, f, best);
        for (let i = 1; i < path.length; i++) {
          const c = path[i];
          const k = `${c.x},${c.y}`;
          m.pos = { ...c };
          if (this.revealedTraps.has(k) && !this.spentTraps.has(k)) break;
        }
        if (this.monsterStepTraps(m)) continue;
        if (adjacent(m.pos, victim.pos)) this.monsterAttack(m, victim);
      } else {
        // shuffle toward the nearest hero anyway
        let bh: Hero | null = null, bdd = Infinity;
        for (const h of targets) {
          const d = this.adjacentDist(f, h.pos);
          if (d < bdd) { bdd = d; bh = h; }
        }
        if (bh) {
          const spot = this.bestAdjacentSpot(f, bh.pos, m.def.move);
          if (spot) {
            const path = pathTo(this.board, f, spot);
            m.pos = { ...path[Math.min(path.length - 1, m.def.move)] };
            if (adjacent(m.pos, bh.pos)) this.monsterAttack(m, bh);
          }
        }
      }
      if (m.def.boss && this.bossEngagedRound === null &&
        targets.some(h => dist1(h.pos, m.pos) <= 2)) this.bossEngagedRound = this.round;
    }
    if (this.bossEngagedRound === null) {
      const boss = this.monsters.find(m => m.def.boss);
      if (boss && boss.active) this.bossEngagedRound = this.round;
    }
  }

  /** Rule 4.3.3. Returns true if the trap killed it. This is how Trap Chef fires. */
  private monsterStepTraps(m: Monster): boolean {
    const k = `${m.pos.x},${m.pos.y}`;
    if (this.spentTraps.has(k)) return false;
    const rid = this.board.roomIdAt(m.pos);
    const room = rid !== null ? this.board.rooms.get(rid)! : null;
    const trap = (room?.trap && same(room.trap.at, m.pos)) ? room.trap
      : FLOOR1.corridorTraps.find(t => same(t.at, m.pos));
    if (!trap) return false;
    this.spentTraps.add(k); this.revealedTraps.add(k);
    const dmg = trap.kind === "pit" ? 1 : (rollSkulls(this.rng, 1) > 0 ? 2 : 1);
    this.hurtMonster(m, dmg, null);
    return !m.alive;
  }

  private chooseVictim(m: Monster, near: Hero[]): Hero {
    let pool = near;
    if (m.def.id === "goblin") {
      const ok = near.filter(h => !this.items(h).some(i => i.goblinAversion));
      if (ok.length) pool = ok;
    }
    return pool.reduce((a, b) => {
      const da = this.def(a), db = this.def(b);
      if (db !== da) return db < da ? b : a;
      return b.hp < a.hp ? b : a;
    });
  }

  private monsterAttack(m: Monster, h: Hero, diceOverride?: number) {
    // A Viewer takes one attack off the table (Banana Peel, Slow Clap, Boo!).
    if (this.fanShield > 0) { this.fanShield--; return; }
    // Goose: soaks a hit on a skull.
    if (h.goose > 0 && rollSkulls(this.rng, 1) > 0) { h.goose--; return; }
    const nope = this.living().flatMap(x => x.learned).find(l => l.item.spell?.id === "nope" && l.cd === 0);
    if (nope && h.hp <= 2) { nope.cd = 3; return; }
    const skulls = rollSkulls(this.rng, diceOverride ?? m.def.atk);
    const shields = rollShields(this.rng, this.def(h), false);
    const dmg = Math.max(0, skulls - shields);
    if (dmg > 0) this.damage(h, dmg);
  }

  private damage(h: Hero, n: number) {
    // Smoke Bomb / Stone Skin get spent reactively by a competent party.
    h.hp -= n;
    if (h.hp <= 0) {
      const sc = h.pack.find(i => i.use === "heal4" || i.use === "heal3");
      if (sc && this.rng.next() < this.cfg.competence * 0.4) {
        h.pack = h.pack.filter(x => x !== sc);
        h.hp = sc.use === "heal4" ? 4 : 3;
        return;
      }
      h.hp = 0; h.downed = true; h.downedRound = this.round; h.inPit = false;
      this.stats.downs++; this.lastDownRound = this.round;
    }
  }
}

export function simulate(cfg: Partial<Config>): Result {
  return new Game(cfg).run();
}
