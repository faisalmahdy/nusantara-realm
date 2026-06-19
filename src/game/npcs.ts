// Static villagers at the starting camp. They don't fight or get tamed — talk to
// them (press E) for guidance and Nusantara worldbuilding. Reuse the player
// sprite, tinted, since there's no dedicated villager art yet.
export interface Npc {
  id: string;
  name: string;
  x: number;
  z: number;
  tint: string; // multiplies the sprite — gives each villager a distinct hue
  lines: string[];
}

export const NPCS: Npc[] = [
  {
    id: 'elder', name: 'Elder Sari', x: -5, z: 5, tint: '#bfe6a6',
    lines: [
      'Welcome to the camp, young Pawang. In Nusantara the beasts are not caught — they are won over.',
      'Bond with your companions: feed and rest them here. A bonded monster fights with its whole heart.',
    ],
  },
  {
    id: 'fisher', name: 'Fisher Bayu', x: 5, z: 5, tint: '#a6cce6',
    lines: [
      'The storm-gull Camar rides the monsoon in from the sea. Keep a treat ready — wild ones spook easily.',
      'Out of treats? Win a battle. The wilds respawn, so the hunt never truly ends.',
    ],
  },
  {
    id: 'warden', name: 'Warden Intan', x: 0, z: 2, tint: '#e6cda6',
    lines: [
      'To the north the Guardian, Naris of the storm, keeps the old balance. Do not face it unprepared.',
      'Raise a varied team and switch monsters mid-battle — the element pentagon favors the ready.',
    ],
  },
];

export function npcById(id: string): Npc | undefined {
  return NPCS.find((n) => n.id === id);
}
