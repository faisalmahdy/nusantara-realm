export interface MonsterSpecies {
  id: string;
  name: string;
  element: 'Forest' | 'Sea' | 'Sky' | 'Earth' | 'Spirit';
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  rarity: 1 | 2 | 3; // higher = harder to tame
  blurb: string;
}

// Roster drawn from the Nusantara Monster project. Stats are tuned here for the
// 3D game's taming + battle loop rather than copied from the 2D game.
export const SPECIES: MonsterSpecies[] = [
  { id: 'matong', name: 'Matong', element: 'Forest', baseHp: 34, baseAtk: 11, baseDef: 8, rarity: 1, blurb: 'A sturdy forest guardian with bark-like hide.' },
  { id: 'kancil', name: 'Kancil', element: 'Forest', baseHp: 26, baseAtk: 13, baseDef: 6, rarity: 1, blurb: 'Quick and clever — never where you expect it.' },
  { id: 'dugang', name: 'Dugang', element: 'Sea', baseHp: 40, baseAtk: 9, baseDef: 11, rarity: 2, blurb: 'A gentle reef-dweller, slow but immovable.' },
  { id: 'camar', name: 'Camar', element: 'Sky', baseHp: 24, baseAtk: 14, baseDef: 5, rarity: 1, blurb: 'A coastal flyer that strikes from above.' },
  { id: 'gambang', name: 'Gambang', element: 'Spirit', baseHp: 30, baseAtk: 12, baseDef: 9, rarity: 2, blurb: 'Resonant spirit-beast that hums in old keys.' },
  { id: 'bamut', name: 'Bamut', element: 'Earth', baseHp: 44, baseAtk: 10, baseDef: 13, rarity: 2, blurb: 'A boulder given temper and a heavy tread.' },
  { id: 'ayaka', name: 'Ayaka', element: 'Spirit', baseHp: 28, baseAtk: 15, baseDef: 7, rarity: 3, blurb: 'A rare dancing spirit, hard to win over.' },
  { id: 'babur', name: 'Babur', element: 'Earth', baseHp: 38, baseAtk: 12, baseDef: 10, rarity: 2, blurb: 'Tusked and territorial, but loyal once tamed.' },
  { id: 'kepiting', name: 'Kepiting', element: 'Sea', baseHp: 32, baseAtk: 11, baseDef: 14, rarity: 2, blurb: 'Armoured pincers that crack stone.' },
  { id: 'naris', name: 'Naris', element: 'Sky', baseHp: 27, baseAtk: 16, baseDef: 6, rarity: 3, blurb: 'A storm-touched flyer few have tamed.' },
  { id: 'watua', name: 'Watua', element: 'Earth', baseHp: 36, baseAtk: 10, baseDef: 12, rarity: 1, blurb: 'A patient stone-spirit of the highlands.' },
  { id: 'rabuas', name: 'Rabuas', element: 'Forest', baseHp: 33, baseAtk: 13, baseDef: 9, rarity: 2, blurb: 'Brambled and fierce in the deep wood.' },
];

export const ELEMENT_COLOR: Record<MonsterSpecies['element'], string> = {
  Forest: '#6ab04c',
  Sea: '#3aa6d6',
  Sky: '#9bb7e8',
  Earth: '#c08a3e',
  Spirit: '#b06ad6',
};

export function speciesById(id: string): MonsterSpecies {
  const s = SPECIES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown species ${id}`);
  return s;
}
