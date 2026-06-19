import { Suspense, lazy, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { hasModel } from '../models/registry';
import { playerPos, WildSpawn } from '../game/shared';
import { useGame } from '../game/store';
import { speciesById, ELEMENT_COLOR } from '../game/monsters';
import { ART_MODE } from '../game/config';

// The from-scratch 3D monster meshes (ART_MODE === '3d') are code-split into
// their own chunk via this lazy import — never fetched in the default HD-2D build.
const MonsterModel = lazy(() => import('./MonsterModel').then((m) => ({ default: m.MonsterModel })));

const TAME_RANGE = 4.5;

export function WildMonster({ spawn }: { spawn: WildSpawn }) {
  const group = useRef<THREE.Group>(null);
  const species = speciesById(spawn.speciesId);
  const tamingTargetId = useGame((s) => s.tamingTargetId);
  const tamed = useGame((s) => s.tamedWildIds.includes(spawn.wildId));

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    const store = useGame.getState();
    // Read live tamed state to avoid a one-frame race where a just-tamed
    // monster re-flags itself as nearby before React unmounts it.
    if (store.tamedWildIds.includes(spawn.wildId)) {
      if (store.nearbyWildId === spawn.wildId) store.setNearby(null);
      return;
    }
    const dx = spawn.x - playerPos.x;
    const dz = spawn.z - playerPos.z;
    const dist = Math.hypot(dx, dz);

    // Idle bob — a touch livelier when the player is close.
    g.position.y = Math.abs(Math.sin(t * 2 + spawn.phase)) * (dist < TAME_RANGE ? 0.16 : 0.09);

    // Turn to face the player when they come within noticing range. Harmless
    // for billboards (Sprites always face the camera); the flat element ring is
    // rotationally symmetric, so spinning the group keeps it flat on the ground.
    if (dist < 20) {
      const desired = Math.atan2(playerPos.x - spawn.x, playerPos.z - spawn.z);
      let d = desired - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest-path angle
      g.rotation.y += d * Math.min(1, delta * 5);
    }

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
  const guardian = !!spawn.guardian;
  // Guardians loom larger and stand in a bold gold double-ring.
  const spriteH = guardian ? 4.2 : 2.7;
  const ringColor = guardian ? '#f4d97b' : ELEMENT_COLOR[species.element];

  return (
    <group ref={group} position={[spawn.x, 0, spawn.z]}>
      {ART_MODE === 'hd2d' ? (
        // HD-2D: the 2D pixel-art sprite as a camera-facing billboard. (No
        // per-stage sprites exist, so evolved forms reuse the base idle art.)
        <Sprite3D url={`/sprites/${spawn.speciesId}/idle.png`} height={spriteH} />
      ) : hasModel(spawn.speciesId) ? (
        <Suspense fallback={null}>
          <MonsterModel speciesId={spawn.speciesId} height={guardian ? 3.6 : 2.4} />
        </Suspense>
      ) : (
        <Sprite3D url={`/sprites/${spawn.speciesId}/idle.png`} height={spriteH} />
      )}
      {/* element ring on the ground (gold + larger for Guardians) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={guardian ? [1.7, 2.1, 32] : [1.0, 1.25, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={beingTamed ? 0.95 : guardian ? 0.6 : 0.35} />
      </mesh>
      {guardian && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[2.3, 2.6, 32]} />
          <meshBasicMaterial color="#fff0c0" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}
