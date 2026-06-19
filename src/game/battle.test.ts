import { describe, it, expect } from 'vitest';
import {
  effectiveness, movesFor, makeCombatant, maxHpFor, bondAtkMult, computeDamage,
  pickEnemyMove, effectivenessNote, xpForDefeating, xpToNext, applyXp,
  evolutionStage, nextEvolutionLevel, EVOLUTION_LEVELS, tameChance, enemyCounter,
  type Combatant, type Move,
} from './battle';

// Helper: a combatant with explicit stats, bypassing species tables so damage
// tests stay independent of roster tuning.
function fighter(over: Partial<Combatant> = {}): Combatant {
  return {
    uid: 'x', speciesId: 'kancil', name: 'Test', element: 'Forest', level: 1,
    hp: 100, maxHp: 100, atk: 20, def: 10, moves: movesFor('Forest'), bond: 0,
    ...over,
  };
}

describe('effectiveness (element pentagon Forest→Earth→Sky→Sea→Spirit→Forest)', () => {
  it('is super-effective (1.5) against the element it beats', () => {
    expect(effectiveness('Forest', 'Earth')).toBe(1.5);
    expect(effectiveness('Earth', 'Sky')).toBe(1.5);
    expect(effectiveness('Sky', 'Sea')).toBe(1.5);
    expect(effectiveness('Sea', 'Spirit')).toBe(1.5);
    expect(effectiveness('Spirit', 'Forest')).toBe(1.5);
  });
  it('is resisted (0.67) against the element that beats it', () => {
    expect(effectiveness('Earth', 'Forest')).toBe(0.67);
    expect(effectiveness('Forest', 'Spirit')).toBe(0.67);
  });
  it('is neutral (1.0) for same element and non-adjacent matchups', () => {
    expect(effectiveness('Forest', 'Forest')).toBe(1.0);
    expect(effectiveness('Forest', 'Sky')).toBe(1.0);
    expect(effectiveness('Forest', 'Sea')).toBe(1.0);
  });
});

describe('movesFor', () => {
  it('gives a typed STAB Strike and a typeless Focus Blow', () => {
    const moves = movesFor('Sea');
    expect(moves).toHaveLength(2);
    expect(moves[0]).toMatchObject({ name: 'Strike', element: 'Sea', power: 1.6 });
    expect(moves[1]).toMatchObject({ name: 'Focus Blow', element: null });
    expect(moves[1].power).toBeGreaterThan(moves[0].power);
  });
});

describe('makeCombatant / maxHpFor stat scaling', () => {
  it('starts at full HP with element-derived moves', () => {
    const c = makeCombatant('m1', 'kancil', 1);
    expect(c.hp).toBe(c.maxHp);
    expect(c.maxHp).toBe(maxHpFor('kancil', 1));
    expect(c.bond).toBe(0);
    expect(c.moves[0].element).toBe('Forest'); // kancil is Forest
  });
  it('scales HP up with level', () => {
    expect(maxHpFor('kancil', 5)).toBeGreaterThan(maxHpFor('kancil', 1));
    // +4 HP per level beyond the first
    expect(maxHpFor('kancil', 5) - maxHpFor('kancil', 1)).toBe(16);
  });
});

describe('bondAtkMult', () => {
  it('ranges 1.0 → 1.2 across 0..100 bond and clamps outside it', () => {
    expect(bondAtkMult(0)).toBe(1);
    expect(bondAtkMult(50)).toBeCloseTo(1.1, 5);
    expect(bondAtkMult(100)).toBeCloseTo(1.2, 5);
    expect(bondAtkMult(-20)).toBe(1);
    expect(bondAtkMult(999)).toBeCloseTo(1.2, 5);
  });
});

describe('computeDamage', () => {
  const strike: Move = { name: 'Strike', element: 'Forest', power: 1.6 };
  const focus: Move = { name: 'Focus Blow', element: null, power: 2.2 };

  it('applies the element matchup to typed moves', () => {
    const atk = fighter({ element: 'Forest' });
    const weakTo = fighter({ element: 'Earth' }); // Forest > Earth
    const resists = fighter({ element: 'Spirit' }); // Spirit > Forest
    const neutral = fighter({ element: 'Sky' });
    expect(computeDamage(atk, weakTo, strike).eff).toBe(1.5);
    expect(computeDamage(atk, resists, strike).eff).toBe(0.67);
    expect(computeDamage(atk, neutral, strike).eff).toBe(1.0);
    expect(computeDamage(atk, weakTo, strike).damage)
      .toBeGreaterThan(computeDamage(atk, neutral, strike).damage);
  });

  it('ignores the matchup for typeless moves (always ×1.0)', () => {
    const atk = fighter({ element: 'Forest' });
    expect(computeDamage(atk, fighter({ element: 'Earth' }), focus).eff).toBe(1.0);
    expect(computeDamage(atk, fighter({ element: 'Spirit' }), focus).eff).toBe(1.0);
  });

  it('a bonded attacker hits harder', () => {
    const lo = computeDamage(fighter({ bond: 0 }), fighter({ element: 'Sky' }), strike).damage;
    const hi = computeDamage(fighter({ bond: 100 }), fighter({ element: 'Sky' }), strike).damage;
    expect(hi).toBeGreaterThan(lo);
  });

  it('never deals less than 1, even into huge defense', () => {
    const tiny = fighter({ atk: 1 });
    const wall = fighter({ def: 999, element: 'Sky' });
    expect(computeDamage(tiny, wall, strike).damage).toBe(1);
  });
});

