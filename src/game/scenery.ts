// Deterministic scenery layout, shared by World (rendering) and Player (collision)
// so both agree on exactly where the trees are. Each region gets its own seeded
// layout; the home isle (seed 1337, default weights) is unchanged.

import { REGIONS, RegionScenery } from './regions';

export const WORLD = 90;

export interface Scenery {
  url: string;
  height: number;
  x: number;
  z: number;
  r: number; // trunk collision radius; 0 = walkable (low foliage)
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RegionScene { scenery: Scenery[]; colliders: Scenery[] }

// Scatter trees + ferns across a round island, keeping the path clear and the
// shore tree-free. Pure in `seed`, so it's stable per region.
export function makeScenery({ seed, count = 80, banyanWeight = 0.42, palmWeight = 0.30 }: RegionScenery): RegionScene {
  const rng = mulberry32(seed);
  const out: Scenery[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * (WORLD - 8);
    const z = (rng() - 0.5) * (WORLD - 8);
    if (Math.abs(x) < 3.5) continue; // keep the path clear
    if (Math.hypot(x, z) > WORLD / 2 - 3) continue; // keep trees on the round island
    const k = rng();
    if (k < banyanWeight) out.push({ url: '/world/tree-banyan.png', height: 7, x, z, r: 1.4 });
    else if (k < banyanWeight + palmWeight) out.push({ url: '/world/tree-palm.png', height: 6.5, x, z, r: 1.0 });
    else out.push({ url: '/world/fern.png', height: 1.7, x, z, r: 0 });
  }
  return { scenery: out, colliders: out.filter((s) => s.r > 0) };
}

// One layout per region, built once at module load.
const SCENERY_BY_REGION: Record<string, RegionScene> = Object.fromEntries(
  REGIONS.map((r) => [r.id, makeScenery(r.scenery)]),
);

export function sceneryFor(regionId: string): RegionScene {
  return SCENERY_BY_REGION[regionId] ?? SCENERY_BY_REGION[REGIONS[0].id];
}

/** Tree trunks the player can't walk through, for the given region. */
export function collidersFor(regionId: string): Scenery[] {
  return sceneryFor(regionId).colliders;
}
