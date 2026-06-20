// Static villagers at the starting camp. They don't fight or get tamed — talk to
// them (press E) for guidance and Nusantara worldbuilding. Reuse the player
// sprite, tinted, since there's no dedicated villager art yet.
export interface Npc {
  id: string;
  name: string;
  x: number;
  z: number;
  region: string; // which region this villager stands in
  tint: string; // multiplies the sprite — gives each villager a distinct hue
  lines: string[];
}

export const NPCS: Npc[] = [
  {
    id: 'elder', name: 'Elder Sari', x: -5, z: 5, region: 'saujana', tint: '#bfe6a6',
    lines: [
      'Welcome to the camp, young Pawang. In Nusantara the beasts are not caught — they are won over.',
      'Bond with your companions: feed and rest them here. A bonded monster fights with its whole heart.',
    ],
  },
  {
    id: 'fisher', name: 'Fisher Bayu', x: 5, z: 5, region: 'saujana', tint: '#a6cce6',
    lines: [
      'The storm-gull Camar rides the monsoon in from the sea. Keep a treat ready — wild ones spook easily.',
      'Out of treats? Win a battle. The wilds respawn, so the hunt never truly ends.',
      'When the Guardian falls, the strait calms — take the jetty south and sail for the Beringin Reach.',
    ],
  },
  {
    id: 'warden', name: 'Warden Intan', x: 0, z: 2, region: 'saujana', tint: '#e6cda6',
    lines: [
      'To the north the Guardian, Naris of the storm, keeps the old balance. Do not face it unprepared.',
      'Naris rides the Sky, and the Sky bows to Earth — lead with a stone-kin beast. Switch when one tires; whoever steps in braces for the blow.',
    ],
  },
  {
    id: 'reefwarden', name: 'Reefwarden Tasik', x: -4, z: 6, region: 'beringin', tint: '#a6e6d6',
    lines: [
      'You crossed the strait — brave. Beringin is older than Saujana, and far less forgiving.',
      'The Beringin-titan wardens the grove to the north. It is of the deep wood, and the deep wood bows only to spirits — bring a spirit-touched companion.',
    ],
  },
];

export function npcById(id: string): Npc | undefined {
  return NPCS.find((n) => n.id === id);
}
