import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { speciesById } from './monsters';
import {
  Combatant, makeCombatant, computeDamage, effectivenessNote, tameChance,
  xpForDefeating, applyXp, pickEnemyMove, bondAtkMult, maxHpFor,
} from './battle';

export interface TamedMonster {
  uid: string;
  speciesId: string;
  nickname: string;
  level: number;
  xp: number;
  bond: number; // 0..100, raised at the ranch
  hp: number; // current HP; persists between battles, restored by resting
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
  battleMove: (moveIndex: number) => void;
  battleTame: () => boolean;
  battleFlee: () => void;
  endBattle: () => void;
  feed: (uid: string) => void;
  rest: (uid: string) => void;
  flash: (msg: string) => void;
}

let uidCounter = 1;

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
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
        hp: maxHpFor(speciesId, 1),
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
    if (lead.hp <= 0) {
      set({ message: `${lead.nickname} is in no shape to fight — rest it first.` });
      return;
    }
    const enemySpeciesId = wildId.split('-')[1];
    const enemyLevel = Math.max(2, lead.level + 1);
    const player = makeCombatant(lead.uid, lead.speciesId, lead.level);
    player.bond = lead.bond;
    player.hp = Math.min(player.maxHp, lead.hp); // carry forward wear from past battles
    const enemy = makeCombatant(wildId, enemySpeciesId, enemyLevel);
    const log = [`A wild ${enemy.name} (Lv ${enemy.level}) blocks your path!`];
    if (lead.bond >= 50) log.push(`${player.name}'s bond spurs it on. (+${Math.round((bondAtkMult(lead.bond) - 1) * 100)}% damage)`);
    set({
      mode: 'battle',
      tamingTargetId: null,
      battle: {
        wildId,
        player,
        enemy,
        turn: 'player',
        outcome: null,
        log,
      },
    });
  },

  battleMove: (moveIndex) => {
    const b = get().battle;
    if (!b || b.turn !== 'player') return;
    const player = { ...b.player };
    const enemy = { ...b.enemy };
    const log = [...b.log];

    const move = player.moves[moveIndex] ?? player.moves[0];
    const hit = computeDamage(player, enemy, move);
    enemy.hp = Math.max(0, enemy.hp - hit.damage);
    log.push(`${player.name} used ${move.name} for ${hit.damage}.${effectivenessNote(hit.eff)}`);

    if (enemy.hp <= 0) {
      log.push(`The wild ${enemy.name} fainted and fled.`);
      const lead = get().party[0];
      const gain = xpForDefeating(enemy.level);
      const res = applyXp(lead.level, lead.xp, gain);
      log.push(`${lead.nickname} gained ${gain} XP.`);
      if (res.levelsGained > 0) log.push(`${lead.nickname} grew to Lv ${res.level}!`);
      set((st) => ({
        party: st.party.map((m, i) => (i === 0 ? { ...m, level: res.level, xp: res.xp } : m)),
        battle: { ...b, player, enemy, log, turn: 'over', outcome: 'won' },
      }));
      return;
    }

    const eMove = pickEnemyMove(enemy, player);
    const back = computeDamage(enemy, player, eMove);
    player.hp = Math.max(0, player.hp - back.damage);
    log.push(`Wild ${enemy.name} used ${eMove.name} for ${back.damage}.${effectivenessNote(back.eff)}`);

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
        hp: maxHpFor(b.enemy.speciesId, b.enemy.level),
      };
      const lead = get().party[0];
      const gain = xpForDefeating(b.enemy.level);
      const res = applyXp(lead.level, lead.xp, gain);
      log.push(`${species.name} was tamed!`);
      log.push(`${lead.nickname} gained ${gain} XP.`);
      if (res.levelsGained > 0) log.push(`${lead.nickname} grew to Lv ${res.level}!`);
      set((s) => ({
        party: [...s.party.map((m, i) => (i === 0 ? { ...m, level: res.level, xp: res.xp } : m)), mon],
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
    const eMove = pickEnemyMove(enemy, player);
    const back = computeDamage(enemy, player, eMove);
    player.hp = Math.max(0, player.hp - back.damage);
    log.push(`Wild ${enemy.name} used ${eMove.name} for ${back.damage}.${effectivenessNote(back.eff)}`);
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
    // Carry the lead's remaining HP out of battle so wear persists until it rests.
    const party = b
      ? get().party.map((m) => (m.uid === b.player.uid ? { ...m, hp: b.player.hp } : m))
      : get().party;
    set({ mode: 'explore', battle: null, tamingTargetId: null, message: msg, party });
  },

  // --- Ranch (roadmap #2): feed a party monster to raise bond + a little XP.
  // Feeding stops giving rewards once the monster is fully content (bond 100),
  // so it can't be button-mashed into infinite levels.
  feed: (uid) => {
    const m = get().party.find((x) => x.uid === uid);
    if (!m) return;
    if (m.bond >= 100) {
      set({ message: `${m.nickname} is already content.` });
      return;
    }
    const bond = Math.min(100, m.bond + 8);
    const res = applyXp(m.level, m.xp, 5);
    set((s) => ({
      party: s.party.map((x) => (x.uid === uid ? { ...x, bond, level: res.level, xp: res.xp } : x)),
      message: res.levelsGained > 0
        ? `${m.nickname} grew to Lv ${res.level}!`
        : `${m.nickname} enjoyed the treat. (Bond ${bond})`,
    }));
  },

  // Rest a monster back to full HP. The recovery side of persistent battle HP —
  // without this a worn-down party would have no way back to fighting shape.
  rest: (uid) => {
    const m = get().party.find((x) => x.uid === uid);
    if (!m) return;
    const full = maxHpFor(m.speciesId, m.level);
    if (m.hp >= full) {
      set({ message: `${m.nickname} is already at full health.` });
      return;
    }
    set((s) => ({
      party: s.party.map((x) => (x.uid === uid ? { ...x, hp: full } : x)),
      message: `${m.nickname} is fully rested.`,
    }));
  },

  flash: (msg) => set({ message: msg }),
    }),
    {
      name: 'nusantara-realm-save',
      // Only the durable progression survives a reload; transient UI/battle
      // state always starts fresh in 'explore'.
      partialize: (s) => ({ party: s.party, tamedWildIds: s.tamedWildIds }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Resume uid issuance past any restored monster so new tames don't collide.
        let max = 0;
        for (const m of state.party) {
          const n = parseInt(m.uid.slice(1), 10);
          if (Number.isFinite(n) && n > max) max = n;
        }
        uidCounter = max + 1;
      },
    },
  ),
);
