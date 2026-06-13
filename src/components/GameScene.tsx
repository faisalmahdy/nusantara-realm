import { useMemo } from 'react';
import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { WildMonster } from './WildMonster';
import { CameraRig } from './CameraRig';
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
      <color attach="background" args={['#8fb6d6']} />
      <fog attach="fog" args={['#8fb6d6', 42, 92]} />
      <hemisphereLight args={[new THREE.Color('#cfe3ff'), new THREE.Color('#4a6038'), 0.95]} />
      <directionalLight position={[20, 40, 12]} intensity={1.15} color={'#fff2d0'} />

      <World />
      <Player />
      {spawns.map((s) => (
        <WildMonster key={s.wildId} spawn={s} />
      ))}
      <CameraRig />
    </>
  );
}
