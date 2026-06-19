export interface MonsterSpecies {
  id: string;
  name: string;
  element: 'Forest' | 'Sea' | 'Sky' | 'Earth' | 'Spirit';
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  rarity: 1 | 2 | 3; // higher = harder to tame
  blurb: string;
  // Folklore-flavored entry shown in the Field Guide once a species is tamed.
  // Inspired by (not authoritative on) Nusantara myth and the creatures' motifs.
  lore: string;
}

// Roster drawn from the Nusantara Monster project. Stats are tuned here for the
// 3D game's taming + battle loop rather than copied from the 2D game.
export const SPECIES: MonsterSpecies[] = [
  { id: 'matong', name: 'Matong', element: 'Forest', baseHp: 34, baseAtk: 11, baseDef: 8, rarity: 1, blurb: 'A sturdy forest guardian with bark-like hide.', lore: "A striped guardian said to pad the forest's edge at dusk, keeping the line between village and wild. Its bark-like hide turns aside both claw and careless axe." },
  { id: 'kancil', name: 'Kancil', element: 'Forest', baseHp: 26, baseAtk: 13, baseDef: 6, rarity: 1, blurb: 'Quick and clever — never where you expect it.', lore: 'The cunning mouse-deer of a thousand tales, who outwits tiger and crocodile alike. Folk say taming one is less about speed than being clever enough to let it trick you on purpose.' },
  { id: 'dugang', name: 'Dugang', element: 'Sea', baseHp: 40, baseAtk: 9, baseDef: 11, rarity: 2, blurb: 'A gentle reef-dweller, slow but immovable.', lore: 'A gentle dugong-spirit of the seagrass shallows, mistaken by old sailors for a mermaid. It hums the tide to sleep and is said to carry lost things back to shore.' },
  { id: 'camar', name: 'Camar', element: 'Sky', baseHp: 24, baseAtk: 14, baseDef: 5, rarity: 1, blurb: 'A coastal flyer that strikes from above.', lore: 'A storm-gull that rides the squall-line ahead of the monsoon. Fishermen read its cry as a sign to turn the prau homeward before the wind turns.' },
  { id: 'gambang', name: 'Gambang', element: 'Spirit', baseHp: 30, baseAtk: 12, baseDef: 9, rarity: 2, blurb: 'Resonant spirit-beast that hums in old keys.', lore: "Named for the gamelan's wooden keys, this flower-spirit answers music with music. Strike the right note at dusk and it will follow you home." },
  { id: 'bamut', name: 'Bamut', element: 'Earth', baseHp: 44, baseAtk: 10, baseDef: 13, rarity: 2, blurb: 'A boulder given temper and a heavy tread.', lore: 'A moss-backed boar grown slow and stony in the deep earth. Where it beds down for the night, mushrooms and ferns spring up by morning.' },
  { id: 'ayaka', name: 'Ayaka', element: 'Spirit', baseHp: 28, baseAtk: 15, baseDef: 7, rarity: 3, blurb: 'A rare dancing spirit, hard to win over.', lore: 'A dancing flame-spirit glimpsed around the harvest fires. Its dance is said to coax the dry season into the wet — and gently back again.' },
  { id: 'babur', name: 'Babur', element: 'Earth', baseHp: 38, baseAtk: 12, baseDef: 10, rarity: 2, blurb: 'Tusked and territorial, but loyal once tamed.', lore: 'A cloud-piglet that drifts down from the highlands on monsoon winds. Gruff at the first meeting, fiercely loyal once it decides to trust you.' },
  { id: 'kepiting', name: 'Kepiting', element: 'Sea', baseHp: 32, baseAtk: 11, baseDef: 14, rarity: 2, blurb: 'Armoured pincers that crack stone.', lore: 'An armoured reef-crab whose shell is crusted with coral and old barnacle-luck. Its claws crack stone as easily as a clam.' },
  { id: 'naris', name: 'Naris', element: 'Sky', baseHp: 27, baseAtk: 16, baseDef: 6, rarity: 3, blurb: 'A storm-touched flyer few have tamed.', lore: 'A storm-touched naga coiled in the river-mist. The elders pour the first of the rice harvest at the water’s edge so its coils stay calm.' },
  { id: 'watua', name: 'Watua', element: 'Earth', baseHp: 36, baseAtk: 10, baseDef: 12, rarity: 1, blurb: 'A patient stone-spirit of the highlands.', lore: 'A root-and-bark spirit of the high stones, older than the village paths. It stirs perhaps once a generation, and remembers everyone who ever passed.' },
  { id: 'rabuas', name: 'Rabuas', element: 'Forest', baseHp: 33, baseAtk: 13, baseDef: 9, rarity: 2, blurb: 'Brambled and fierce in the deep wood.', lore: 'A corpse-flower beast of the deep wood, crowned with a great red bloom. You smell it long before you see it — and by then it has already seen you.' },
];

export const ELEMENT_COLOR: Record<MonsterSpecies['element'], string> = {
  Forest: '#6ab04c',
  Sea: '#3aa6d6',
  Sky: '#9bb7e8',
  Earth: '#c08a3e',
  Spirit: '#b06ad6',
};

// A distinct glyph per element so they're told apart by shape, not color alone
// (colorblind-safe). Shown alongside the element name throughout the UI.
export const ELEMENT_ICON: Record<MonsterSpecies['element'], string> = {
  Forest: '🌿',
  Sea: '🌊',
  Sky: '⚡',
  Earth: '⛰️',
  Spirit: '✨',
};

export function speciesById(id: string): MonsterSpecies {
  const s = SPECIES.find((x) => x.id === id);
  if (!s) throw new Error(`unknown species ${id}`);
  return s;
}

// Which species the player has discovered (tamed at least once): any species in
// the party, plus the species of any wild that was tamed away (wildId form
// `wild-<speciesId>-<n>`). Drives Field Guide unlocks.
export function discoveredSpeciesIds(partySpeciesIds: string[], tamedWildIds: string[]): Set<string> {
  const out = new Set<string>(partySpeciesIds);
  for (const wid of tamedWildIds) {
    const sid = wid.split('-')[1];
    if (sid) out.add(sid);
  }
  return out;
}
