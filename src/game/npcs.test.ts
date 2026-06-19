import { describe, it, expect } from 'vitest';
import { NPCS, npcById } from './npcs';

describe('NPCS', () => {
  it('has unique ids and non-empty dialogue', () => {
    expect(NPCS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(NPCS.map((n) => n.id)).size).toBe(NPCS.length);
    for (const n of NPCS) {
      expect(n.name).toBeTruthy();
      expect(n.lines.length).toBeGreaterThan(0);
    }
  });
  it('npcById resolves a known id and misses an unknown one', () => {
    expect(npcById('elder')?.name).toBe('Elder Sari');
    expect(npcById('nobody')).toBeUndefined();
  });
});
