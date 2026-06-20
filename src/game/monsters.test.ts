import { describe, it, expect } from 'vitest';
import { SPECIES, speciesById, discoveredSpeciesIds, ELEMENT_COLOR } from './monsters';

describe('SPECIES roster', () => {
  it('has 17 species across both regions, each with unique id and lore', () => {
    expect(SPECIES).toHaveLength(17);
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(17);
    for (const s of SPECIES) {
      expect(s.lore.length).toBeGreaterThan(20);
      expect(ELEMENT_COLOR[s.element]).toBeTruthy();
    }
  });
  it('speciesById resolves and throws on unknown', () => {
    expect(speciesById('kancil').name).toBe('Kancil');
    expect(() => speciesById('nope')).toThrow();
  });
});

describe('discoveredSpeciesIds', () => {
  it('is empty with no progress', () => {
    expect(discoveredSpeciesIds([], []).size).toBe(0);
  });
  it('includes party species', () => {
    const d = discoveredSpeciesIds(['kancil', 'matong'], []);
    expect(d.has('kancil')).toBe(true);
    expect(d.has('matong')).toBe(true);
    expect(d.has('dugang')).toBe(false);
  });
  it('derives species from tamed wild ids and de-dupes', () => {
    const d = discoveredSpeciesIds(['kancil'], ['wild-kancil-1', 'wild-dugang-2']);
    expect(d.has('kancil')).toBe(true); // from both sources, counted once
    expect(d.has('dugang')).toBe(true);
    expect(d.size).toBe(2);
  });
});
