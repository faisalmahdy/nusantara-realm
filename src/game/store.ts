import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { speciesById } from './monsters';
import {
  Combatant, makeCombatant, computeDamage, effectivenessNote, tameChance,
  xpForDefeating, applyXp, enemyCounter, bondAtkMult, maxHpFor, evolutionStage,
} from './battle';
import { sfx } from './audio';

// A stage-up line if the level gain crossed an evolution boundary, else null.
function evolutionNote(name: string, oldLevel: number, newLevel: number): string | null {
  const to = evolutionStage(newLevel);
  if (to > evolutionStage(oldLevel)) return `${name} evolved into its Stage ${to} form!`;
  return null;
}

// Play the louder evolution flourish when a level-up crossed a stage boundary,
// otherwise the plain level-up sting.
function progressSfx(leveled: boolean, evolved: boolean) {
  if (evolved) sfx.evolve();
  else if (leveled) sfx.levelUp();
}

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
  party: Combatant[]; // your whole team, as combatants (snapshot for this fight)
  active: number; // index of the fighter currently out
  player: Combatant; // === party[active]; kept in sync for convenient reads
  enemy: Combatant;
  log: string[];
  turn: 'player' | 'over';
  outcome: 'won' | 'lost' | 'tamed' | 'fled' | null;
  mustSwitch: boolean; // active fainted but others remain — must pick a replacement
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
  // nearby/in-conversation villager (camp NPCs)
  nearbyNpcId: string | null;
  dialogueNpcId: string | null;
  // active turn-based battle, if any
  battle: BattleState | null;
  message: string | null;
  // treats: the currency. Spent to tame and to feed; earned by winning battles.
  treats: number;
  // whether the island Guardian has been bested (one-time reward milestone)
  guardianDefeated: boolean;
  // accessibility: damp repetitive idle/ambient motion
  reducedMotion: boolean;

  setMode: (m: GameMode) => void;
  setNearby: (id: string | null) => void;
  setNearbyNpc: (id: string | null) => void;
  talkToNpc: (id: string) => void;
  closeDialogue: () => void;
  beginTaming: (wildId: string) => void;
  cancelTaming: () => void;
  tame: (speciesId: string, wildId: string) => boolean;
  beginBattle: (wildId: string) => void;
  battleMove: (moveIndex: number) => void;
  battleSwitch: (idx: number) => void;
  battleTame: () => boolean;
  battleFlee: () => void;
  endBattle: () => void;
  feed: (uid: string) => void;
  rest: (uid: string) => void;
  flash: (msg: string) => void;
  setReducedMotion: (v: boolean) => void;
  resetGame: () => void;
}

// Economy tuning. You start with enough treats to tame your first few monsters
// even before you can battle; wins replenish the supply, so you can never get
// soft-locked (resting is always free).
const START_TREATS = 5;
const TREAT_WIN_REWARD = 3;
const GUARDIAN_REWARD = 15; // one-time bounty for besting the island Guardian

