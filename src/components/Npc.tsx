import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { playerPos } from '../game/shared';
import { useGame } from '../game/store';
import { Npc as NpcData } from '../game/npcs';

const TALK_RANGE = 4.5;

// A camp villager: a tinted player-sprite billboard with a floating interact
// marker. Sets `nearbyNpcId` when the player is close (and not next to a wild,
// so taming keeps priority); the player's E / touch button opens the dialogue.
export function Npc({ npc }: { npc: NpcData }) {
  const group = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const reduced = useGame.getState().reducedMotion;
    g.position.y = reduced ? 0 : Math.sin(t * 1.6 + npc.x) * 0.05; // gentle idle bob
    if (marker.current) marker.current.position.y = 2.9 + (reduced ? 0 : Math.sin(t * 3) * 0.12);

    const dist = Math.hypot(npc.x - playerPos.x, npc.z - playerPos.z);
    const store = useGame.getState();
    if (dist < TALK_RANGE && store.mode === 'explore' && !store.nearbyWildId) {
      if (store.nearbyNpcId !== npc.id) store.setNearbyNpc(npc.id);
    } else if (store.nearbyNpcId === npc.id) {
      store.setNearbyNpc(null);
    }
  });

  return (
    <group ref={group} position={[npc.x, 0, npc.z]}>
      <Sprite3D url="/sprites/player/front_idle.png" height={2.5} color={npc.tint} />
      <mesh ref={marker} position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color="#7ad7ff" />
      </mesh>
    </group>
  );
}
