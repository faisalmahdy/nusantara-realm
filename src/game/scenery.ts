// Deterministic scenery layout, shared by World (rendering) and Player (collision)
// so both agree on exactly where the trees are. Seed 1337 keeps it stable.

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

export const SCENERY: Scenery[] = (() => {
  const rng = mulberry32(1337);
  const out: Scenery[] = [];
  for (let i = 0; i < 80; i++) {
    const x = (rng() - 0.5) * (WORLD - 8);
    const z = (rng() - 0.5) * (WORLD - 8);
    if (Math.abs(x) < 3.5) continue; // keep the path clear
    if (Math.hypot(x, z) > WORLD / 2 - 3) continue; // keep trees on the round island
    const k = rng();
    if (k < 0.42) out.push({ url: '/world/tree-banyan.png', height: 7, x, z, r: 1.4 });
    else if (k < 0.72) out.push({ url: '/world/tree-palm.png', height: 6.5, x, z, r: 1.0 });
    else out.push({ url: '/world/fern.png', height: 1.7, x, z, r: 0 });
  }
  return out;
})();

// Tree trunks the player can't walk through.
export const COLLIDERS: Scenery[] = SCENERY.filter((s) => s.r > 0);
