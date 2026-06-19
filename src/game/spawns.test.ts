import { describe, it, expect } from 'vitest';
import { makeInitialSpawns, respawnTamed } from './spawns';

describe('makeInitialSpawns', () => {
  it('creates one unique wild per species plus the Guardian', () => {
    const init = makeInitialSpawns();
    expect(init).toHaveLength(13); // 12 species + 1 Guardian
    expect(new Set(init.map((s) => s.wildId)).size).toBe(13);
    expect(init[0].wildId).toBe('wild-matong-0');
    expect(init.find((s) => s.guardian)?.wildId).toBe('guardian-naris-0');
  });
});

describe('respawnTamed', () => {
  it('leaves untamed slots untouched', () => {
    const init = makeInitialSpawns();
    const res = respawnTamed(init, new Set(), 1000);
    expect(res.changed).toBe(false);
    expect(res.counter).toBe(1000);
    expect(res.spawns).toEqual(init);
  });

  it('replaces a tamed slot with a fresh, untamed wild in the same spot', () => {
    const init = makeInitialSpawns();
    const tamed = new Set([init[3].wildId]);
    const res = respawnTamed(init, tamed, 1000, () => 0); // rng 0 → first species, level 1

    expect(res.changed).toBe(true);
    expect(res.counter).toBe(1001);
    const slot = res.spawns[3];
    expect(slot.wildId).toBe('wild-matong-r1000'); // fresh id with r-suffix
    expect(slot.wildId).not.toBe(init[3].wildId);
    expect(tamed.has(slot.wildId)).toBe(false); // not flagged tamed → it will render
    expect(slot.x).toBe(init[3].x); // same position
    expect(slot.z).toBe(init[3].z);
    // other slots unchanged
    expect(res.spawns[0]).toBe(init[0]);
  });

  it('never respawns the Guardian', () => {
    const init = makeInitialSpawns();
    const guardian = init.find((s) => s.guardian)!;
    const res = respawnTamed(init, new Set([guardian.wildId]), 1000);
    expect(res.spawns.find((s) => s.guardian)?.wildId).toBe(guardian.wildId);
  });

  it('advances the counter per replacement so ids never repeat', () => {
    const init = makeInitialSpawns();
    const tamed = new Set([init[0].wildId, init[1].wildId]);
    const res = respawnTamed(init, tamed, 5, () => 0);
    expect(res.counter).toBe(7);
    expect(res.spawns[0].wildId).not.toBe(res.spawns[1].wildId);
  });
});
