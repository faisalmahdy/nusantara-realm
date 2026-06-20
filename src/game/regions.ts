// Regions (a.k.a. "Horizon 2" on the roadmap): the island the player is on.
// Each region is its own island dressing — ground, scenery, a wild roster and a
// Guardian — reachable by sailing from a shore dock. Pure data; no imports back
// into the game so it can't create cycles (scenery/spawns/store import this).

export interface RegionScenery {
  seed: number;
  count?: number;
  banyanWeight?: number; // share of banyan trees (0..1)
  palmWeight?: number; // share of palms; the rest are low ferns
}

export interface Region {
  id: string;
  name: string;
  blurb: string; // flavor shown on arrival
  ground: string; // grass texture url
  hasPath: boolean; // the village path strip (home isle only)
  scenery: RegionScenery;
  speciesIds: string[]; // wild roster (the Guardian is separate)
  guardian: { speciesId: string; level: number }; // level = battle difficulty floor + model stage
  unlockedBy: string | null; // region whose Guardian must fall before you can sail here
  dock: { x: number; z: number }; // shore jetty; the harbor menu lists every other region
  arrival: { x: number; z: number }; // where you land when sailing in (just clear of the dock)
  groundTint?: string; // multiplied over the ground texture for biome mood
  sceneryTint?: string; // multiplied over scenery billboards (e.g. charred trees)
  skyHaze?: { color: string; amount: number }; // blends the sky/fog toward a mood color
}

export const REGIONS: Region[] = [
  {
    id: 'saujana',
    name: 'Saujana Isle',
    blurb: 'Your home island — the camp, the old path, and the storm-naga Guardian to the north.',
    ground: '/world/grass-base.png',
    hasPath: true,
    scenery: { seed: 1337 },
    speciesIds: ['matong', 'kancil', 'dugang', 'camar', 'gambang', 'bamut', 'ayaka', 'babur', 'kepiting', 'naris', 'watua', 'rabuas'],
    guardian: { speciesId: 'naris', level: 16 },
    unlockedBy: null,
    dock: { x: 0, z: 40 },
    arrival: { x: 0, z: 34 },
  },
  {
    id: 'beringin',
    name: 'Beringin Reach',
    blurb: 'A reef-and-grove frontier across the strait, warded by the ancient Banyan-titan.',
    ground: '/world/grass-alt.png',
    hasPath: false,
    scenery: { seed: 4242, count: 64, banyanWeight: 0.58, palmWeight: 0.16 }, // a sparser sacred grove
    speciesIds: ['karang', 'penyu', 'ubur', 'warking'],
    guardian: { speciesId: 'banyan', level: 22 }, // tougher floor than the home isle
    unlockedBy: 'saujana',
    dock: { x: 0, z: 40 },
    arrival: { x: 0, z: 34 },
  },
  {
    id: 'cinder',
    name: 'Cinder Peak',
    blurb: 'A smouldering volcano isle where the old creatures range remade in ember and ash.',
    ground: '/world/grass-base.png',
    hasPath: false,
    scenery: { seed: 9001, count: 42, banyanWeight: 0.5, palmWeight: 0.22 }, // sparse, charred stands
    speciesIds: ['barabamut', 'baraayaka', 'baracamar', 'bararabuas'],
    guardian: { speciesId: 'barawatua', level: 28 }, // the toughest floor — endgame
    unlockedBy: 'beringin',
    dock: { x: 0, z: 40 },
    arrival: { x: 0, z: 34 },
    groundTint: '#b5764a', // ashen, warm volcanic ground (legible, not black)
    sceneryTint: '#8a5e42', // charred trees
    skyHaze: { color: '#c4663a', amount: 0.42 }, // volcanic haze over the sky
  },
];

export const HOME_REGION = REGIONS[0].id;

export function regionById(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