describe('pickEnemyMove (greedy best-damage AI)', () => {
  it('prefers Focus Blow when its Strike would be resisted', () => {
    const enemy = fighter({ element: 'Forest', moves: movesFor('Forest') });
    const target = fighter({ element: 'Spirit' }); // resists Forest Strike
    expect(pickEnemyMove(enemy, target).name).toBe('Focus Blow');
  });
  it('prefers Strike when it is super-effective', () => {
    const enemy = fighter({ element: 'Forest', moves: movesFor('Forest') });
    const target = fighter({ element: 'Earth' }); // weak to Forest
    expect(pickEnemyMove(enemy, target).name).toBe('Strike');
  });
});

describe('effectivenessNote', () => {
  it('annotates only non-neutral hits', () => {
    expect(effectivenessNote(1.5)).toMatch(/super effective/i);
    expect(effectivenessNote(0.67)).toMatch(/very effective/i); // "…wasn’t very effective…"
    expect(effectivenessNote(1.0)).toBe('');
  });
});

describe('XP & leveling', () => {
  it('xpForDefeating and xpToNext grow with level', () => {
    expect(xpForDefeating(1)).toBe(14);
    expect(xpForDefeating(5)).toBe(38);
    expect(xpToNext(1)).toBe(20);
    expect(xpToNext(2)).toBe(28);
  });
  it('applyXp banks XP without leveling when under the threshold', () => {
    expect(applyXp(1, 0, 10)).toEqual({ level: 1, xp: 10, levelsGained: 0 });
  });
  it('applyXp levels up once on an exact threshold', () => {
    expect(applyXp(1, 0, 20)).toEqual({ level: 2, xp: 0, levelsGained: 1 });
  });
  it('applyXp rolls over multiple level-ups', () => {
    // 100 xp from L1: -20→L2, -28→L3, -36→L4, 16 left
    expect(applyXp(1, 0, 100)).toEqual({ level: 4, xp: 16, levelsGained: 3 });
  });
});

describe('evolution stages', () => {
  it('maps level → stage at the evolution thresholds', () => {
    expect(EVOLUTION_LEVELS).toEqual([8, 16]);
    expect(evolutionStage(1)).toBe(1);
    expect(evolutionStage(7)).toBe(1);
    expect(evolutionStage(8)).toBe(2);
    expect(evolutionStage(15)).toBe(2);
    expect(evolutionStage(16)).toBe(3);
    expect(evolutionStage(30)).toBe(3);
  });
  it('reports the next evolution level, or null at the final form', () => {
    expect(nextEvolutionLevel(1)).toBe(8);
    expect(nextEvolutionLevel(8)).toBe(16);
    expect(nextEvolutionLevel(16)).toBeNull();
  });
});

describe('enemyCounter (party-switch resolution)', () => {
  const enemy = fighter({ name: 'Wild', element: 'Forest', atk: 100, def: 5, moves: movesFor('Forest') });

  it('returns the turn to the player when the active member survives', () => {
    const party = [fighter({ name: 'A', hp: 500, maxHp: 500, def: 50 })];
    const r = enemyCounter(party, 0, enemy, []);
    expect(r.turn).toBe('player');
    expect(r.outcome).toBeNull();
    expect(r.mustSwitch).toBe(false);
    expect(r.party[0].hp).toBeGreaterThan(0);
    expect(r.party[0].hp).toBeLessThan(500);
  });

  it('forces a switch when the active faints but a teammate stands', () => {
    const party = [fighter({ name: 'A', hp: 1, maxHp: 100 }), fighter({ name: 'B', hp: 50, maxHp: 100 })];
    const r = enemyCounter(party, 0, enemy, []);
    expect(r.party[0].hp).toBe(0);
    expect(r.mustSwitch).toBe(true);
    expect(r.turn).toBe('player');
    expect(r.outcome).toBeNull();
  });

  it('is a loss when the active faints and no one is left', () => {
    const party = [fighter({ name: 'A', hp: 1, maxHp: 100 })];
    const r = enemyCounter(party, 0, enemy, []);
    expect(r.party[0].hp).toBe(0);
    expect(r.outcome).toBe('lost');
    expect(r.turn).toBe('over');
    expect(r.mustSwitch).toBe(false);
  });

  it('does not mutate the input party', () => {
    const party = [fighter({ name: 'A', hp: 100, maxHp: 100 })];
    enemyCounter(party, 0, enemy, []);
    expect(party[0].hp).toBe(100);
  });
});

describe('tameChance', () => {
  const enemyAt = (hpFrac: number): Combatant => fighter({ hp: Math.round(100 * hpFrac), maxHp: 100 });

  it('rises as the enemy is weakened', () => {
    expect(tameChance(enemyAt(0.2), 1, 0)).toBeGreaterThan(tameChance(enemyAt(1), 1, 0));
  });
  it('falls for rarer monsters', () => {
    expect(tameChance(enemyAt(1), 3, 0)).toBeLessThan(tameChance(enemyAt(1), 1, 0));
  });
  it('applies a party-size penalty that caps out', () => {
    expect(tameChance(enemyAt(1), 1, 3)).toBeLessThan(tameChance(enemyAt(1), 1, 0));
    // penalty caps at 0.2, so party 10 and party 100 give the same odds
    expect(tameChance(enemyAt(1), 1, 10)).toBeCloseTo(tameChance(enemyAt(1), 1, 100), 5);
  });
  it('stays within [0.1, 0.97]', () => {
    expect(tameChance(enemyAt(0), 1, 0)).toBeLessThanOrEqual(0.97); // near-fainted, easy
    expect(tameChance(enemyAt(1), 3, 100)).toBeGreaterThanOrEqual(0.1); // rare, full, huge party
  });
});
