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

// A battle move. `element: null` means a typeless hit (always ×1.0) — useful
// when your element would be resisted, trading the matchup bonus for raw power.
export interface Move {
  name: string;
  element: Element | null;
  power: number; // multiplier on the attacker's atk
}

// Every monster knows a typed signature Strike (STAB) and a stronger typeless
// Focus Blow. The choice: Strike when you have the matchup, Focus Blow when not.
export function movesFor(element: Element): Move[] {
  return [
    { name: 'Strike', element, power: 1.6 },
    { name: 'Focus Blow', element: null, power: 2.2 },
  ];
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
  moves: Move[];
  bond: number; // 0..100; a bonded lead fights harder (see bondAtkMult). 0 for wilds.
}

// Per-level stat growth (kept gentle for the scaffold).
function derive(species: MonsterSpecies, level: number): { maxHp: number; atk: number; def: number } {
  return {
    maxHp: species.baseHp + (level - 1) * 4,
    atk: species.baseAtk + (level - 1) * 2,
    def: species.baseDef + (level - 1),
  };
}

/** Max HP for a species at a given level (used to persist/heal party HP). */
export function maxHpFor(speciesId: string, level: number): number {
  return derive(speciesById(speciesId), level).maxHp;
}

/** Build a fresh, full-HP combatant from a species id + level. */
export function makeCombatant(uid: string, speciesId: string, level: number): Combatant {
  const sp = speciesById(speciesId);
  const d = derive(sp, level);
  return { uid, speciesId, name: sp.name, element: sp.element, level, hp: d.maxHp, maxHp: d.maxHp, atk: d.atk, def: d.def, moves: movesFor(sp.element), bond: 0 };
}

// Bond perk: a well-raised lead hits harder, up to +20% damage at max bond.
// This is what makes ranch feeding pay off in battle.
export function bondAtkMult(bond: number): number {
  return 1 + (Math.max(0, Math.min(100, bond)) / 100) * 0.2;
}

/** Damage `attacker` deals to `defender` with `move`, including element matchup. */
export function computeDamage(attacker: Combatant, defender: Combatant, move: Move): { damage: number; eff: number } {
  const eff = move.element ? effectiveness(move.element, defender.element) : 1.0;
  const raw = attacker.atk * move.power * bondAtkMult(attacker.bond) - defender.def * 0.8;
  const damage = Math.max(1, Math.round(raw * eff));
  return { damage, eff };
}

/** Greedy enemy AI: pick the move that deals the most damage to the target. */
export function pickEnemyMove(enemy: Combatant, target: Combatant): Move {
  return enemy.moves.reduce((best, m) =>
    computeDamage(enemy, target, m).damage > computeDamage(enemy, target, best).damage ? m : best,
  enemy.moves[0]);
}

// Outcome of the enemy's counterattack against the active party member.
export interface CounterResult {
  party: Combatant[];
  turn: 'player' | 'over';
  outcome: 'lost' | null;
  mustSwitch: boolean; // active fainted but the team still has a fighter
}

/**
 * The enemy attacks the active team member, resolving a faint into either a
 * forced switch (others still standing) or a loss (whole team down). Pure;
 * appends to `log`. Used for the counter after your move, a failed tame, and the
 * free hit you take when you voluntarily switch.
 */
export function enemyCounter(party: Combatant[], active: number, enemy: Combatant, log: string[]): CounterResult {
  const target = party[active];
  const move = pickEnemyMove(enemy, target);
  const { damage, eff } = computeDamage(enemy, target, move);
  const hit = { ...target, hp: Math.max(0, target.hp - damage) };
  const next = party.map((c, i) => (i === active ? hit : c));
  log.push(`Wild ${enemy.name} used ${move.name} for ${damage}.${effectivenessNote(eff)}`);
  if (hit.hp > 0) return { party: next, turn: 'player', outcome: null, mustSwitch: false };
  log.push(`${hit.name} fainted!`);
  if (next.some((c) => c.hp > 0)) {
    log.push('Choose another monster!');
    return { party: next, turn: 'player', outcome: null, mustSwitch: true };
  }
  return { party: next, turn: 'over', outcome: 'lost', mustSwitch: false };
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

// Evolution stage (1/2/3) for a given level — picks which model a creature
// shows. Stage 2 from Lv 8, stage 3 from Lv 16.
export const EVOLUTION_LEVELS = [8, 16] as const;

export function evolutionStage(level: number): 1 | 2 | 3 {
  if (level >= 16) return 3;
  if (level >= 8) return 2;
  return 1;
}

// Level at which a monster reaches its next evolution stage, or null if final.
export function nextEvolutionLevel(level: number): number | null {
  return EVOLUTION_LEVELS.find((l) => l > level) ?? null;
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
