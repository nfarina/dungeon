import { Board, adjacent, dist1, same, type FloorDef, type Pt } from "./board";
import { RNG, rollSkulls, rollShields } from "./rng";
import { ek, edgePassable, field, los, pathTo, type EdgePolicy, type Field } from "./pathing";
import { FLOOR1 } from "./content/floor1-map";
import { CARRYOVER, FIXED_LOOT, FLOOR2, item as namedItem } from "./content/floor2";
import { ALL_MONSTERS, FED_FORM, type MonsterDef } from "./content/monsters";
import { BIG_GEAR, FLOOR2_DECKS, FLOOR2_ITEMS, GEAR, KITS, POCKETS, clone, type Item, type Slot } from "./content/items";

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
  /** Use the map's placed monster squares (false = scatter every room's list at random). */
  placedMonsters: boolean;
  /** Rule 4.3.3: monsters never step on any trap (false = only revealed ones, the old rule). */
  monstersAvoidAllTraps: boolean;
  /** Rule 6.3: casting needs Mind 4+ every time (false = only learning). */
  castNeedsMind: boolean;
  /** Rules 1.2/1.5: swapping gear and trading cost the action in combat (false = always free). */
  combatSwapCosts: boolean;
  maxRounds: number;
  /** Which floor. 2 switches the map, the monsters, the decks and the Cleanup Crew rules on. */
  floor: 1 | 2;
  /** "kits": fresh crawlers picking Starting Kits. "carryover": the real party as it left Floor 1 (content/floor2.ts). */
  party: "kits" | "carryover";
  /** Floor 2 hero brain: "cleaner" spends actions and bleach on corpses; "runner" never does. */
  cleanPolicy: "cleaner" | "runner";
  /** Floor 2: a grub joins the stairwell queue every `grubEvery` rounds from round `grubFrom`; at most `grubCap` alive. */
  grubEvery: number;
  grubFrom: number;
  grubCap: number;
  /** Floor 2: grubs that ever join the queue, over the whole floor. The printed tile count. Infinity = no limit. */
  grubBudget: number;
  /** Floor 2: a squashed grub goes back into the stairwell queue instead of leaving the floor (it doesn't use up the budget). */
  grubsReturn: boolean;
  /** Floor 2: a grub walks toward the largest corpse it can reach (ties to the nearest), not simply the nearest. */
  grubsPreferLarge: boolean;
  /** Floor 2: Spark (like the goose) only cleans small corpses; medium and large need bleach, the Mop or Mop-Up. */
  sparkSmallOnly: boolean;
  /** Floor 2: the Sump door swings shut once the whole party is inside, so the Cleanup Crew stays out of the boss fight. */
  sumpDoorCloses: boolean;
  /** Floor 2: a locked chest opens for a Skeleton Key only. The Fire Axe opens everything on Floor 1, which is too easy. */
  chestKeyOnly: boolean;
  grubMove: number;
  fedMove: number;
  /** Floor 2: opening the boss door empties the queue and puts the schedule on every round. */
  allHands: boolean;
  /** Floor 2: All Hands also puts one grub on the boss door itself, so the Crew arrives as the party goes in. */
  allHandsAtDoor: boolean;
  /** Floor 2: the boss eats corpses in its room to heal. */
  bossSnack: boolean;
  /** Record the story of the game in `events` (and print it). */
  trace: boolean;
  /** Keep a snapshot of the board after every hero turn and every DM phase, with a play-by-play, in `frames`.
   *  Draws no dice, so a recorded game plays out exactly like an unrecorded one. For the map editor's Sim view. */
  record: boolean;
  /** Play on this floor instead of the built-in map for `floor` (the editor sends its unsaved map). */
  floorDef: FloorDef | null;
  /** How the party picks its next room. "route": it knows the floor and walks its route (Floor 1, quest-sheet style).
   *  "blind": it does not know which room holds the password, so it opens the nearest unexplored door until it has it,
   *  then heads for the boss room, detouring only into `optionalRooms` it has not seen yet. */
  explore: "route" | "blind";
  /** Floor 2 tuning: added to every fed janitor's Defend / Health (negative to soften them). */
  fedDef: number;
  fedHp: number;
  /** Floor 2: Snack is free (the boss still attacks that turn) instead of being its action. As written it is free;
   *  as an action it is a gift to the party (about four points of win rate the other way). */
  snackFree: boolean;
  snackHeal: number;
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
  placedMonsters: true,
  monstersAvoidAllTraps: true,
  castNeedsMind: true,
  combatSwapCosts: true,
  maxRounds: 80,
  floor: 1,
  party: "kits",
  cleanPolicy: "cleaner",
  grubEvery: 2,
  grubFrom: 2,
  grubCap: 6,
  grubBudget: Infinity,
  grubsReturn: true,
  grubsPreferLarge: true,
  sparkSmallOnly: true,
  sumpDoorCloses: true,
  chestKeyOnly: false,
  grubMove: 4,
  fedMove: 6,
  allHands: true,
  allHandsAtDoor: true,
  bossSnack: true,
  trace: false,
  record: false,
  floorDef: null,
  explore: "route",
  fedDef: 0,
  fedHp: 0,
  snackFree: false,
  snackHeal: 2,
};

/** The Floor 2 ruleset as written in floor-2.md. Spread over RECOMMENDED-style dials in floor2.ts. */
export const FLOOR2_CONFIG: Partial<Config> = {
  floor: 2, party: "carryover",
  collapseStart: "round", collapseMode: "hard",
  lootRich: true, snackFree: true, explore: "blind", chestKeyOnly: true,
  collapseRound: 48, grubEvery: 3, grubBudget: 8,
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
  /** Gear picked up in combat, waiting for a quiet turn to equip (rule 1.2). */
  pending: Item[];
  trapImmuneUsed: boolean;
  rerollUsed: boolean;
  capeUsed: boolean;
  bookmarkUsed: boolean;
  energy: number;          // pending +1 attack die
  stoneSkin: boolean;
  goose: number;           // goose hp, 0 = none
  /** Floor 2: the goose is Downed (round it went down), -99 = not down. Dead geese have goose 0 and gooseDown -1. */
  gooseDown: number;
  gooseMax: number;
  biscuit: boolean;
  deaths: number;
};

export type Corpse = { pos: Pt; size: "small" | "medium" | "large" };

export type Monster = {
  def: MonsterDef; pos: Pt; hp: number; room: number;
  active: boolean; asleep: number; alive: boolean; cd: number;
};

export type Floor2Stats = {
  corpsesMade: number; corpsesCleaned: number; corpsesLeft: number; bleachUsed: number; bleachFound: number;
  /** Corpses by size: made over the game, and cleaned by a hero (bleach, Mop, Spark, Mop-Up, goose, pit). */
  madeBySize: Record<Corpse["size"], number>; cleanedBySize: Record<Corpse["size"], number>;
  /** Bleach still in the party's packs when the game ended. */
  bleachLeft: number;
  janitorsFed: { small: number; medium: number; large: number }; janitorsKilled: number; grubsKilled: number;
  bossSnacks: number; chasedRounds: number; passwordRound: number | null; allHandsRound: number | null;
  cleanedBy: { bleach: number; spark: number; goose: number; pit: number };
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
  room2ExitRound: number | null;
  /** Rooms the party opened a (non-secret) door into by the end. */
  roomsOpened: number;
  /** True if the floor-wide cap, not the boss fuse, is what started the collapse. */
  capBound: boolean;
  /** Floor 2 only. */
  f2: Floor2Stats | null;
  deadNames: string[];
};

/** One step of a recorded game: the board as it stands after a hero's turn or the DM's phase. */
export type Frame = {
  round: number;
  /** "start" before round 1, "hero" after one hero's turn, "dm" after monsters, grubs and the end of the round. */
  phase: "start" | "hero" | "dm";
  who: string | null;
  /** What happened during this step, in order. */
  lines: string[];
  heroes: {
    name: string; x: number; y: number; hp: number; maxHp: number;
    downed: boolean; dead: boolean; exited: boolean; inPit: boolean;
    goose: number; gooseMax: number; gold: number;
    atk: number; def: number; mind: number;
    equip: string[]; pack: string[]; learned: string[];
  }[];
  monsters: {
    key: string; id: string; name: string; x: number; y: number; hp: number; maxHp: number;
    alive: boolean; active: boolean; asleep: number; janitor: "grub" | "fed" | null; boss: boolean; password: boolean;
  }[];
  corpses: Corpse[];
  /** Doors by their two squares, so the page can match them to the map file without sharing indices. */
  openDoors: [Pt, Pt][];
  foundSecrets: [Pt, Pt][];
  revealedTraps: Pt[];
  spentTraps: Pt[];
  /** Rooms whose furniture has been used. */
  usedFurniture: number[];
  /** Where each figure walked this step: hero name or monster key, then the squares in order. */
  trails: { key: string; hero: boolean; path: Pt[] }[];
  /** Room the party is heading for, when the brain has decided this round. */
  goalRoom: number | null;
  urgent: boolean;
  queue: number;
  collapseBegins: number | null;
  deadline: number | null;
  collapsing: boolean;
  achievements: string[];
  /** Set on the last frame. */
  outcome: Result["outcome"] | null;
  /** A hero frame played by an AI brain: what it was offered and how it chose. */
  decision: HeroDecision | null;
};

/** One AI-made hero turn, as shown in the Sim view. */
export type HeroDecision = {
  player: string;
  /** Weight on the person's habits; the rest is "what a sensible player would do". */
  personality: number;
  /** `p` is the blend actually rolled from; `persona` and `sensible` are the two answers behind it. */
  options: { key: string; label: string; p: number; persona: number; sensible: number }[];
  chosen: string;
  /** False when the brain rolled a less likely option instead of the favourite. */
  favourite: boolean;
  /** 0..2: how tense the moment looks from the table. */
  tension: number | null;
  /** Probability the kids at the table are into it. */
  engaged: number | null;
  ms: number;
  cached: boolean;
  error: string | null;
};

/** Plays one hero's whole turn. The rules-and-geometry half stays in Game; a brain only decides. */
export type HeroBrain = (game: Game, h: Hero) => Promise<void>;

const SLOTS: Slot[] = ["main", "off", "body", "head", "feet"];
/** `Monster.room` for a guard standing in a corridor: no room, so no door and no room to clear. */
const CORRIDOR_GUARD = -2;

