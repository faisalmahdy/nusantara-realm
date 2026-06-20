import { WildSpawn } from './shared';
import { Region, REGIONS } from './regions';

// The starting ring of wild monsters for a region — one per species, spread
// around the island — plus that region's Guardian standing watch to the north.
export function makeInitialSpawns(region: Region = REGIONS[0]): WildSpawn[] {
  const ids = region.speciesIds;
  const ring: WildSpawn[] = ids.map((id, i) => {
    const angle = (i / ids.length) * Math.PI * 2;
    const r = 13 + (i % 4) * 4;
    return {
      wildId: `wild-${id}-${i}`,
      speciesId: id,
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      phase: i,
      level: 1 + i * 2,
    };
  });
  ring.push({
    wildId: `guardian-${region.guardian.speciesId}-0`,
    speciesId: region.guardian.speciesId,
    x: 0, z: -34, phase: 99, level: region.guardian.level, guardian: true,
  });
  return ring;
}

// Replace any spawn whose wild has been tamed with a fresh wild in the same spot
// (new unique id so it isn't flagged tamed, random species + level) so the world
// stays huntable instead of emptying out. The respawn pool is drawn from the
// region's own wilds (read off the current spawns), so respawns stay on-theme.
// Pure: `rng` is injectable for tests. The monotonic `counter` guarantees
// respawn ids never repeat or collide with the initial `wild-<id>-<i>` ids.
export function respawnTamed(
  spawns: WildSpawn[],
  tamed: Set<string>,
  counter: number,
  rng: () => number = Math.random,
): { spawns: WildSpawn[]; counter: number; changed: boolean } {
  const pool = spawns.filter((s) => !s.guardian).map((s) => s.speciesId);
  let c = counter;
  let changed = false;
  const next = spawns.map((s) => {
    if (s.guardian) return s; // Guardians are a one-time milestone — never respawn
    if (!tamed.has(s.wildId)) return s;
    changed = true;
    const id = pool[Math.floor(rng() * pool.length)] ?? s.speciesId;
    const level = 1 + Math.floor(rng() * 8) * 2;
    return { ...s, wildId: `wild-${id}-r${c++}`, speciesId: id, level };
  });
  return { spawns: next, counter: c, changed };
}
