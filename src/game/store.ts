import { create } from 'zustand';
import { speciesById } from './monsters';

export interface TamedMonster {
  uid: string;
  speciesId: string;
  nickname: string;
  level: number;
  xp: number;
  bond: number; // 0..100, raised at the ranch
}

export type GameMode = 'explore' | 'taming' | 'party';

interface GameState {
  mode: GameMode;
  party: TamedMonster[];
  // wild ids that have been tamed and removed from the world
  tamedWildIds: string[];
  // id of the wild monster currently in range of the player, if any
  nearbyWildId: string | null;
  // wild monster the taming overlay is focused on
  tamingTargetId: string | null;
  message: string | null;

  setMode: (m: GameMode) => void;
  setNearby: (id: string | null) => void;
  beginTaming: (wildId: string) => void;
  cancelTaming: () => void;
  tame: (speciesId: string, wildId: string) => boolean;
  flash: (msg: string) => void;
}

let uidCounter = 1;

export const useGame = create<GameState>((set, get) => ({
  mode: 'explore',
  party: [],
  tamedWildIds: [],
  nearbyWildId: null,
  tamingTargetId: null,
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

  flash: (msg) => set({ message: msg }),
}));