export class Game {
  floor: FloorDef;
  board: Board;
  /** The room with the stairs (Floor 1: the Office; Floor 2: the Sump). */
  bossRoom: number;
  requiredRooms: number[];
  /** Floor 2. */
  corpses: Corpse[] = [];
  queue = 0;
  grubsQueuedTotal = 0;
  allHandsOn = false;
  f2: Floor2Stats = { corpsesMade: 0, corpsesCleaned: 0, corpsesLeft: 0, bleachUsed: 0, bleachFound: 0,
    madeBySize: { small: 0, medium: 0, large: 0 }, cleanedBySize: { small: 0, medium: 0, large: 0 }, bleachLeft: 0,
    janitorsFed: { small: 0, medium: 0, large: 0 }, janitorsKilled: 0, grubsKilled: 0, bossSnacks: 0, chasedRounds: 0,
    passwordRound: null, allHandsRound: null, cleanedBy: { bleach: 0, spark: 0, goose: 0, pit: 0 } };
  events: string[] = [];
  log(msg: string) {
    if (this.cfg.record) this.said.push(msg);
    if (!this.cfg.trace) return;
    const line = `r${String(this.round).padStart(2)}  ${msg}`; this.events.push(line); console.log(line);
  }
  /** Play-by-play for recorded games only. Call as `this.cfg.record && this.say(...)` so batches never build the string. */
  say(msg: string) { this.said.push(msg); }
  frames: Frame[] = [];
  /** Called with every frame as it is recorded, for streaming a game that is still being played. */
  onFrame: ((f: Frame) => void) | null = null;
  /** Set by a brain during a hero turn; attached to that turn's frame. */
  decision: HeroDecision | null = null;
  said: string[] = [];
  private trails: Frame["trails"] = [];
  private trail(key: string, hero: boolean, path: Pt[]) { if (this.cfg.record && path.length > 1) this.trails.push({ key, hero, path: path.map(p => ({ ...p })) }); }
  private monKey(m: Monster) { return `m${this.monsters.indexOf(m)}`; }
  rng: RNG;
  cfg: Config;
  heroes: Hero[] = [];
  monsters: Monster[] = [];
  /** Spellbook: Spark, pulled from the Big Gear deck at setup and left on the Armory rack (section 3). */
  rackBook: Item | null = null;
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
  /** Round the party first opened a door leading out of Room 2 (the snack table). */
  room2ExitRound: number | null = null;
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
    this.floor = this.cfg.floorDef ?? (this.cfg.floor === 2 ? FLOOR2 : FLOOR1);
    this.board = new Board(this.floor);
    const stairsRoom = this.floor.rooms.find(r => r.interact?.what.kind === "stairs");
    if (!stairsRoom) throw new Error("the floor has no stairs");
    this.bossRoom = stairsRoom.id;
    this.requiredRooms = this.floor.rooms.filter(r => r.required && r.id !== this.bossRoom).map(r => r.id);
    this.openDoors = new Uint8Array(this.board.doors.length);
    this.foundSecrets = new Uint8Array(this.board.doors.length);
    this.rng = new RNG(this.cfg.seed);
    this.decks = this.buildDecks();
    this.setupHeroes();
    this.setupMonsters();
    const optional = this.cfg.optionalRooms;
    this.route = this.floor.rooms.map(r => r.id)
      .filter(r => r === this.bossRoom || this.requiredRooms.includes(r) || optional.includes(r));
  }

  /** Every room that is neither required nor the boss room: what a party may detour into. */
  optionalRoomIds(): number[] {
    return this.floor.rooms.map(r => r.id).filter(r => r !== this.bossRoom && !this.requiredRooms.includes(r));
  }

  // --- setup ---------------------------------------------------------------

  private buildDecks() {
    if (this.cfg.floor === 2) {
      const mk = (src: Item[]) => this.rng.shuffle(src.map(clone));
      return { pockets: mk(FLOOR2_DECKS.pockets), gear: mk(FLOOR2_DECKS.gear), big: mk(FLOOR2_DECKS.big) };
    }
    // Loot-box exclusives are pulled out of the decks, per floor-1.md.
    // Envelopes: Found It With Your Face (Helmet), Nerd (Firebolt + Bookmark), Trap Chef (Fire Axe).
    const pulled = new Set(["Football Helmet", "Scroll: Firebolt", "Fire Axe"]);
    const mk = (src: Item[]) => this.rng.shuffle(src.filter(i => !pulled.has(i.name)).map(clone));
    const decks = { pockets: mk(POCKETS), gear: mk(GEAR), big: mk(BIG_GEAR) };
    if (this.cfg.guaranteedSpellbook) {
      const spark = decks.big.find(i => i.name === "Spellbook: Spark") ?? null;
      if (spark) { decks.big = decks.big.filter(i => i !== spark); this.rackBook = spark; }
    }
    return decks;
  }

  /**
   * Everyone starts stacked on the entrance square; at the table the stairs up
   * sit off the board beside it, so there's room for the figures. They spread
   * out on turn one. If the entrance is somehow unwalkable, fall back to the
   * nearest square that isn't -- the editor's checks flag that case anyway.
   */
  private startSpots(n: number): Pt[] {
    const e = this.floor.entrance;
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
        trapImmuneUsed: false, rerollUsed: false, capeUsed: false, bookmarkUsed: false, energy: 0, stoneSkin: false,
        goose: 0, gooseDown: -99, gooseMax: 2, biscuit: false, deaths: 0, pending: [],
      };
      if (this.cfg.party === "carryover") {
        const c = CARRYOVER[i] ?? CARRYOVER[0];
        h.name = c.name;
        for (const [slot, nm] of Object.entries(c.equip)) if (nm) h.equip[slot] = namedItem(nm);
        c.trinkets.forEach((nm, k) => { h.trinkets[k] = namedItem(nm); });
        for (const nm of c.learned) h.learned.push({ item: namedItem(nm), cd: 0 });
        for (const nm of c.pack) h.pack.push(namedItem(nm));
        if (c.goose) { h.goose = c.goose; h.gooseMax = c.goose; }
      } else {
        for (const item of KITS[this.cfg.kits[i]].map(clone)) this.give(h, item);
      }
      this.heroes.push(h);
    });
    // "Sharing Is Caring" is free: someone hands someone a card on turn one.
    if (this.cfg.floor === 1) this.award("Sharing Is Caring", [{ name: "Gold (2)", slot: "pack", gold: 2 }]);
  }

  private setupMonsters() {
    // Corridor guards: no room, so no door to open and nothing to clear. They wake when somebody sees them.
    for (const c of this.floor.corridorMonsters ?? []) {
      const def = ALL_MONSTERS[c.id];
      if (!def) throw new Error(`unknown monster "${c.id}" in a corridor`);
      this.monsters.push({ def, pos: { ...c.at }, hp: def.hp, room: CORRIDOR_GUARD, active: false, asleep: 0, alive: true, cd: 0 });
    }
    for (const r of this.floor.rooms) {
      const fixed = this.cfg.placedMonsters ? (r.spawns ?? []) : [];
      const cells = this.roomCells(r.id).filter(c => this.board.isFloor(c.x, c.y) && !fixed.some(f => same(f, c)));
      const shuffled = this.rng.shuffle([...cells]);
      let k = 0;
      r.monsters.forEach((id, i) => {
        const def = ALL_MONSTERS[id];
        if (!def) throw new Error(`unknown monster "${id}" in ${r.name}`);
        this.monsters.push({
          def, pos: { ...(fixed[i] ?? shuffled[(k++) % shuffled.length]) },
          hp: def.boss && this.cfg.floor === 1 ? this.cfg.bossHp : def.hp,
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
  /** Pet Biscuit, together: Sir Reginald adds a die to his person's attack while he is up. */
  atk(h: Hero) { return this.cfg.heroAtk + this.sum(h, "atk") + (h.biscuit && h.goose > 0 ? 1 : 0); }
  def(h: Hero) { return this.cfg.heroDef + this.sum(h, "def") + (h.stoneSkin ? 2 : 0); }
  mind(h: Hero) { return 3 + this.sum(h, "mind"); }
  moveDice(h: Hero) { return Math.max(1, this.rng.d6() + this.rng.d6() + this.sum(h, "move")); }
  gearCount(h: Hero) { return this.items(h).length + h.pack.length; }

  has(h: Hero, pred: (i: Item) => boolean) { return this.items(h).some(pred) || h.pack.some(pred); }
  find(h: Hero, pred: (i: Item) => boolean) { return this.items(h).find(pred) ?? h.pack.find(pred); }

  // --- inventory -----------------------------------------------------------

  give(h: Hero, item: Item) {
    this.round > 0 && this.cfg.record && this.say(`  ${h.name} gets ${item.name}`);
    if (item.gold) { h.gold += item.gold; this.stats.gold += item.gold; return; }
    if (item.slot === "pack" || item.inert) { h.pack.push(item); return; }
    if (item.slot === "learned") { h.pack.push(item); return; }   // must be learned first
    // Rule 1.2: swapping gear in combat costs the action. The sim's heroes never spend it;
    // they hold the item until a quiet turn, which is the conservative reading.
    if (this.cfg.combatSwapCosts && this.inCombat(h)) { h.pending.push(item); return; }
    this.equipOrStash(h, item);
  }

  /** Rules 1.2 and 1.5: a living, awake monster in your room, or one already out hunting. */
  inCombat(h: Hero): boolean {
    const rid = this.board.roomIdAt(h.pos);
    return this.monsters.some(m => m.alive && m.asleep === 0 && m.def.janitor !== "grub" && (m.active || (rid !== null && m.room === rid)));
  }
  partyHasPassword(): boolean { return this.living().some(h => h.pack.some(i => i.password)); }

  /** A trap that hasn't gone off, on this square, revealed or not. */
  private isLiveTrap(x: number, y: number): boolean {
    const k = `${x},${y}`;
    if (this.spentTraps.has(k)) return false;
    const rid = this.board.roomIdAt({ x, y });
    const room = rid !== null ? this.board.rooms.get(rid) : null;
    if (room?.trap && room.trap.at.x === x && room.trap.at.y === y) return true;
    return this.floor.corridorTraps.some(t => t.at.x === x && t.at.y === y);
  }

  score(i: Item) {
    return (i.atk ?? 0) * 3 + (i.def ?? 0) * 3 + (i.mind ?? 0) * 2 + (i.move ?? 0) * 0.5 + (i.bonusVs1hp ?? 0) * 1.5
      + (i.torch ? 1 : 0) + (i.ranged ? 2 : 0) + (i.trapImmuneOnce ? 1 : 0)
      + (i.disarms ? 0.5 : 0) + (i.unlocks ? 1.5 : 0) + (i.reroll ? 1 : 0) + (i.rope ? 0.5 : 0) + (i.capeOnce ? 2.5 : 0) + (i.resetCd ? 1.5 : 0)
      + (i.cleans ? 1 : 0) + (i.koboldAversion ? 1 : 0) + (i.goblinAversion ? 1 : 0);
  }

  equipOrStash(h: Hero, item: Item) {
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
    this.cfg.record && this.say(`Achievement: ${name}`);
    const h = this.living()[0] ?? this.heroes[0];
    for (const c of contents) this.give(h, clone(c));
  }

  // --- policies ------------------------------------------------------------

  /** Close enough to hit, heal, revive or hand something to: next to each other with no wall or shut door between. */
  melee(a: Pt, b: Pt): boolean { return this.board.touching(a, b, this.openDoors); }

  heroPolicy(h: Hero, ignoreHeroes = true): EdgePolicy {
    // Floor 1: they can always knock. Floor 2: the boss door only opens for the password.
    const canUnlock = this.cfg.floor === 2 ? this.partyHasPassword() : true;
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
      // Rule 4.3.3: monsters know their own floor and never step on a trap, revealed or not.
      // A live trap is simply not a square they can enter.
      occupied: (x, y) => this.monsters.some(o => o.alive && o !== m && o.pos.x === x && o.pos.y === y)
        || this.standing().some(h => h.pos.x === x && h.pos.y === y)
        || (this.cfg.monstersAvoidAllTraps ? this.isLiveTrap(x, y) : false),
      avoid: this.cfg.monstersAvoidAllTraps ? undefined : (x, y) => this.revealedTraps.has(`${x},${y}`) && !this.spentTraps.has(`${x},${y}`),
    };
  }

  // --- main loop -----------------------------------------------------------

  run(): Result {
    this.snap("start", null);
    while (this.round < this.cfg.maxRounds) {
      this.startRound();
      for (const h of this.heroes) {
        const acts = !h.exited && !h.dead;
        this.heroTurn(h);
        if (acts) this.snap("hero", h.name);
      }
      const done = this.finishRound();
      if (done) return done;
    }
    return this.result("stalled");
  }

  /** The same game loop with each hero's turn played by `brain` (the monsters and the clock stay rules). */
  async runAsync(brain: HeroBrain): Promise<Result> {
    this.snap("start", null);
    while (this.round < this.cfg.maxRounds) {
      this.startRound();
      for (const h of this.heroes) {
        const acts = !h.exited && !h.dead;
        await brain(this, h);
        if (acts) this.snap("hero", h.name);
      }
      const done = this.finishRound();
      if (done) return done;
    }
    return this.result("stalled");
  }

  private startRound() {
    this.round++;
    this.goalFieldCache.clear();
    this.fanShield = 0; this.fanReroll = 0;
    this.tradePhase();
    this.fanDeckPhase();
  }

  /** Monsters, grubs, deaths and the collapse. Returns the result if the game is over. */
  private finishRound(): Result | null {
    if (this.cfg.floor === 2) { this.closeBossDoor(); this.releaseQueue(); }
    this.monsterPhase();
    if (this.cfg.floor === 2) this.grubPhase();
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
        this.cfg.record && this.say(`The ceiling comes down: ${dmg} damage to everyone still standing on the floor`);
        for (const h of this.heroes) if (!h.exited && !h.downed) this.damage(h, dmg);
      }
    }
    const dl = this.hardDeadline();
    if (dl !== null && this.round >= dl) {
      this.heroesLost = this.living().length;
      return this.result("collapsed");
    }
    this.snap("dm", null);
    return null;
  }

  private snap(phase: Frame["phase"], who: string | null, outcome: Result["outcome"] | null = null) {
    if (!this.cfg.record) return;
    const pair = (d: { a: Pt; b: Pt }): [Pt, Pt] => [{ ...d.a }, { ...d.b }];
    const pt = (k: string) => { const [x, y] = k.split(",").map(Number); return { x, y }; };
    this.frames.push({
      round: this.round, phase, who, lines: this.said, trails: this.trails,
      heroes: this.heroes.map(h => ({
        name: h.name, x: h.pos.x, y: h.pos.y, hp: h.hp, maxHp: h.maxHp,
        downed: h.downed, dead: h.dead, exited: h.exited, inPit: h.inPit,
        goose: h.goose, gooseMax: h.gooseMax, gold: h.gold,
        atk: this.atk(h), def: this.def(h), mind: this.mind(h),
        equip: [...SLOTS.map(s => h.equip[s]), ...h.trinkets].filter(Boolean).map(i => i!.name),
        pack: [...h.pack, ...h.pending].map(i => i.name),
        learned: h.learned.map(l => l.item.name + (l.cd ? ` (${l.cd})` : "")),
      })),
      monsters: this.monsters.map((m, i) => ({
        key: `m${i}`, id: m.def.id, name: m.def.name, x: m.pos.x, y: m.pos.y, hp: m.hp,
        maxHp: m.def.boss && this.cfg.floor === 1 ? this.cfg.bossHp : m.def.hp,
        alive: m.alive, active: m.active, asleep: m.asleep, janitor: m.def.janitor ?? null,
        boss: !!m.def.boss, password: !!m.def.password,
      })),
      corpses: this.corpses.map(c => ({ pos: { ...c.pos }, size: c.size })),
      openDoors: this.board.doors.filter((_, i) => this.openDoors[i]).map(pair),
      foundSecrets: this.board.doors.filter((_, i) => this.foundSecrets[i]).map(pair),
      revealedTraps: [...this.revealedTraps].map(pt),
      spentTraps: [...this.spentTraps].map(pt),
      usedFurniture: [...this.usedInteract],
      goalRoom: this.roomTargetCache?.round === this.round ? this.roomTargetCache.id : null,
      urgent: this.urgent,
      queue: this.queue,
      collapseBegins: this.collapseBegins(),
      deadline: this.hardDeadline(),
      collapsing: this.collapseFrom !== null,
      achievements: [...this.achievements],
      outcome,
      decision: this.decision,
    });
    this.onFrame?.(this.frames[this.frames.length - 1]);
    this.said = []; this.trails = []; this.decision = null;
  }

  private result(kind: "done" | "collapsed" | "stalled" | "wiped"): Result {
    const boss = this.bossKilledRound !== null;
    const outcome: Result["outcome"] =
      kind === "wiped" ? "wiped" : kind === "collapsed" ? "collapsed"
      : kind === "stalled" ? "stalled" : boss ? "win" : "escaped-no-boss";
    this.snap("dm", null, outcome);
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
      room2ExitRound: this.room2ExitRound,
      roomsOpened: (() => { const o = new Set<number>(); this.board.doors.forEach((d, i) => {
        if (d.kind === "secret" || this.openDoors[i] !== 1) return;
        for (const c of [d.a, d.b]) { const r = this.board.roomIdAt(c); if (r !== null) o.add(r); } }); return o.size; })(),
      capBound: this.cfg.collapseRound !== null && this.bossDoorRound !== null &&
        this.cfg.collapseRound <= this.bossDoorRound + this.cfg.collapseAfterDoor,
      f2: this.cfg.floor === 2 ? { ...this.f2, corpsesLeft: this.corpses.length,
        bleachLeft: this.heroes.reduce((a, h) => a + h.pack.filter(i => i.use === "bleach").length, 0) } : null,
      deadNames: this.heroes.filter(h => h.dead).map(h => h.name),
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
    if (this.cfg.floor === 1 && !this.monsters.some(m => m.alive && m.room === 4) && this.board.rooms.get(4)!.monsters.length)
      this.award("You Monster", [{ name: "Gold (2)", slot: "pack", gold: 2 }]);
    if (this.cfg.floor === 2 && this.f2.corpsesCleaned >= 3)
      this.award("Clean Freak", [{ name: "Gold (4)", slot: "pack", gold: 4 }, clone(FLOOR2_ITEMS["Industrial Bleach"])]);
    // Cartographer: six of the nine rooms entered (section 7). Secret doors don't count; Storage is a hidden vault.
    {
      // Count rooms entered, not doors: a room with two doors is still one room.
      const opened = new Set<number>();
      this.board.doors.forEach((d, i) => {
        if (d.kind === "secret" || this.openDoors[i] !== 1) return;
        for (const c of [d.a, d.b]) { const r = this.board.roomIdAt(c); if (r !== null) opened.add(r); }
      });
      if (this.cfg.floor === 1 && opened.size >= 6) this.award("Cartographer", [{ name: "Gold (5)", slot: "pack", gold: 5 }]);
    }
    if (this.heroes.some(h => h.goose > 0)) this.achievements.add("Sir Reginald");
  }

  private endOfRound() {
    this.checkAchievements();
    for (const h of this.heroes) {
      // Rule 1.4: still down at the end of the next full round and you are dead
      // for the floor. The figure comes off the board; your cards stay in front
      // of you, unusable, and your body rides the stairs down with the party.
      if (h.downed && !h.dead && this.round - h.downedRound >= 1) {
        // Sponsored Cape: once per floor, the sponsor would rather you didn't.
        if (!h.capeUsed && this.items(h).some(i => i.capeOnce)) { h.capeUsed = true; h.downed = false; h.hp = 1; this.cfg.record && this.say(`The sponsor's Cape saves ${h.name}`); continue; }
        h.downed = false; h.dead = true; h.deaths++; this.stats.deaths++;
        this.log(`${h.name} DIES`);
      }
      // Floor 2: the goose is Downed like a hero, and dead if still down at the end of the next round.
      if (h.gooseDown >= 0 && this.round - h.gooseDown >= 1) { h.gooseDown = -1; h.goose = 0; }
    }
    if (this.cfg.floor === 2) {
      const every = this.allHandsOn ? 1 : this.cfg.grubEvery;
      const alive = this.monsters.filter(m => m.alive && m.def.janitor).length;
      // One grub is held back for the boss door (openDoor), so the schedule only ever brings the other seven.
      const scheduled = this.cfg.grubBudget - (this.cfg.allHandsAtDoor && !this.allHandsOn ? 1 : 0);
      if (this.round >= this.cfg.grubFrom && (this.round - this.cfg.grubFrom) % every === 0 && this.queue + alive < this.cfg.grubCap
        && this.grubsQueuedTotal < scheduled) { this.queue++; this.grubsQueuedTotal++; this.cfg.record && this.say(`A grub joins the stairwell queue (${this.queue} waiting)`); }
      if (this.monsters.some(m => m.alive && m.def.janitor === "fed" && this.living().some(h => dist1(h.pos, m.pos) <= 3))) this.f2.chasedRounds++;
    }
  }

  // --- Floor 2: corpses and the Cleanup Crew ------------------------------

  private corpseAt(p: Pt): Corpse | undefined { return this.corpses.find(c => same(c.pos, p)); }

  removeCorpse(c: Corpse, how: "bleach" | "spark" | "goose" | "pit" | "eaten" | "snack") {
    this.corpses = this.corpses.filter(x => x !== c);
    this.log(`corpse (${c.size}) at ${c.pos.x},${c.pos.y} ${how === "eaten" ? "EATEN by a grub" : how === "snack" ? "eaten by the BOSS" : "cleaned by " + how}`);
    if (how === "bleach" || how === "spark" || how === "goose" || how === "pit") { this.f2.corpsesCleaned++; this.f2.cleanedBy[how]++; this.f2.cleanedBySize[c.size]++; }
  }

  /** The Sump door shuts behind the party: once everyone still on the floor is inside the boss room, the heavy
   *  door swings to. Monsters cannot open doors, so the boss fight is the party and the boss. It stays shut. */
  private closeBossDoor() {
    if (!this.cfg.sumpDoorCloses || this.bossDoorShut) return;
    const inside = this.living();
    if (!inside.length || !inside.every(h => this.board.roomIdAt(h.pos) === this.bossRoom)) return;
    this.bossDoorShut = true;
    let shut = 0;
    this.board.doors.forEach((d, i) => {
      if (!this.openDoors[i]) return;
      const ra = this.board.roomIdAt(d.a), rb = this.board.roomIdAt(d.b);
      if (ra !== this.bossRoom && rb !== this.bossRoom) return;
      this.openDoors[i] = 0; shut++;
    });
    if (!shut) return;
    this.goalFieldCache.clear();
    this.log(`the Sump door swings shut behind the party`);
  }
  bossDoorShut = false;

  /** Rule 1.4: grubs wait in the stairwell until there is a corpse to walk to, then all come out at once. */
  private releaseQueue() {
    if (!this.queue || !this.corpses.length) return;
    this.log(`${this.queue} grub(s) leave the stairs; ${this.corpses.length} corpse(s) on the floor`);
    for (; this.queue > 0; this.queue--) {
      this.monsters.push({ def: ALL_MONSTERS.grub, pos: { ...this.floor.entrance }, hp: 1, room: -1, active: true, asleep: 0, alive: true, cd: 0 });
    }
  }

  /** Rule 1.2: each grub walks a fixed distance toward a corpse -- the largest it can reach, ties to the
   *  nearest -- and eats it on arrival. Facilities wants the big job done first. */
  private grubPhase() {
    for (const m of this.monsters) {
      if (!m.alive || m.def.janitor !== "grub") continue;
      if (!this.corpses.length) continue;
      const p: EdgePolicy = {
        openDoors: this.openDoors, foundSecrets: this.foundSecrets, canOpenDoors: false, canUnlock: false,
        occupied: (x, y) => this.monsters.some(o => o.alive && o !== m && o.pos.x === x && o.pos.y === y)
          || this.standing().some(h => h.pos.x === x && h.pos.y === y),
      };
      const f = field(this.board, m.pos, p);
      const rank = (c: Corpse) => this.cfg.grubsPreferLarge ? { large: 2, medium: 1, small: 0 }[c.size] : 0;
      let best: Corpse | null = null, bd = Infinity, br = -1;
      for (const c of this.corpses) {
        const d = f.dist[this.board.idx(c.pos.x, c.pos.y)];
        if (d >= 0x3fffffff) continue;
        const r = rank(c);
        if (r > br || (r === br && d < bd)) { br = r; bd = d; best = c; }
      }
      if (!best || bd >= 0x3fffffff) continue;
      const path = pathTo(this.board, f, best.pos);
      m.pos = { ...path[Math.min(path.length - 1, this.cfg.grubMove)] };
      this.cfg.record && this.trail(this.monKey(m), false, path.slice(0, Math.min(path.length - 1, this.cfg.grubMove) + 1));
      const c = this.corpseAt(m.pos);
      if (c) this.feed(m, c);
    }
  }

  /** Rule 1.3: the fed form is set by what it ate. Same figure, flipped card. */
  private feed(m: Monster, c: Corpse) {
    this.removeCorpse(c, "eaten");
    this.f2.janitorsFed[c.size]++;
    const base = FED_FORM[c.size];
    m.def = { ...base, def: Math.max(0, base.def + this.cfg.fedDef), hp: Math.max(1, base.hp + this.cfg.fedHp) }; m.hp = m.def.hp; m.active = true;
    this.log(`  -> a ${m.def.name} now hunts the party from ${m.pos.x},${m.pos.y}`);
  }

  /** The nearest corpse worth a hero's action, by walking distance from the hero. */
  private cleanTarget(h: Hero, f: Field, method: "bleach" | "goose" | "spark" | "mopup"): { corpse: Corpse; spot: Pt | null; dist: number } | null {
    let best: { corpse: Corpse; spot: Pt | null; dist: number } | null = null;
    const sparkSmall = method === "spark" && this.cfg.sparkSmallOnly;
    for (const c of this.corpses) {
      if (method === "goose" && c.size !== "small") continue;
      if (sparkSmall && c.size !== "small") continue;
      // Otherwise small corpses aren't worth bleach or a cast.
      if (method !== "goose" && !sparkSmall && c.size === "small") continue;
      if (method === "spark" || method === "mopup") {
        if (!los(this.board, h.pos, c.pos, this.openDoors)) continue;
        const d = dist1(h.pos, c.pos);
        if (!best || d < best.dist) best = { corpse: c, spot: null, dist: d };
        continue;
      }
      const onIt = f.dist[this.board.idx(c.pos.x, c.pos.y)];
      let spot: Pt | null = onIt < 0x3fffffff ? c.pos : null, d = onIt;
      const adj = this.bestAdjacentSpot(f, c.pos, 99);
      if (adj) { const da = f.dist[this.board.idx(adj.x, adj.y)]; if (da < d) { d = da; spot = adj; } }
      if (spot && (!best || d < best.dist)) best = { corpse: c, spot, dist: d };
    }
    return best;
  }

  /** Floor 2 hero brain, "cleaner": with nothing to fight, spend the turn on the nearest corpse that matters. */
  private tryClean(h: Hero): boolean {
    if (this.cfg.floor !== 2 || this.cfg.cleanPolicy !== "cleaner" || !this.corpses.length || this.urgent) return false;
    // "Quiet" for cleaning purposes: no room monster awake near you, no fed janitor within a couple of moves.
    // (Rule 1.2's in-combat test would say yes forever once a janitor is loose anywhere on the floor.)
    const rid = this.board.roomIdAt(h.pos);
    if (this.monsters.some(m => m.alive && m.asleep === 0 && !m.def.janitor && (m.room === rid || (m.active && dist1(m.pos, h.pos) <= 6)))) return false;
    if (this.monsters.some(m => m.alive && m.def.janitor === "fed" && dist1(m.pos, h.pos) <= 8)) return false;
    const f = this.walkField(h);
    const budget = this.moveBudget(h);
    // The goose eats for free: no bleach spent, and the achievement hands over the biscuit.
    if (h.goose > 0) {
      const t = this.cleanTarget(h, f, "goose");
      if (t && t.spot && t.dist <= budget) {
        this.walk(h, f, t.spot);
        if (this.melee(h.pos, t.corpse.pos) || same(h.pos, t.corpse.pos)) {
          this.removeCorpse(t.corpse, "goose");
          this.award("Good Boy", [clone(FLOOR2_ITEMS["Pet Biscuit"])]);
          return true;
        }
        return true;
      }
    }
    const mop = h.equip.main?.cleans ? h.equip.main : null;
    if (mop || this.has(h, i => i.use === "bleach")) {
      const t = this.cleanTarget(h, f, "bleach");
      if (t && t.spot && t.dist <= budget) {
        this.walk(h, f, t.spot);
        if (this.melee(h.pos, t.corpse.pos) || same(h.pos, t.corpse.pos)) {
          if (mop) { mop.cleans!--; this.removeCorpse(t.corpse, "bleach"); return true; }   // the Mop, counted with bleach
          const b = h.pack.find(i => i.use === "bleach")!;
          h.pack = h.pack.filter(x => x !== b);
          this.f2.bleachUsed++;
          this.removeCorpse(t.corpse, "bleach");
        }
        return true;
      }
    }
    const canCast = !this.cfg.castNeedsMind || this.mind(h) >= 4;
    for (const id of ["mopup", "spark"] as const) {
      const book = canCast ? h.learned.find(l => l.item.spell?.id === id && l.cd === 0) : undefined;
      const t = book && this.cleanTarget(h, f, id);
      if (book && t) { book.cd = book.item.spell!.cooldown; this.removeCorpse(t.corpse, "spark"); return true; }
    }
    return false;
  }

  /** Patch Up: heal 2 to you or an adjacent player, as the action, when it is worth the turn. */
  private tryPatchUp(h: Hero): boolean {
    if (this.cfg.castNeedsMind && this.mind(h) < 4) return false;
    const pu = h.learned.find(l => l.item.spell?.id === "patchup" && l.cd === 0);
    if (!pu) return false;
    const who = [h, ...this.standing().filter(o => o !== h && this.melee(o.pos, h.pos))]
      .filter(o => o.hp <= 3 && o.hp < o.maxHp).sort((a, b) => a.hp - b.hp)[0];
    if (!who) return false;
    pu.cd = pu.item.spell!.cooldown;
    who.hp = Math.min(who.maxHp, who.hp + 2);
    this.cfg.record && this.say(`${h.name} casts Patch Up on ${who === h ? "themself" : who.name} (${who.hp}/${who.maxHp})`);
    return true;
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
      if (h.exited || h.dead || (this.cfg.combatSwapCosts && this.inCombat(h))) continue;   // rule 1.5: trading in combat costs the action
      const books = h.pack.filter(i => i.slot === "learned");
      for (const b of books) {
        const to = readers.find(r => r !== h &&
          (this.board.roomIdAt(r.pos) !== null && this.board.roomIdAt(r.pos) === this.board.roomIdAt(h.pos)
            || dist1(r.pos, h.pos) <= 4));
        if (!to) continue;
        h.pack = h.pack.filter(x => x !== b);
        to.pack.push(b);
        this.cfg.record && this.say(`${h.name} hands ${b.name} to ${to.name}`);
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

  heroTurn(h: Hero) {
    const pre = this.beginHeroTurn(h, true);
    if (!pre) return;
    const { fleeing } = pre;

    // Reviving a downed friend beats almost everything.
    const down = this.heroes.find(o => o.downed && !o.exited && !o.dead);
    if (down && !fleeing) {
      if (this.melee(h.pos, down.pos)) { this.revive(h, down); return; }
      const f = this.walkField(h);
      const spot = this.bestAdjacentSpot(f, down.pos, this.moveBudget(h));
      if (spot && this.rng.next() < 0.85) {
        this.walk(h, f, spot);
        if (this.melee(h.pos, down.pos)) { this.revive(h, down); return; }
        return;
      }
    }
    return this.heroTurnRest(h, fleeing);
  }

  /** Everything a turn does before anyone decides anything: cooldowns, Downed, pending gear, the pit, the goose,
   *  and how scared of the clock the party is. Returns null when the turn is already spent. `drink` = the fixed
   *  brain's free drink when hurt; an AI brain decides that itself. */
  beginHeroTurn(h: Hero, drink: boolean): { fleeing: boolean } | null {
    if (h.exited || h.dead) return null;
    for (const l of h.learned) if (l.cd > 0) l.cd--;
    h.stoneSkin = false;
    if (h.downed) { this.cfg.record && this.say(`${h.name} is Downed and can't act; dies at the end of round ${h.downedRound + 1} unless picked up`); return null; }

    // Out of combat, gear picked up during a fight gets equipped for free.
    if (h.pending.length && !this.inCombat(h)) { for (const it of h.pending) this.equipOrStash(h, it); h.pending = []; }

    // Free: drink when hurt (consumables cost no action).
    if (drink) this.maybeHeal(h);

    if (h.inPit) {
      if (this.has(h, i => !!i.rope)) h.inPit = false;
      else { h.inPit = false; this.cfg.record && this.say(`${h.name} climbs out of the pit (that's the turn)`); return null; }        // climbing out costs the action
    }

    const dl = this.hardDeadline();
    const timeLeft = dl === null ? 999 : dl - this.round;
    const budget = this.turnsToExit(h) + this.cfg.panicMargin;
    // urgent: stop sightseeing, head for the Office, but still fight through it.
    this.urgent = (this.cfg.timerKnown && dl !== null && timeLeft <= budget + 4)
      || this.collapseFrom !== null;
    // desperate: no chance of killing Greg in time -- run past him for the stairs.
    const lastOneStanding = this.standing().length <= 1 && this.bossKilledRound === null
      && this.monsters.some(m => m.alive && m.room === this.bossRoom);
    const fleeing = (this.cfg.timerKnown && dl !== null && timeLeft <= budget - 2)
      || (this.collapseFrom !== null && this.bossKilledRound === null && timeLeft <= 2)
      || lastOneStanding;

    // Floor 2: a Downed goose gets picked up on a quiet turn (his person's action).
    if (h.gooseDown >= 0 && !this.inCombat(h)) { h.gooseDown = -99; h.goose = 1; this.cfg.record && this.say(`${h.name} picks up Sir Reginald`); return null; }
    // Pet Biscuit: slide it under the goose the moment it is in hand.
    if (!h.biscuit && h.goose > 0 && h.pack.some(i => i.biscuit)) { h.biscuit = true; h.gooseMax = 3; h.goose = 3; h.pack = h.pack.filter(i => !i.biscuit); }
    return { fleeing };
  }

  private heroTurnRest(h: Hero, fleeing: boolean) {
    const target = this.pickTarget(h, fleeing);

    // Static: 1 damage to every adjacent monster, worth it against two or more.
    if (this.cfg.floor === 2 && (!this.cfg.castNeedsMind || this.mind(h) >= 4)) {
      const st = h.learned.find(l => l.item.spell?.id === "static" && l.cd === 0);
      const adj = this.monsters.filter(m => m.alive && m.def.janitor !== "grub" && this.melee(m.pos, h.pos));
      if (st && adj.length >= 2) { st.cd = st.item.spell!.cooldown; this.cfg.record && this.say(`${h.name} casts Static: 1 damage to each of ${adj.length} adjacent monsters`); for (const m of adj) this.hurtMonster(m, 1, h); return; }
    }
    // Patch Up beats a swing when somebody is about to drop.
    if ((h.hp <= 2 || this.standing().some(o => o !== h && this.melee(o.pos, h.pos) && o.hp <= 2)) && this.tryPatchUp(h)) return;

    // Already in melee? Swing.
    if (target && this.melee(h.pos, target.pos) && !this.hasRanged(h)) {
      this.cfg.record && this.say(`${h.name} stays in the fight`);
      this.heroAttack(h, target); return;
    }
    if (target && this.hasRanged(h) && !this.melee(h.pos, target.pos) && los(this.board, h.pos, target.pos, this.openDoors)) {
      this.heroAttack(h, target); return;
    }
    // Scroll / spell from range when it is the better play.
    if (target && this.tryCast(h, target)) return;

    // Floor 2: nothing to fight, so deal with the bodies.
    if (!target && !fleeing && this.tryClean(h)) return;

    // Otherwise move toward the objective.
    const goal = this.goalCell(h, fleeing, target);
    if (goal) {
      const f = this.walkField(h);
      const budget = this.moveBudget(h);
      let dest = this.stepToward(h, f, goal, budget);
      // No progress (the way is blocked by a figure, or the goal is behind a door this hero can't open):
      // try the next room on the list instead of standing on the spot, which is what this used to do silently.
      if (!dest || same(dest, h.pos)) {
        const alt = this.altGoal(h, f, goal);
        if (alt) dest = this.stepToward(h, f, alt, budget);
      }
      if (dest && !same(dest, h.pos)) this.walk(h, f, dest);
      else {
        // Still nowhere to go: swing at whatever is in the way, otherwise say so out loud.
        const blocker = this.monsters.find(m => m.alive && m.asleep === 0 && this.melee(m.pos, h.pos));
        if (blocker) { this.cfg.record && this.say(`${h.name} is boxed in and swings at the ${blocker.def.name}`); this.heroAttack(h, blocker); return; }
        this.stuck++;
        this.cfg.record && this.say(`${h.name} can't get anywhere useful and holds position`);
      }
    }

    // Act after moving.
    const t2 = this.pickTarget(h, fleeing);
    if (fleeing || (this.bossKilledRound !== null && this.roomDone(this.bossRoom))) {
      if (this.onStairs(h)) { h.exited = true; this.log(`${h.name} takes the stairs`); return; }
    }
    if (t2 && this.melee(h.pos, t2.pos)) { this.heroAttack(h, t2); return; }
    if (t2 && this.hasRanged(h) && los(this.board, h.pos, t2.pos, this.openDoors)) { this.heroAttack(h, t2); return; }
    if (t2 && this.tryCast(h, t2)) return;
    if (t2 && this.hasSidearm(h) && los(this.board, h.pos, t2.pos, this.openDoors)) { this.heroAttack(h, t2); return; }
    if (this.tryInteract(h)) return;
    if (this.tryLearn(h)) return;
    if (this.tryPatchUp(h)) return;
    // A grub in arm's reach that is about to reach a corpse worth keeping: squash it.
    if (this.cfg.floor === 2 && this.cfg.cleanPolicy === "cleaner") {
      const g = this.monsters.find(m => m.alive && m.def.janitor === "grub" && this.melee(m.pos, h.pos)
        && this.corpses.some(c => c.size !== "small" && dist1(c.pos, m.pos) <= this.cfg.grubMove));
      if (g) { this.cfg.record && this.say(`${h.name} squashes a grub before it reaches a corpse`); this.heroAttack(h, g); return; }
    }
  }

  moveBudget(h: Hero) { return this.lastRoll = this.moveDice(h); }
  lastRoll = 0;

  walkField(h: Hero): Field {
    return field(this.board, h.pos, this.heroPolicy(h));
  }

  private turnsToExit(h: Hero): number {
    const stairs = this.stairsCell();
    const f = field(this.board, h.pos, { ...this.heroPolicy(h), avoid: undefined, canUnlock: true });
    const d = f.dist[this.board.idx(stairs.x, stairs.y)];
    if (d >= 0x3fffffff) return 99;
    const bossLeft = this.bossKilledRound === null
      ? this.monsters.filter(m => m.alive && m.room === this.bossRoom).length : 0;
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

  stairsCell(): Pt { return this.board.rooms.get(this.bossRoom)!.interact!.at; }
  stairsCells(): Pt[] { return this.board.rooms.get(this.bossRoom)!.interact!.cells; }
  onStairs(h: Hero) { return this.stairsCells().some(c => same(h.pos, c)); }

  roomDone(id: number) { return !this.monsters.some(m => m.alive && m.room === id); }

  /** Furniture worth a visit: unused, and not a chest nobody can open. */
  usableInteract(id: number): boolean {
    const r = this.board.rooms.get(id);
    if (!r?.interact || this.usedInteract.has(id)) return false;
    if (r.interact.what.kind === "stairs") return false;
    return r.interact.what.kind !== "chest" || this.partyHasChestKey();
  }
  /** The same, for one hero: a chest is only worth walking to if the key is with you or close behind. */
  usableInteractFor(h: Hero, id: number): boolean {
    if (!this.usableInteract(id)) return false;
    if (this.board.rooms.get(id)!.interact!.what.kind !== "chest") return true;
    return !!this.chestKey(h) || this.standing().some(o => o !== h && dist1(o.pos, h.pos) <= 4 && this.chestKey(o));
  }

  private roomTargetCache: { round: number; id: number } | null = null;
  /** The party moves as a group toward the nearest room it still owes a visit. */
  /** Rooms the party has opened a door into. */
  visitedRooms(): Set<number> {
    const v = new Set<number>();
    this.board.doors.forEach((d, i) => {
      if (this.openDoors[i] !== 1) return;
      for (const c of [d.a, d.b]) { const r = this.board.roomIdAt(c); if (r !== null) v.add(r); }
    });
    return v;
  }

  /** The rooms the party still owes a visit, in no particular order. */
  openRoomIds(): number[] {
    const required = this.requiredRooms;
    const unfinished = (id: number) => !this.roomDone(id) || (!this.urgent && this.usableInteract(id));
    const open = this.cfg.explore === "blind" ? (() => {
      // Blind: nobody knows which room has the password. Open the nearest unexplored door until it turns up;
      // afterwards the boss room is the goal, with the appetite for side rooms limited to the greed list.
      const visited = this.visitedRooms();
      const hasPw = this.cfg.floor !== 2 || this.partyHasPassword();
      return this.floor.rooms.map(r => r.id).filter(id => id !== this.bossRoom).filter(id => {
        const fresh = !visited.has(id);
        if (!hasPw) return fresh || unfinished(id);
        if (this.urgent) return false;
        return this.cfg.optionalRooms.includes(id) && (fresh || unfinished(id));
      });
    })() : this.route.filter(id =>
      id !== this.bossRoom && (this.urgent ? required.includes(id) : true) &&
      (!this.roomDone(id) || (!this.urgent && this.usableInteract(id))
        || (this.cfg.floor === 2 && !this.partyHasPassword() && this.monsters.some(m => m.alive && m.room === id && m.def.password))));
    return open;
  }

  currentRoom(): number {
    if (this.roomTargetCache?.round === this.round) return this.roomTargetCache.id;
    const lead = this.standing()[0] ?? this.living()[0] ?? this.heroes[0];
    const f = field(this.board, lead.pos, { ...this.heroPolicy(lead), occupied: () => false, avoid: undefined });
    const open = this.openRoomIds();
    let best = this.bossRoom, bd = Infinity;
    for (const id of open) {
      const c = this.board.center(id);
      const d = f.dist[this.board.idx(c.x, c.y)];
      if (d < bd) { bd = d; best = id; }
    }
    this.roomTargetCache = { round: this.round, id: best };
    return best;
  }

  private pickTarget(h: Hero, fleeing: boolean): Monster | null {
    // Grubs are never worth a swing here (see the end of heroTurn); fed janitors are fought when they catch you, not chased.
    const live = this.monsters.filter(m => m.alive && m.asleep === 0 && m.def.janitor !== "grub");
    if (!live.length) return null;
    const near = live.filter(m => this.melee(h.pos, m.pos));
    if (near.length) return this.bestOf(h, near);
    if (fleeing) return null;
    const room = this.currentRoom();
    // A fed janitor is a chase, not a target -- unless it is right on top of you, and in particular when it is
    // parked in the only doorway, which used to leave the party standing in a dead end until the floor fell in.
    const pool = live.filter(m => m.def.janitor
      ? m.def.janitor === "fed" && dist1(m.pos, h.pos) <= 3
      : (m.room === room || m.active || los(this.board, h.pos, m.pos, this.openDoors)));
    if (!pool.length) return null;   // nothing to fight: go do the objective
    // reachable-ish: prefer nearest by path
    const f = this.walkField(h);
    let best: Monster | null = null, bestD = Infinity;
    for (const m of pool) {
      const d = this.adjacentDist(f, m.pos);
      // Every square beside it is a wall, furniture or another hero: someone else is dealing with this one.
      if (d >= 0x3fffffff && !this.hasRanged(h)) continue;
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
    // Delegation / Understaffed: kill the staff first (only if the party is paying attention)
    if (m.room === this.bossRoom && !m.def.boss && this.rng.next() < this.cfg.competence) p += 3;
    if (m.def.password) p += 2;
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

  adjacentDist(f: Field, p: Pt): number {
    let best = Infinity;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + d[0], y = p.y + d[1];
      if (!this.board.inBounds(x, y)) continue;
      if (!this.melee({ x, y }, p)) continue;        // a square across the wall is no use for reaching it
      best = Math.min(best, f.dist[this.board.idx(x, y)]);
    }
    return best;
  }

  bestAdjacentSpot(f: Field, p: Pt, budget: number): Pt | null {
    let best: Pt | null = null, bd = Infinity;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = p.x + d[0], y = p.y + d[1];
      if (!this.board.inBounds(x, y)) continue;
      if (!this.melee({ x, y }, p)) continue;
      const dist = f.dist[this.board.idx(x, y)];
      if (dist <= budget && dist < bd) { bd = dist; best = { x, y }; }
    }
    return best;
  }

  private goalCell(h: Hero, fleeing: boolean, target: Monster | null): Pt | null {
    // Bailing out only makes sense if the stairs can be reached: on Floor 2 the Sump needs the password, and a
    // party without one used to run at a door it could not open and then stand there until the floor fell in.
    if (fleeing || (this.bossKilledRound !== null && this.roomDone(this.bossRoom))) {
      const stairs = this.stairsCell();
      const f = field(this.board, h.pos, { ...this.heroPolicy(h), occupied: () => false, avoid: undefined });
      if (f.dist[this.board.idx(stairs.x, stairs.y)] < 0x3fffffff) return stairs;
    }
    if (target) return target.pos;
    const room = this.currentRoom();
    const rd = this.board.rooms.get(room)!;
    const here = this.board.roomIdAt(h.pos) === room;
    const canUse = this.usableInteractFor(h, room) && !this.urgent;
    // Standing in the party's target room with nothing left to do here (no monster this hero can reach, no
    // furniture they can use) means moving on, not standing still while somebody else finishes the fight.
    if (here && !canUse) {
      const f = field(this.board, h.pos, { ...this.heroPolicy(h), occupied: () => false, avoid: undefined });
      let next: number | null = null, nd = Infinity;
      for (const id of this.openRoomIds()) {
        if (id === room) continue;
        const c = this.board.center(id);
        const d = f.dist[this.board.idx(c.x, c.y)];
        if (d < nd) { nd = d; next = id; }
      }
      if (next !== null) return this.board.center(next);
      return this.stairsCell();
    }
    if (!this.roomDone(room)) return this.board.center(room);
    if (canUse) return rd.interact!.at;
    return this.stairsCell();
  }

  /** Choose the reachable cell within budget that gets closest to `goal`. */
  /** Sources for a goal field: the goal itself, or the squares beside it if it
   *  is a piece of furniture you can only reach by standing next to it. */
  /** Somewhere else worth walking to when the first objective can't be approached this turn. */
  private altGoal(h: Hero, f: Field, goal: Pt): Pt | null {
    const goalRoom = this.board.roomIdAt(goal);
    let best: Pt | null = null, bd = Infinity;
    for (const id of this.openRoomIds()) {
      if (id === goalRoom) continue;
      const c = this.board.center(id);
      const d = f.dist[this.board.idx(c.x, c.y)];
      if (d < bd) { bd = d; best = c; }
    }
    if (best) return best;
    // Nothing left on the list: the stairs, if this hero can reach them at all.
    const stairs = this.stairsCell();
    return f.dist[this.board.idx(stairs.x, stairs.y)] < 0x3fffffff ? stairs : null;
  }

  private goalSources(goal: Pt): Pt[] {
    if (this.board.isFloor(goal.x, goal.y)) return [goal];
    // Furniture is used from inside its own room. A corridor square on the far side of the room's wall is
    // next to the piece on the grid and useless at the table, and a hero who walks there stands for ever.
    const rid = this.board.roomIdAt(goal);
    const out: Pt[] = [];
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const p = { x: goal.x + d[0], y: goal.y + d[1] };
      if (!this.board.isFloor(p.x, p.y)) continue;
      if (rid !== null && this.board.roomIdAt(p) !== rid) continue;
      out.push(p);
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

  stepToward(h: Hero, f: Field, goal: Pt, budget: number): Pt | null {
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

  walk(h: Hero, f: Field, dest: Pt) {
    const path = pathTo(this.board, f, dest);
    let i = 1;
    for (; i < path.length; i++) {
      const from = path[i - 1], to = path[i];
      const di = this.board.doorIndex(from, to);
      if (di >= 0 && !this.openDoors[di]) this.openDoor(h, di, from, to);
      h.pos = { ...to };
      if (this.enterCell(h)) break;      // pit stops movement
      if (h.downed) break;
    }
    if (this.cfg.record && path.length > 1) {
      const walked = path.slice(0, Math.min(i + 1, path.length));
      this.trail(h.name, true, walked);
      const where = this.board.roomIdAt(h.pos);
      this.say(`${h.name} moves ${walked.length - 1} (rolled ${this.lastRoll}) to ${where === null ? "the corridor" : this.board.rooms.get(where)!.name}`);
    }
    if (this.has(h, i => !!i.torch)) this.torchReveal(h);
  }

  private openDoor(h: Hero, di: number, from: Pt, to: Pt) {
    const d = this.board.doors[di];
    this.openDoors[di] = 1;
    if (this.cfg.record) {
      const r = this.board.roomIdAt(to) ?? this.board.roomIdAt(from);
      this.say(`${h.name} opens ${d.kind === "locked" ? "the locked door" : d.kind === "secret" ? "a secret door" : "a door"}${r === null ? "" : ` (${this.board.rooms.get(r)!.name})`}${d.trap === "block" ? ": FALLING BLOCK" : ""}`);
    }
    this.doorVersion++; this.goalFieldCache.clear();
    if (d.trap === "block") {
      this.stats.traps++;
      this.award("Found It With Your Face", [{ name: "Football Helmet", slot: "head", trapImmuneOnce: true }]);
      if (!this.absorbTrap(h) && rollShields(this.rng, 1, false) === 0) this.damage(h, 2);
    }
    const intoBoss = this.board.roomIdAt(from) === this.bossRoom || this.board.roomIdAt(to) === this.bossRoom;
    if (intoBoss && this.bossDoorRound === null) this.bossDoorRound = this.round;
    if (intoBoss && this.cfg.floor === 2 && this.cfg.allHands && !this.allHandsOn) {
      // All Hands: the whole queue comes out now, and the schedule goes to every round.
      this.allHandsOn = true; this.f2.allHandsRound = this.round;
      this.log(`${h.name} opens the boss door: ALL HANDS, ${this.queue} grub(s) released`);
      for (; this.queue > 0; this.queue--)
        this.monsters.push({ def: ALL_MONSTERS.grub, pos: { ...this.floor.entrance }, hp: 1, room: -1, active: true, asleep: 0, alive: true, cd: 0 });
      // Facilities converges on the boss room: one grub is already at the door, on the corridor side, which is
      // where the guard's body usually lands. The stairwell is too far away for the Crew to make this moment.
      // The last grub of the floor is this one: the schedule holds it back (see endOfRound), so the door beat
      // always happens and the tile count is still eight.
      if (this.cfg.allHandsAtDoor) {
        const side = this.board.roomIdAt(from) === this.bossRoom ? to : from;
        this.grubsQueuedTotal++;
        this.monsters.push({ def: ALL_MONSTERS.grub, pos: { ...side }, hp: 1, room: -1, active: true, asleep: 0, alive: true, cd: 0 });
        this.log(`  a grub is already at the door (${side.x},${side.y})`);
      }
    }
    if (this.cfg.floor === 2 && d.kind === "locked") return;   // the password door: nothing is spent, nothing knocks
    {
      const ra = this.board.roomIdAt(d.a), rb = this.board.roomIdAt(d.b);
      if ((ra === 2 || rb === 2) && ra !== 1 && rb !== 1 && this.room2ExitRound === null) this.room2ExitRound = this.round;
    }
    if (d.kind === "locked" && !this.has(h, i => !!i.unlocks)) {
      // Knocking: the two Orcs each get a free swing at the knocker.
      this.cfg.record && this.say(`${h.name} knocks: the guards get a free swing`);
      for (const m of this.monsters.filter(m => m.alive && m.room === this.bossRoom && !m.def.boss)) {
        m.active = true;
        this.monsterAttack(m, h);
      }
    } else if (d.kind === "locked") {
      const key = this.find(h, i => !!i.unlocks && i.unlocks < 99);
      if (key) this.spendCharge(h, key);
    }
  }

  /** What this hero can open a locked chest with. The Fire Axe is unlocks: 99; Floor 2's chests refuse it. */
  chestKey(h: Hero): Item | undefined {
    return this.find(h, i => !!i.unlocks && !(this.cfg.chestKeyOnly && i.unlocks >= 99));
  }
  /** Anyone still on the floor who could open one (the party hands cards around freely, rule 1.5). */
  partyHasChestKey(): boolean { return this.living().some(h => !!this.chestKey(h)); }
  /** One use off a key: the Janitor's Keyring has three, the Skeleton Key one, the Fire Axe unlimited. */
  private spendCharge(h: Hero, key: Item) {
    if (key.unlocks! >= 99) return;
    key.unlocks!--;
    if (key.unlocks! <= 0) this.dropItem(h, key);
  }

  dropItem(h: Hero, item: Item) {
    for (let i = 0; i < h.trinkets.length; i++) if (h.trinkets[i] === item) h.trinkets[i] = null;
    h.pack = h.pack.filter(p => p !== item);
  }

  /** Torch: lights the room you walk into, and finds secret doors you walk past. */
  private torchReveal(h: Hero) {
    for (const t of this.floor.corridorTraps)
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
      : this.floor.corridorTraps.find(t => same(t.at, h.pos));
    if (!trap) return false;
    this.spentTraps.add(k);
    this.revealedTraps.add(k);
    this.stats.traps++;
    this.cfg.record && this.say(`${h.name} steps on a ${trap.kind} trap`);
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

  maybeHeal(h: Hero) {
    const threshold = this.monsters.some(m => m.alive && m.active && dist1(m.pos, h.pos) <= 3) ? 3 : 2;
    while (h.hp <= threshold && h.hp < h.maxHp) {
      const c = h.pack.find(i => i.use === "heal4") ?? h.pack.find(i => i.use === "heal3")
        ?? h.pack.find(i => i.use === "heal1");
      if (!c) break;
      h.pack = h.pack.filter(x => x !== c);
      h.hp = Math.min(h.maxHp, h.hp + (c.use === "heal4" ? 4 : c.use === "heal3" ? 3 : 1));
      this.cfg.record && this.say(`${h.name} uses ${c.name} (${h.hp}/${h.maxHp})`);
    }
  }

  revive(h: Hero, down: Hero) {
    const bandage = h.pack.find(i => i.use === "heal1");
    if (bandage) h.pack = h.pack.filter(x => x !== bandage);
    down.downed = false; down.hp = this.cfg.reviveHp;
    this.cfg.record && this.say(`${h.name} picks up ${down.name} (${down.hp} Health)`);
  }

  /** A true ranged weapon (the Shortbow): shoot instead of closing to melee. */
  hasRanged(h: Hero) { const r = h.equip.main?.ranged; return !!r && !r.sidearm; }
  /** A sidearm (the Slingshot): melee as normal, but take a shot if the turn ends out of reach. */
  hasSidearm(h: Hero) { return !!h.equip.main?.ranged?.sidearm; }

  private tryCast(h: Hero, target: Monster): boolean {
    if (!los(this.board, h.pos, target.pos, this.openDoors)) return false;
    // Bookmark: once per floor, a cooling spell is ready again. Spent the first time it would matter.
    if (!h.bookmarkUsed && this.items(h).some(i => i.resetCd)) {
      const cooling = h.learned.find(l => l.cd > 0 && l.item.spell?.id === "spark");
      if (cooling) { cooling.cd = 0; h.bookmarkUsed = true; }
    }
    // Rule 6.3: casting needs Mind 4+ every time, not just learning. Glasses off, book closed.
    const spark = (!this.cfg.castNeedsMind || this.mind(h) >= 4) ? h.learned.find(l => l.item.spell?.id === "spark" && l.cd === 0) : undefined;
    if (spark && (!this.melee(h.pos, target.pos) || 2 > this.atk(h))) {
      spark.cd = spark.item.spell!.cooldown;
      this.cfg.record && this.say(`${h.name} casts Spark at ${target.def.name}`);
      this.resolveAttack(h, target, 2);
      return true;
    }
    if (this.rng.next() > this.cfg.competence) return false;
    const lo = h.pack.find(i => i.use === "lightsout");
    if (lo) {
      const rid = this.board.roomIdAt(h.pos);
      const crowd = this.monsters.filter(m => m.alive && m.asleep === 0 && rid !== null && this.board.roomIdAt(m.pos) === rid);
      if (crowd.length >= 2 || (crowd.length && target.def.boss)) {
        h.pack = h.pack.filter(x => x !== lo);
        this.cfg.record && this.say(`${h.name} reads Lights Out: ${crowd.length} monster(s) skip their next turn`);
        for (const m of crowd) m.asleep = Math.max(m.asleep, 1);
        return true;
      }
    }
    const rs = h.pack.find(i => i.use === "restructuring");
    if (rs && this.mind(h) >= (rs.needMind ?? 5) && (target.def.boss || target.hp >= 2)) {
      h.pack = h.pack.filter(x => x !== rs);
      this.cfg.record && this.say(`${h.name} reads Restructuring at ${target.def.name}`);
      this.resolveAttack(h, target, 4);
      for (const o of this.monsters.filter(o => o.alive && o !== target && this.melee(o.pos, target.pos))) this.hurtMonster(o, 1, h);
      return true;
    }
    const fb = h.pack.find(i => i.use === "firebolt");
    if (fb && (target.def.boss || target.hp > 1)) {
      h.pack = h.pack.filter(x => x !== fb);
      this.cfg.record && this.say(`${h.name} reads Firebolt at ${target.def.name}`);
      this.resolveAttack(h, target, 3);
      return true;
    }
    const sleep = h.pack.find(i => i.use === "sleep");
    if (sleep && !target.def.undead && (target.def.boss || target.def.id === "orc" || target.def.id === "abomination")
      && this.heroes.some(x => x.hp <= 3)) {
      h.pack = h.pack.filter(x => x !== sleep);
      target.asleep = 2;
      this.cfg.record && this.say(`${h.name} reads Sleep on ${target.def.name}`);
      return true;
    }
    return false;
  }

  heroAttack(h: Hero, m: Monster) {
    let dice = this.atk(h) + h.energy;
    const ranged = h.equip.main?.ranged;
    if (ranged) {
      if (this.melee(h.pos, m.pos)) { if (!ranged.sidearm) dice = 1; }   // can't use the bow point-blank; a slingshot hero just punches
      else dice = ranged.dice + h.energy;
    }
    if (h.equip.main?.bonusVs1hp && m.hp === 1 && !(ranged && !this.melee(h.pos, m.pos))) dice += h.equip.main.bonusVs1hp;
    this.lastShotRanged = !!ranged && !this.melee(h.pos, m.pos);
    // Energy Drink: spend it when it might matter.
    if (!h.energy && this.rng.next() < this.cfg.competence * 0.5) {
      const e = h.pack.find(i => i.use === "energy");
      if (e && (m.def.boss || m.def.def >= 3)) { h.pack = h.pack.filter(x => x !== e); dice += 1; this.cfg.record && this.say(`${h.name} drinks an Energy Drink`); }
    }
    h.energy = 0;
    this.resolveAttack(h, m, dice);
    this.lastShotRanged = false;
  }
  lastShotRanged = false;

  resolveAttack(h: Hero, m: Monster, dice: number) {
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
    if (m.def.boss && this.cfg.floor === 1 && this.monsters.some(o => o.alive && o.room === this.bossRoom && !o.def.boss)) defDice += 1; // Delegation
    if (m.def.boss && this.cfg.floor === 2 && this.monsters.some(o => o.alive && o.def.janitor === "fed")) defDice += 1; // Understaffed
    const shields = rollShields(this.rng, defDice, true);
    const dmg = Math.max(0, skulls - shields);
    this.cfg.record && this.say(`${h.name} attacks ${m.def.name}${this.lastShotRanged ? " from range" : ""}: ${dice} dice, ${skulls} skull${skulls === 1 ? "" : "s"} vs ${shields} of ${defDice} shields` + (dmg > 0 ? `, ${dmg} damage${m.hp - dmg <= 0 ? ", KILLED" : ` (${m.hp - dmg} left)`}` : ", no damage"));
    if (dmg > 0) this.hurtMonster(m, dmg, h);
  }

  hurtMonster(m: Monster, dmg: number, killer: Hero | null) {
    m.hp -= dmg;
    m.active = true;
    if (m.room === 9 && this.bossEngagedRound === null) this.bossEngagedRound = this.round;
    if (m.hp > 0) return;
    m.alive = false;
    if (m.def.janitor) {
      // Janitors leave no corpse and no loot. A fed one is worth an achievement.
      if (m.def.janitor === "grub") {
        this.f2.grubsKilled++;
        // Beating back the tide: the tile goes back on the queue die, it doesn't leave the floor.
        if (this.cfg.grubsReturn) { this.queue++; this.cfg.record && this.say(`  the grub goes back to the stairwell queue (${this.queue} waiting)`); }
      }
      else { this.f2.janitorsKilled++; this.award("Health Inspector", [{ name: "Gold (5)", slot: "pack", gold: 5 }]); }
      this.log(`${killer?.name ?? "a trap"} kills a ${m.def.name}`);
      return;
    }
    this.stats.kills++;
    if (this.cfg.floor === 1) this.award("First Blood", [{ name: "Juice Box", slot: "pack", use: "heal3" }, { name: "Gold (3)", slot: "pack", gold: 3 }]);
    if (m.def.boss) {
      this.bossKilledRound = this.round;
      this.heroHpAtBossKill = this.heroes.reduce((a, h) => a + Math.max(0, h.hp), 0);
      this.log(`${killer?.name ?? "a trap"} KILLS THE BOSS`);
    }
    if (this.cfg.floor === 2 && m.def.size && !m.def.boss) {
      // Rule 1.1: the body stays where it fell, unless it fell into a pit.
      if (this.isLiveTrap(m.pos.x, m.pos.y) || this.spentTraps.has(`${m.pos.x},${m.pos.y}`)) this.f2.cleanedBy.pit++;
      else { this.corpses.push({ pos: { ...m.pos }, size: m.def.size }); this.f2.corpsesMade++; this.f2.madeBySize[m.def.size]++; this.log(`${killer?.name ?? "a trap"} kills ${m.def.name} at ${m.pos.x},${m.pos.y} (${m.def.size} corpse)`); }
    }
    if (!killer) {
      this.award("Trap Chef", this.cfg.floor === 1 ? [{ name: "Fire Axe", slot: "main", twoHanded: true, atk: 2, unlocks: 99 }] : [clone(FLOOR2_ITEMS["Leaf Blower"])]);
      return;
    }
    if (this.cfg.floor === 2 && this.lastShotRanged) this.award("Nice Shot", [clone(FLOOR2_ITEMS["Goblin Shortbow"])]);
    if (m.def.password) { this.give(killer, clone(FLOOR2_ITEMS["Password of the Day"])); this.f2.passwordRound = this.round; this.log(`${killer.name} has the PASSWORD`); }
    const roll = this.rng.d6();
    let kind = m.def.loot(roll);
    if (this.cfg.lootRich && roll === 5 && (m.def.id === "orc" || m.def.id === "zombie")) kind = "gear";
    if (this.cfg.lootRich && roll === 6 && m.def.id === "skeleton") kind = "gear";
    if (this.cfg.lootRich && roll >= 4 && m.def.id === "skeleton") kind = roll === 6 ? "gear" : "pockets";
    this.cfg.record && this.say(`  loot roll ${roll}: ${kind === "none" ? "nothing" : kind === "big" ? "Big Gear" : kind === "gear" ? "Gear" : "Pockets"}`);
    if (kind !== "none") {
      const item = this.draw(kind === "big" ? "big" : kind === "gear" ? "gear" : "pockets");
      if (item) this.give(killer, item);
    }
    if (m.def.boss) {
      const b = this.draw("big"); if (b) this.give(killer, b);
      if (this.cfg.floor === 2) this.award("Boss Box", [{ name: "Gold (8)", slot: "pack", gold: 8 }]);
    }
  }

  tryInteract(h: Hero): boolean {
    const rid = this.board.roomIdAt(h.pos);
    if (rid === null) return false;
    const r = this.board.rooms.get(rid)!;
    if (!r.interact || this.usedInteract.has(rid)) return false;
    if (!r.interact.cells.some(c => adjacent(h.pos, c) || same(h.pos, c))) return false;
    if (this.monsters.some(m => m.alive && m.active && dist1(m.pos, h.pos) <= 2)) return false;
    const w = r.interact.what;
    if (w.kind === "stairs") return false;
    if (this.urgent) return false;
    const used = () => this.cfg.record && this.say(`${h.name} uses the ${w.kind} in ${r.name}`);
    if (w.kind === "cage") {
      used(); this.usedInteract.add(rid); h.goose = 2; this.cfg.record && this.say(`  Sir Reginald joins ${h.name}`); return true; }
    const fixed = this.cfg.floor === 2 ? FIXED_LOOT[r.name] : undefined;
    const handout = () => {
      if (!fixed) return false;
      const it = namedItem(fixed);
      if (it.use === "bleach") this.f2.bleachFound++;
      if (it.password && this.f2.passwordRound === null) { this.f2.passwordRound = this.round; this.log(`${h.name} finds the PASSWORD in the ${r.name}`); }
      this.give(h, it); return true;
    };
    if (w.kind === "chest") {
      // No key, no chest: there is no lock-picking in the printed rules. A friend standing next to you can
      // hand theirs over for free (rule 1.5), which is what a table does rather than swapping turns around.
      const holder = this.chestKey(h) ? h : this.standing().find(o => o !== h && this.melee(o.pos, h.pos) && this.chestKey(o));
      if (!holder) return false;
      used();
      if (holder !== h) this.cfg.record && this.say(`  ${holder.name} hands over the ${this.chestKey(holder)!.name}`);
      this.spendCharge(holder, this.chestKey(holder)!);
      this.usedInteract.add(rid);
      if (!handout()) { const it = this.draw("big"); if (it) this.give(h, it); }
      return true;
    }
    used();
    this.usedInteract.add(rid);
    if (handout()) return true;
    const deck = w.kind === "shelf" ? (this.mind(h) >= 4 ? "big" : "gear")
      : w.kind === "rack" ? "gear" : "pockets";
    if (w.kind === "rack" && this.rackBook) { this.give(h, this.rackBook); this.rackBook = null; }
    const it = this.draw(deck as any); if (it) this.give(h, it);
    if (w.kind === "rack" && this.cfg.richRack) { const it2 = this.draw("gear"); if (it2) this.give(h, it2); }
    if (w.kind === "toilet") this.award("Why Would You Do That", [{ name: "Energy Drink", slot: "pack", use: "energy" }, { name: "Gold (2)", slot: "pack", gold: 2 }]);
    return true;
  }

  tryLearn(h: Hero): boolean {
    if (this.mind(h) < 4) return false;
    const bk = h.pack.find(i => i.slot === "learned");
    if (!bk) return false;
    h.pack = h.pack.filter(x => x !== bk);
    h.learned.push({ item: bk, cd: 0 });
    this.cfg.record && this.say(`${h.name} learns ${bk.name}`);
    this.award("Nerd", [{ name: "Scroll: Firebolt", slot: "pack", use: "firebolt" },
      { name: "Bookmark", slot: "trinket", resetCd: true }]);
    return true;
  }

  // --- monsters ------------------------------------------------------------

  private monsterPhase() {
    for (const m of this.monsters) {
      if (!m.alive) continue;
      if (m.def.janitor === "grub") continue;          // grubs move in grubPhase
      if (m.cd > 0) m.cd--;
      if (m.asleep > 0) { m.asleep--; continue; }
      if (!m.active) {
        // A corridor guard has no door between it and the party: being seen is enough.
        const doorOpen = m.room === CORRIDOR_GUARD || this.board.doors.some((d, i) =>
          (this.board.roomIdAt(d.a) === m.room || this.board.roomIdAt(d.b) === m.room) && !!this.openDoors[i]);
        const seen = this.standing().some(h => los(this.board, m.pos, h.pos, this.openDoors));
        if (doorOpen && seen) { m.active = true; this.cfg.record && this.say(`${m.def.name} wakes up`); }
        else continue;
      }
      const targets = this.standing();
      if (!targets.length) continue;

      if (m.def.boss && this.cfg.floor === 2) {
        // Snack: a corpse in the boss room is lunch. Heals 2.
        const lunch = this.cfg.bossSnack ? this.corpses.find(c => this.board.roomIdAt(c.pos) === m.room) : undefined;
        if (lunch) { this.removeCorpse(lunch, "snack"); m.hp = Math.min(m.def.hp, m.hp + this.cfg.snackHeal); this.f2.bossSnacks++; this.log(`  boss heals to ${m.hp}`); if (!this.cfg.snackFree) continue; }
        // Mop: 2 dice at every adjacent hero when two or more are in reach.
        const adj = targets.filter(h => this.melee(m.pos, h.pos));
        if (m.cd === 0 && adj.length >= 2) { m.cd = 2; this.cfg.record && this.say(`${m.def.name}: Mop`); for (const h of adj) this.monsterAttack(m, h, 2); continue; }
      }
      if (m.def.boss && m.cd === 0 && this.cfg.floor === 1) {
        const vis = targets.filter(h => los(this.board, m.pos, h.pos, this.openDoors));
        if (vis.length) {
          const t = vis.reduce((a, b) => (this.gearCount(b) > this.gearCount(a) ? b : a));
          m.cd = 2;
          this.cfg.record && this.say(`${m.def.name}: Performance Review at ${t.name}`);
          this.monsterAttack(m, t, 2);   // Performance Review
          continue;
        }
      }

      const near = targets.filter(h => this.melee(m.pos, h.pos));
      if (near.length) { this.monsterAttack(m, this.chooseVictim(m, near)); continue; }

      const p = this.monsterPolicy(m);
      const f = field(this.board, m.pos, p);
      let best: Pt | null = null, bd = Infinity, victim: Hero | null = null;
      for (const h of targets) {
        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const x = h.pos.x + d[0], y = h.pos.y + d[1];
          if (!this.board.inBounds(x, y)) continue;
          if (this.cfg.monstersAvoidAllTraps ? this.isLiveTrap(x, y) : (this.revealedTraps.has(`${x},${y}`) && !this.spentTraps.has(`${x},${y}`))) continue;
          const dist = f.dist[this.board.idx(x, y)];
          const mv = m.def.janitor === "fed" ? this.cfg.fedMove : m.def.move;
          if (dist <= mv && dist < bd) { bd = dist; best = { x, y }; victim = h; }
        }
      }
      if (best && victim) {
        const path = pathTo(this.board, f, best);
        let i = 1;
        for (; i < path.length; i++) {
          const c = path[i];
          if (this.cfg.monstersAvoidAllTraps && this.isLiveTrap(c.x, c.y)) break;   // never, given the policy above
          m.pos = { ...c };
          if (!this.cfg.monstersAvoidAllTraps && this.revealedTraps.has(`${c.x},${c.y}`) && !this.spentTraps.has(`${c.x},${c.y}`)) { i++; break; }
        }
        this.cfg.record && this.trail(this.monKey(m), false, path.slice(0, i));
        if (this.monsterStepTraps(m)) continue;
        if (this.melee(m.pos, victim.pos)) this.monsterAttack(m, victim);
      } else {
        // shuffle toward the nearest hero anyway
        let bh: Hero | null = null, bdd = Infinity;
        for (const h of targets) {
          const d = this.adjacentDist(f, h.pos);
          if (d < bdd) { bdd = d; bh = h; }
        }
        if (bh) {
          const mv = m.def.janitor === "fed" ? this.cfg.fedMove : m.def.move;
          // Floor 1 monsters only close the last few squares (they never leave a hero's sight once active).
          // A fed janitor is a pursuer: it walks its full move along the route to the nearest hero, however far.
          const spot = this.bestAdjacentSpot(f, bh.pos, m.def.janitor === "fed" ? 0x3ffffffe : mv);
          if (spot) {
            const path = pathTo(this.board, f, spot);
            m.pos = { ...path[Math.min(path.length - 1, mv)] };
            this.cfg.record && this.trail(this.monKey(m), false, path.slice(0, Math.min(path.length - 1, mv) + 1));
            if (this.melee(m.pos, bh.pos)) this.monsterAttack(m, bh);
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
    if (this.cfg.trace) for (const m of this.monsters) if (m.alive && m.def.janitor === "fed") {
      const near = Math.min(...this.standing().map(h => dist1(h.pos, m.pos)), 99);
      this.log(`  ${m.def.name} at ${m.pos.x},${m.pos.y}, nearest hero ${near} away`);
    }
  }

  /** A monster standing on a live trap sets it off. Monsters never walk in on their own (rule 4.3.3),
   *  so this only fires when something puts them there: Shove or a Loose Floorboard, neither of which
   *  the sim's heroes use. Trap Chef is therefore unmeasured here, not impossible. */
  private monsterStepTraps(m: Monster): boolean {
    const k = `${m.pos.x},${m.pos.y}`;
    if (this.spentTraps.has(k)) return false;
    const rid = this.board.roomIdAt(m.pos);
    const room = rid !== null ? this.board.rooms.get(rid)! : null;
    const trap = (room?.trap && same(room.trap.at, m.pos)) ? room.trap
      : this.floor.corridorTraps.find(t => same(t.at, m.pos));
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
    if (m.def.id === "kobold") {
      const ok = near.filter(h => !this.items(h).some(i => i.koboldAversion));
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
    if (this.fanShield > 0) { this.fanShield--; this.cfg.record && this.say(`${m.def.name} swings at ${h.name}; a Viewer's card stops it`); return; }
    // Goose without the biscuit: soaks the whole attack on a skull. Floor 2: at 0 he is Downed, not dead.
    if (h.goose > 0 && !h.biscuit && rollSkulls(this.rng, 1) > 0) {
      h.goose--;
      if (h.goose === 0 && this.cfg.floor === 2) h.gooseDown = this.round;
      this.cfg.record && this.say(`${m.def.name} swings at ${h.name}; Sir Reginald takes it (${h.goose} left)`);
      return;
    }
    const nope = this.living().filter(x => !this.cfg.castNeedsMind || this.mind(x) >= 4).flatMap(x => x.learned).find(l => l.item.spell?.id === "nope" && l.cd === 0);
    if (nope && h.hp <= 2) { nope.cd = 3; this.cfg.record && this.say(`${m.def.name} swings at ${h.name}: NOPE`); return; }
    const skulls = rollSkulls(this.rng, diceOverride ?? m.def.atk);
    const shields = rollShields(this.rng, this.def(h), false);
    const dmg = Math.max(0, skulls - shields);
    if (m.def.janitor || m.def.boss) this.log(`  ${m.def.name} hits ${h.name} for ${dmg} (${h.hp - dmg} left)`);
    else this.cfg.record && this.say(`${m.def.name} attacks ${h.name}: ${skulls} skull${skulls === 1 ? "" : "s"} vs ${shields} shield${shields === 1 ? "" : "s"}, ${dmg ? `${dmg} damage (${h.hp - dmg} left)` : "no damage"}`);
    // Bodyguard (Pet Biscuit, together): his person may shout "Reginald!" and the goose takes the damage instead.
    // The fixed brain always shouts while the goose is up.
    if (dmg > 0 && h.biscuit && h.goose > 0) {
      h.goose = Math.max(0, h.goose - dmg);
      if (h.goose === 0) h.gooseDown = this.round;
      this.cfg.record && this.say(`  "Reginald!" Sir Reginald takes it (${h.goose} left)`);
      return;
    }
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
        this.cfg.record && this.say(`${h.name} would go down, but uses ${sc.name} just in time`);
        return;
      }
      h.hp = 0; h.downed = true; h.downedRound = this.round; h.inPit = false;
      this.stats.downs++; this.lastDownRound = this.round;
      this.log(`${h.name} is DOWNED`);
    }
  }
}

export function simulate(cfg: Partial<Config>): Result {
  return new Game(cfg).run();
}
