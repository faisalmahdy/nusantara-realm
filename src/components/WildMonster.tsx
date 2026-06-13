import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { playerPos, WildSpawn } from '../game/shared';
import { useGame } from '../game/store';
import { speciesById, ELEMENT_COLOR } from '../game/monsters';

const TAME_RANGE = 4.5;

export function WildMonster({ spawn }: { spawn: WildSpawn }) {
  const group = useRef<THREE.Group>(null);
  const species = speciesById(spawn.speciesId);
  const tamingTargetId = useGame((s) => s.tamingTargetId);
  const tamed = useGame((s) => s.tamedWildIds.includes(spawn.wildId));

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Gentle idle bob.
    g.position.y = Math.abs(Math.sin(t * 2 + spawn.phase)) * 0.18;

    const store = useGame.getState();
    // Read live tamed state to avoid a one-frame race where a just-tamed
    // monster re-flags itself as nearby before React unmounts it.
    if (store.tamedWildIds.includes(spawn.wildId)) {
      if (store.nearbyWildId === spawn.wildId) store.setNearby(null);
      return;
    }
    const dx = g.position.x - playerPos.x;
    const dz = g.position.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < TAME_RANGE) {
      if (store.nearbyWildId !== spawn.wildId && store.mode === 'explore') {
        store.setNearby(spawn.wildId);
      }
    } else if (store.nearbyWildId === spawn.wildId) {
      store.setNearby(null);
    }
  });

  // Hide once this wild has been tamed away from the world.
  if (tamed) return null;

  const beingTamed = tamingTargetId === spawn.wildId;

  return (
    <group ref={group} position={[spawn.x, 0, spawn.z]}>
      <Sprite3D url={`/sprites/${spawn.speciesId}/idle.png`} height={2.7} />
      {/* element ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.0, 1.25, 24]} />
        <meshBasicMaterial color={ELEMENT_COLOR[species.element]} transparent opacity={beingTamed ? 0.9 : 0.35} />
      </mesh>
    </group>
  );
}
