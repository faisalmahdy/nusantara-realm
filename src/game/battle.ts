import { MonsterSpecies, speciesById } from './monsters';

// ---------------------------------------------------------------------------
// Turn-based battle engine (pure logic — no React, no store). The store wires
// these helpers into game state; the BattleScreen renders it. First slice of
// the battle system (roadmap #1): weaken a wild monster in battle, then tame it.
// ---------------------------------------------------------------------------

export type Element = MonsterSpecies['element'];

// Element pentagon: each beats the next, is weak to the previous.
// Forest → Earth → Sky → Sea → Spirit → Forest.
const STRONG_AGAINST: Record<Element, Element> = {
  Forest: 'Earth',
  Earth: 'Sky',
  Sky: 'Sea',
  Sea: 'Spirit',
  Spirit: 'Forest',
};

/** Damage multiplier for an attacker element hitting a defender element. */
export function effectiveness(atk: Element, def: Element): number {
  if (STRONG_AGAINST[atk] === def) return 1.5;
  if (STRONG_AGAINST[def] === atk) return 0.67;
  return 1.0;
}

export interface Combatant {
  uid: string; // party uid for the player; wildId for the enemy
  speciesId: string;
  name: string;
  element: Element;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

// Per-level stat growth (kept gentle for the scaffold).
function derive(species: MonsterSpecies, level: number): { maxHp: number; atk: number; def: number } {
  return {
    maxHp: species.baseHp + (level - 1) * 4,
    atk: species.baseAtk + (level - 1) * 2,
    def: species.baseDef + (level - 1),
  };
}

/** Build a fresh, full-HP combatant from a species id + level. */
export function makeCombatant(uid: string, speciesId: string, level: number): Combatant {
  const sp = speciesById(speciesId);
  const d = derive(sp, level);
  return { uid, speciesId, name: sp.name, element: sp.element, level, hp: d.maxHp, maxHp: d.maxHp, atk: d.atk, def: d.def };
}

/** Damage `attacker` deals to `defender` this turn, including element matchup. */
export function computeDamage(attacker: Combatant, defender: Combatant): { damage: number; eff: number } {
  const eff = effectiveness(attacker.element, defender.element);
  const raw = attacker.atk * 1.6 - defender.def * 0.8;
  const damage = Math.max(1, Math.round(raw * eff));
  return { damage, eff };
}

/** A short human-readable note on the matchup, for the battle log. */
export function effectivenessNote(eff: number): string {
  if (eff > 1) return " It's super effective!";
  if (eff < 1) return ' It wasn’t very effective…';
  return '';
}

// XP a monster earns for defeating or taming an enemy of the given level.
export function xpForDefeating(enemyLevel: number): number {
  return 8 + enemyLevel * 6;
}

// XP needed to advance from `level` to the next.
export function xpToNext(level: number): number {
  return 12 + level * 8;
}

// Apply an XP gain, rolling over into as many level-ups as it covers.
export function applyXp(level: number, xp: number, gain: number): { level: number; xp: number; levelsGained: number } {
  let l = level, x = xp + gain, gained = 0;
  while (x >= xpToNext(l)) { x -= xpToNext(l); l++; gained++; }
  return { level: l, xp: x, levelsGained: gained };
}

/** Taming odds in battle, scaled by how weakened the enemy is. */
export function tameChance(enemy: Combatant, rarity: number, partySize: number): number {
  const hpFrac = enemy.hp / enemy.maxHp; // 1 = full, 0 = nearly fainted
  const base = 0.85 - (rarity - 1) * 0.22;
  const weakenBonus = (1 - hpFrac) * 0.6; // up to +0.6 when nearly fainted
  const penalty = Math.min(partySize * 0.03, 0.2);
  return Math.max(0.1, Math.min(0.97, base + weakenBonus - penalty));
}
