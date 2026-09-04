// Seeded RNG so every run is reproducible. mulberry32.
export class RNG {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number { return Math.floor(this.next() * n); }
  d6(): number { return this.int(6) + 1; }
  pick<T>(a: readonly T[]): T { return a[this.int(a.length)]; }
  shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// HeroQuest combat die: 3 skulls, 2 white shields, 1 black shield.
export const SKULL = 0, WHITE = 1, BLACK = 2;
export function combatDie(rng: RNG): number {
  const r = rng.int(6);
  return r < 3 ? SKULL : r < 5 ? WHITE : BLACK;
}
export function rollSkulls(rng: RNG, n: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (combatDie(rng) === SKULL) k++;
  return k;
}
export function rollShields(rng: RNG, n: number, black: boolean): number {
  const want = black ? BLACK : WHITE;
  let k = 0;
  for (let i = 0; i < n; i++) if (combatDie(rng) === want) k++;
  return k;
}
