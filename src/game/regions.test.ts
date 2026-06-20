import { describe, it, expect } from 'vitest';
import { REGIONS, regionById, HOME_REGION } from './regions';
import { makeInitialSpawns } from './spawns';
import { speciesById } from './monsters';

describe('regions', () => {
  it('has a free home region and a Guardian-gated second region', () => {
    expect(HOME_REGION).toBe('saujana');
    expect(regionById('saujana').unlockedBy).toBeNull();
    expect(regionById('beringin').unlockedBy).toBe('saujana');
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

  it('docks point at a real, distinct destination region', () => {
    for (const r of REGIONS) {
      expect(regionById(r.dock.to).id).toBe(r.dock.to);
      expect(r.dock.to).not.toBe(r.id);
    }
  });

  it('builds region-specific spawns with that region’s Guardian', () => {
    const b = makeInitialSpawns(regionById('beringin'));
    expect(b.find((s) => s.guardian)?.wildId).toBe('guardian-banyan-0');
    expect(b.filter((s) => !s.guardian)).toHaveLength(4);
    expect(b[0].wildId).toBe('wild-karang-0');
  });
});
