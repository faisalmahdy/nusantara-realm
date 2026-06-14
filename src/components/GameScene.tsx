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
        // Spread levels across the roster so base / stage-2 / stage-3 evolution
        // models all appear in the field (evolutionStage: Lv8 → 2, Lv16 → 3).
        level: 1 + i * 2,
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
