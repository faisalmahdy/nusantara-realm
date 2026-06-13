import { useMemo } from 'react';
import { World } from './World';
import { Player } from './Player';
import { WildMonster } from './WildMonster';
import { CameraRig } from './CameraRig';
import { DayNight } from './DayNight';
import { SPECIES } from '../game/monsters';
import { WildSpawn } from '../game/shared';

export function GameScene() {
  const spawns = useMemo<WildSpawn[]>(() => {
    return SPECIES.map((sp, i) => {
      const angle = (i / SPECIES.length) * Math.PI * 2;
      const r = 13 + (i % 4) * 4;
      return {
        wildId: `wild-${sp.id}-${i}`,
        speciesId: sp.id,
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        phase: i,
      };
    });
  }, []);

  return (
    <>
      <DayNight />

      <World />
      <Player />
      {spawns.map((s) => (
        <WildMonster key={s.wildId} spawn={s} />
      ))}
      <CameraRig />
    </>
  );
}
