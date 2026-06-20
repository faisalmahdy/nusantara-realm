import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { playerPos } from '../game/shared';
import { useGame } from '../game/store';
import { regionById } from '../game/regions';

const DOCK_RANGE = 5.5;
const POSTS: [number, number][] = [[-1.4, 0], [1.4, 0], [-1.4, -3.4], [1.4, -3.4]];

// A shore jetty: walk onto it and press E to sail to the linked region. Wilds /
// NPCs keep interaction priority, so the dock only arms when nothing else is in
// reach. Built from primitives (no boat art) to stay light.
export function Dock() {
  const region = useGame((s) => s.currentRegion);
  const dock = regionById(region).dock;
  const beacon = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beacon.current) beacon.current.position.y = 3.4 + Math.sin(state.clock.elapsedTime * 2.4) * 0.16;
    const dist = Math.hypot(dock.x - playerPos.x, dock.z - playerPos.z);
    const s = useGame.getState();
    const onDock = dist < DOCK_RANGE && s.mode === 'explore' && !s.nearbyWildId && !s.nearbyNpcId;
    if (onDock !== s.nearDock) s.setNearDock(onDock);
  });

  return (
    <group position={[dock.x, 0, dock.z]}>
      {/* planked jetty running out toward the water (+z = seaward) */}
      <mesh position={[0, 0.08, 1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 7]} />
        <meshLambertMaterial color="#8a6a44" />
      </mesh>
      {/* mooring posts */}
      {POSTS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z + 3.4]}>
          <cylinderGeometry args={[0.16, 0.16, 1.4, 8]} />
          <meshLambertMaterial color="#5e4428" />
        </mesh>
      ))}
      {/* a little moored raft at the seaward end */}
      <mesh position={[0, 0.16, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 2.2]} />
        <meshLambertMaterial color="#9a7a4e" />
      </mesh>
      {/* cyan beacon so the jetty reads as interactable from afar */}
      <mesh ref={beacon} position={[0, 3.4, 0]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshBasicMaterial color="#7ad7ff" />
      </mesh>
    </group>
  );
}
