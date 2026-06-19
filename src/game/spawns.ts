import { SPECIES } from './monsters';
import { WildSpawn } from './shared';

// The starting ring of wild monsters — one per species, spread around the island.
export function makeInitialSpawns(): WildSpawn[] {
  return SPECIES.map((sp, i) => {
    const angle = (i / SPECIES.length) * Math.PI * 2;
    const r = 13 + (i % 4) * 4;
    return {
      wildId: `wild-${sp.id}-${i}`,
      speciesId: sp.id,
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      phase: i,
      level: 1 + i * 2,
    };
  });
}

// Replace any spawn whose wild has been tamed with a fresh wild in the same spot
// (new unique id so it isn't flagged tamed, random species + level) so the world
// stays huntable instead of emptying out. Pure: `rng` is injectable for tests.
// The monotonic `counter` guarantees respawn ids never repeat or collide with
// the initial `wild-<id>-<i>` ids.
export function respawnTamed(
  spawns: WildSpawn[],
  tamed: Set<string>,
  counter: number,
  rng: () => number = Math.random,
): { spawns: WildSpawn[]; counter: number; changed: boolean } {
  let c = counter;
  let changed = false;
  const next = spawns.map((s) => {
    if (!tamed.has(s.wildId)) return s;
    changed = true;
    const sp = SPECIES[Math.floor(rng() * SPECIES.length)];
    const level = 1 + Math.floor(rng() * 8) * 2;
    return { ...s, wildId: `wild-${sp.id}-r${c++}`, speciesId: sp.id, level };
  });
  return { spawns: next, counter: c, changed };
}