let uidCounter = 1;

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
  mode: 'explore',
  party: [],
  tamedWildIds: [],
  nearbyWildId: null,
  tamingTargetId: null,
  nearbyNpcId: null,
  dialogueNpcId: null,
  battle: null,
  message: null,
  treats: START_TREATS,
  guardianDefeated: false,
  reducedMotion: false,

  setMode: (m) => set({ mode: m }),
  setNearby: (id) => set({ nearbyWildId: id }),
  setNearbyNpc: (id) => set({ nearbyNpcId: id }),
  talkToNpc: (id) => { sfx.uiClick(); set({ dialogueNpcId: id }); },
  closeDialogue: () => set({ dialogueNpcId: null }),

  beginTaming: (wildId) => set({ mode: 'taming', tamingTargetId: wildId }),
  cancelTaming: () => set({ mode: 'explore', tamingTargetId: null }),

  tame: (speciesId, wildId) => {
    if (get().treats < 1) {
      set({ mode: 'explore', tamingTargetId: null, message: 'Out of treats — win a battle to earn more.' });
      sfx.tameFail();
      return false;
    }
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
        treats: s.treats - 1,
        mode: 'explore',
        tamingTargetId: null,
        nearbyWildId: null,
        message: `${species.name} was tamed!`,
      }));
      sfx.tameSuccess();
    } else {
      set({ mode: 'explore', tamingTargetId: null, message: `${species.name} broke free!` });
      sfx.tameFail();
    }
    return success;
  },

  // --- Battle (roadmap #1): weaken a wild monster, then tame it. ---------
  beginBattle: (wildId) => {
    const team = get().party;
    if (team.length === 0) {
      // No party monster to fight with — fall back to direct taming.
      get().beginTaming(wildId);
      return;
    }
    const firstAlive = team.findIndex((m) => m.hp > 0);
    if (firstAlive === -1) {
      set({ message: 'Your whole party is worn out — rest someone first.' });
      return;
    }
    // Snapshot the whole team as combatants, carrying forward battle wear + bond.
    const combatants = team.map((m) => {
      const c = makeCombatant(m.uid, m.speciesId, m.level);
      c.bond = m.bond;
      c.hp = Math.min(c.maxHp, m.hp);
      return c;
    });
    const active = firstAlive;
    const player = combatants[active];
    const isGuardian = wildId.startsWith('guardian');
    const enemySpeciesId = wildId.split('-')[1];
    // A Guardian is a real boss — well above your lead — so it takes a built-up,
    // type-savvy team (and switching) to win.
    const enemyLevel = isGuardian ? Math.max(player.level + 4, 16) : Math.max(2, player.level + 1);
    const enemy = makeCombatant(wildId, enemySpeciesId, enemyLevel);
    const log = [isGuardian
      ? `The Guardian ${enemy.name} (Lv ${enemy.level}) rises to test you!`
      : `A wild ${enemy.name} (Lv ${enemy.level}) blocks your path!`];
    if (player.bond >= 50) log.push(`${player.name}'s bond spurs it on. (+${Math.round((bondAtkMult(player.bond) - 1) * 100)}% damage)`);
    sfx.battleStart();
    set({
      mode: 'battle',
      tamingTargetId: null,
      battle: { wildId, party: combatants, active, player, enemy, turn: 'player', outcome: null, log, mustSwitch: false },
    });
  },

  battleMove: (moveIndex) => {
    const b = get().battle;
    if (!b || b.turn !== 'player' || b.mustSwitch) return;
    const active = b.party[b.active];
    const enemy = { ...b.enemy };
    const log = [...b.log];

    const move = active.moves[moveIndex] ?? active.moves[0];
    const hit = computeDamage(active, enemy, move);
    enemy.hp = Math.max(0, enemy.hp - hit.damage);
    log.push(`${active.name} used ${move.name} for ${hit.damage}.${effectivenessNote(hit.eff)}`);

    if (enemy.hp <= 0) {
      // Win — the active fighter earns the XP + treats.
      log.push(`The wild ${enemy.name} fainted and fled.`);
      const real = get().party.find((m) => m.uid === active.uid)!;
      const gain = xpForDefeating(enemy.level);
      const res = applyXp(real.level, real.xp, gain);
      log.push(`${real.nickname} gained ${gain} XP.`);
      if (res.levelsGained > 0) log.push(`${real.nickname} grew to Lv ${res.level}!`);
      const evo = evolutionNote(real.nickname, real.level, res.level);
      if (evo) log.push(evo);
      log.push(`You gathered ${TREAT_WIN_REWARD} treats.`);
      const firstGuardian = b.wildId.startsWith('guardian') && !get().guardianDefeated;
      if (firstGuardian) log.push(`You bested the Guardian! +${GUARDIAN_REWARD} treats.`);
      progressSfx(res.levelsGained > 0, !!evo);
      if (firstGuardian) sfx.evolve();
      set((st) => ({
        party: st.party.map((m) => (m.uid === active.uid ? { ...m, level: res.level, xp: res.xp } : m)),
        treats: st.treats + TREAT_WIN_REWARD + (firstGuardian ? GUARDIAN_REWARD : 0),
        guardianDefeated: st.guardianDefeated || b.wildId.startsWith('guardian'),
        battle: { ...b, player: active, enemy, log, turn: 'over', outcome: 'won' },
      }));
      return;
    }

    // Enemy counters the active fighter; may force a switch or end the fight.
    const r = enemyCounter(b.party, b.active, enemy, log);
    set({ battle: { ...b, party: r.party, player: r.party[b.active], enemy, log, turn: r.turn, outcome: r.outcome, mustSwitch: r.mustSwitch } });
  },

  // Switch the active fighter. A voluntary switch costs your turn (the enemy hits
  // the incoming monster); a forced switch after a faint does not.
  battleSwitch: (idx) => {
    const b = get().battle;
    if (!b || b.turn !== 'player') return;
    if (idx === b.active || idx < 0 || idx >= b.party.length || b.party[idx].hp <= 0) return;
    sfx.uiClick();
    const log = [...b.log, `Go, ${b.party[idx].name}!`];
    if (b.mustSwitch) {
      set({ battle: { ...b, active: idx, player: b.party[idx], log, mustSwitch: false, turn: 'player' } });
      return;
    }
    const r = enemyCounter(b.party, idx, { ...b.enemy }, log);
    set({ battle: { ...b, active: idx, party: r.party, player: r.party[idx], log, turn: r.turn, outcome: r.outcome, mustSwitch: r.mustSwitch } });
  },

  battleTame: () => {
    const b = get().battle;
    if (!b || b.turn !== 'player' || b.mustSwitch) return false;
    if (get().treats < 1) {
      set({ battle: { ...b, log: [...b.log, 'You have no treats left to offer.'] } });
      return false;
    }
    const species = speciesById(b.enemy.speciesId);
    const chance = tameChance(b.enemy, species.rarity, get().party.length);
    const success = Math.random() < chance;
    const active = b.party[b.active];
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
      const real = get().party.find((m) => m.uid === active.uid)!;
      const gain = xpForDefeating(b.enemy.level);
      const res = applyXp(real.level, real.xp, gain);
      log.push(`${species.name} was tamed!`);
      log.push(`${real.nickname} gained ${gain} XP.`);
      if (res.levelsGained > 0) log.push(`${real.nickname} grew to Lv ${res.level}!`);
      const evo = evolutionNote(real.nickname, real.level, res.level);
      if (evo) log.push(evo);
      const firstGuardian = b.wildId.startsWith('guardian') && !get().guardianDefeated;
      if (firstGuardian) log.push(`You won over the Guardian! +${GUARDIAN_REWARD} treats.`);
      sfx.tameSuccess();
      if (evo || firstGuardian) sfx.evolve();
      set((s) => ({
        party: [...s.party.map((m) => (m.uid === active.uid ? { ...m, level: res.level, xp: res.xp } : m)), mon],
        tamedWildIds: [...s.tamedWildIds, b.wildId],
        treats: s.treats - 1 + (firstGuardian ? GUARDIAN_REWARD : 0),
        guardianDefeated: s.guardianDefeated || b.wildId.startsWith('guardian'),
        nearbyWildId: null,
        battle: { ...b, log, turn: 'over', outcome: 'tamed' },
      }));
      return true;
    }

    // Failed — the enemy gets a free counter against the active fighter.
    log.push(`${species.name} broke free!`);
    sfx.tameFail();
    const r = enemyCounter(b.party, b.active, { ...b.enemy }, log);
    set({ battle: { ...b, party: r.party, player: r.party[b.active], log, turn: r.turn, outcome: r.outcome, mustSwitch: r.mustSwitch } });
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
      : b?.outcome === 'lost' ? 'Your party was defeated…'
      : null;
    // Carry every fighter's remaining HP out of battle so wear persists until rest.
    const party = b
      ? get().party.map((m) => {
          const c = b.party.find((x) => x.uid === m.uid);
          return c ? { ...m, hp: c.hp } : m;
        })
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
    if (get().treats < 1) {
      set({ message: 'No treats to feed with — win a battle.' });
      return;
    }
    const bond = Math.min(100, m.bond + 8);
    const res = applyXp(m.level, m.xp, 5);
    const evo = evolutionNote(m.nickname, m.level, res.level);
    set((s) => ({
      party: s.party.map((x) => (x.uid === uid ? { ...x, bond, level: res.level, xp: res.xp } : x)),
      treats: s.treats - 1,
      message: evo
        ? evo
        : res.levelsGained > 0
        ? `${m.nickname} grew to Lv ${res.level}!`
        : `${m.nickname} enjoyed the treat. (Bond ${bond})`,
    }));
    if (evo) sfx.evolve();
    else if (res.levelsGained > 0) sfx.levelUp();
    else sfx.uiClick();
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
    sfx.uiClick();
  },

  flash: (msg) => set({ message: msg }),

  setReducedMotion: (v) => set({ reducedMotion: v }),

  // Wipe the save (progress + tutorial) and start fresh.
  resetGame: () => {
    try {
      localStorage.removeItem('nusantara-realm-save');
      localStorage.removeItem('nusantara-realm-tutorial');
    } catch { /* ignore */ }
    if (typeof location !== 'undefined') location.reload();
  },
    }),
    {
      name: 'nusantara-realm-save',
      // Only the durable progression survives a reload; transient UI/battle
      // state always starts fresh in 'explore'.
      partialize: (s) => ({ party: s.party, tamedWildIds: s.tamedWildIds, treats: s.treats, guardianDefeated: s.guardianDefeated, reducedMotion: s.reducedMotion }),
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
