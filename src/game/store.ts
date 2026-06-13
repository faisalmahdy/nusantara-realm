import { create } from 'zustand';
import { speciesById } from './monsters';
import {
  Combatant, makeCombatant, computeDamage, effectivenessNote, tameChance,
} from './battle';

export interface TamedMonster {
  uid: string;
  speciesId: string;
  nickname: string;
  level: number;
  xp: number;
  bond: number; // 0..100, raised at the ranch
}

export type GameMode = 'explore' | 'taming' | 'party' | 'battle';

export interface BattleState {
  wildId: string;
  player: Combatant;
  enemy: Combatant;
  log: string[];
  turn: 'player' | 'over';
  outcome: 'won' | 'lost' | 'tamed' | 'fled' | null;
}

interface GameState {
  mode: GameMode;
  party: TamedMonster[];
  // wild ids that have been tamed and removed from the world
  tamedWildIds: string[];
  // id of the wild monster currently in range of the player, if any
  nearbyWildId: string | null;
  // wild monster the taming overlay is focused on
  tamingTargetId: string | null;
  // active turn-based battle, if any
  battle: BattleState | null;
  message: string | null;

  setMode: (m: GameMode) => void;
  setNearby: (id: string | null) => void;
  beginTaming: (wildId: string) => void;
  cancelTaming: () => void;
  tame: (speciesId: string, wildId: string) => boolean;
  beginBattle: (wildId: string) => void;
  battleAttack: () => void;
  battleTame: () => boolean;
  battleFlee: () => void;
  endBattle: () => void;
  flash: (msg: string) => void;
}

let uidCounter = 1;

export const useGame = create<GameState>((set, get) => ({
  mode: 'explore',
  party: [],
  tamedWildIds: [],
  nearbyWildId: null,
  tamingTargetId: null,
  battle: null,
  message: null,

  setMode: (m) => set({ mode: m }),
  setNearby: (id) => set({ nearbyWildId: id }),

  beginTaming: (wildId) => set({ mode: 'taming', tamingTargetId: wildId }),
  cancelTaming: () => set({ mode: 'explore', tamingTargetId: null }),

  tame: (speciesId, wildId) => {
    const species = speciesById(speciesId);
    // Rarer monsters resist taming; party size lowers the odds slightly.
    const base = 0.85 - (species.rarity - 1) * 0.22;
    const penalty = Math.min(get().party.length * 0.03, 0.2);
    const chance = Math.max(0.15, base - penalty);
    const success = Math.random() < chance;
    if (success) {
      const mon: TamedMonster = {
        uid: `m${uidCounter++}`,
        speciesId,
        nickname: species.name,
        level: 1,
        xp: 0,
        bond: 10,
      };
      set((s) => ({
        party: [...s.party, mon],
        tamedWildIds: [...s.tamedWildIds, wildId],
        mode: 'explore',
        tamingTargetId: null,
        nearbyWildId: null,
        message: `${species.name} was tamed!`,
      }));
    } else {
      set({ mode: 'explore', tamingTargetId: null, message: `${species.name} broke free!` });
    }
    return success;
  },

  // --- Battle (roadmap #1): weaken a wild monster, then tame it. ---------
  beginBattle: (wildId) => {
    const lead = get().party[0];
    if (!lead) {
      // No party monster to fight with — fall back to direct taming.
      get().beginTaming(wildId);
      return;
    }
    const enemySpeciesId = wildId.split('-')[1];
    const enemyLevel = Math.max(2, lead.level + 1);
    const player = makeCombatant(lead.uid, lead.speciesId, lead.level);
    const enemy = makeCombatant(wildId, enemySpeciesId, enemyLevel);
    set({
      mode: 'battle',
      tamingTargetId: null,
      battle: {
        wildId,
        player,
        enemy,
        turn: 'player',
        outcome: null,
        log: [`A wild ${enemy.name} (Lv ${enemy.level}) blocks your path!`],
      },
    });
  },

  battleAttack: () => {
    const b = get().battle;
    if (!b || b.turn !== 'player') return;
    const player = { ...b.player };
    const enemy = { ...b.enemy };
    const log = [...b.log];

    const hit = computeDamage(player, enemy);
    enemy.hp = Math.max(0, enemy.hp - hit.damage);
    log.push(`${player.name} attacks for ${hit.damage}.${effectivenessNote(hit.eff)}`);

    if (enemy.hp <= 0) {
      log.push(`The wild ${enemy.name} fainted and fled.`);
      set({ battle: { ...b, player, enemy, log, turn: 'over', outcome: 'won' } });
      return;
    }

    const back = computeDamage(enemy, player);
    player.hp = Math.max(0, player.hp - back.damage);
    log.push(`Wild ${enemy.name} hits back for ${back.damage}.${effectivenessNote(back.eff)}`);

    if (player.hp <= 0) {
      log.push(`${player.name} fainted!`);
      set({ battle: { ...b, player, enemy, log, turn: 'over', outcome: 'lost' } });
      return;
    }
    set({ battle: { ...b, player, enemy, log, turn: 'player' } });
  },

  battleTame: () => {
    const b = get().battle;
    if (!b || b.turn !== 'player') return false;
    const species = speciesById(b.enemy.speciesId);
    const chance = tameChance(b.enemy, species.rarity, get().party.length);
    const success = Math.random() < chance;
    const log = [...b.log, `You offer a treat to the weakened ${b.enemy.name}…`];

    if (success) {
      const mon: TamedMonster = {
        uid: `m${uidCounter++}`,
        speciesId: b.enemy.speciesId,
        nickname: species.name,
        level: b.enemy.level,
        xp: 0,
        bond: 15,
      };
      log.push(`${species.name} was tamed!`);
      set((s) => ({
        party: [...s.party, mon],
        tamedWildIds: [...s.tamedWildIds, b.wildId],
        nearbyWildId: null,
        battle: { ...b, log, turn: 'over', outcome: 'tamed' },
      }));
      return true;
    }

    // Failed — the enemy gets a free counter.
    const enemy = { ...b.enemy };
    const player = { ...b.player };
    log.push(`${species.name} broke free!`);
    const back = computeDamage(enemy, player);
    player.hp = Math.max(0, player.hp - back.damage);
    log.push(`Wild ${enemy.name} hits back for ${back.damage}.${effectivenessNote(back.eff)}`);
    if (player.hp <= 0) {
      log.push(`${player.name} fainted!`);
      set({ battle: { ...b, player, enemy, log, turn: 'over', outcome: 'lost' } });
    } else {
      set({ battle: { ...b, player, enemy, log, turn: 'player' } });
    }
    return false;
  },

  battleFlee: () => {
    const b = get().battle;
    if (!b) return;
    set({ battle: { ...b, turn: 'over', outcome: 'fled', log: [...b.log, 'You backed away from the battle.'] } });
  },

  endBattle: () => {
    const b = get().battle;
    const msg =
      b?.outcome === 'tamed' ? `${b.enemy.name} joined your party!`
      : b?.outcome === 'won' ? `The wild ${b.enemy.name} fled.`
      : b?.outcome === 'lost' ? `${b.player.name} was defeated…`
      : null;
    set({ mode: 'explore', battle: null, tamingTargetId: null, message: msg });
  },

  flash: (msg) => set({ message: msg }),
}));
