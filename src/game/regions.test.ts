import { describe, it, expect } from 'vitest';
import { REGIONS, regionById, HOME_REGION } from './regions';
import { makeInitialSpawns } from './spawns';
import { speciesById } from './monsters';

describe('regions', () => {
  it('has a free home region and a Guardian-gated chain', () => {
    expect(HOME_REGION).toBe('saujana');
    expect(REGIONS.map((r) => r.id)).toEqual(['saujana', 'beringin', 'cinder']);
    expect(regionById('saujana').unlockedBy).toBeNull();
    expect(regionById('beringin').unlockedBy).toBe('saujana');
    expect(regionById('cinder').unlockedBy).toBe('beringin');
  });

  it('falls back to the home region for an unknown id', () => {
    expect(regionById('nowhere').id).toBe('saujana');
  });

  it('every roster + Guardian species resolves to a real species', () => {
    for (const r of REGIONS) {
      for (const id of r.speciesIds) expect(() => speciesById(id)).not.toThrow();
      expect(() => speciesById(r.guardian.speciesId)).not.toThrow();
    }
  });

  it('builds region-specific spawns with that region’s Guardian', () => {
    const b = makeInitialSpawns(regionById('beringin'));
    expect(b.find((s) => s.guardian)?.wildId).toBe('guardian-banyan-0');
    expect(b.filter((s) => !s.guardian)).toHaveLength(4);
    expect(b[0].wildId).toBe('wild-karang-0');

    const c = makeInitialSpawns(regionById('cinder'));
    expect(c.find((s) => s.guardian)?.wildId).toBe('guardian-barawatua-0');
    expect(c.filter((s) => !s.guardian)).toHaveLength(4);
    expect(c[0].wildId).toBe('wild-barabamut-0');
  });
});
