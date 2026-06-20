import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WORLD } from '../game/scenery';
import { useGame } from '../game/store';

// Turns the flat grass plane into a Nusantara *island*: a sandy shore ring and
// a gently swelling sea around it. Works with the day/night cycle — the sun
// glints across the water and the distant sea fades into the horizon through the
// existing scene fog (near 42 / far 92), so no skybox is needed.
export function Ocean() {
  const geo = useMemo(() => new THREE.PlaneGeometry(400, 400, 48, 48), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);

  // Gentle crossing swells. Local +z becomes world-up after the -90° X rotation;
  // amplitude is kept well below the shore drop so waves never clip the island.
  useFrame(({ clock }) => {
    if (useGame.getState().reducedMotion) return; // keep a flat, calm sea
    const t = clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      arr[i * 3 + 2] = Math.sin(x * 0.06 + t * 0.8) * 0.18 + Math.cos(y * 0.08 + t * 0.6) * 0.15;
    }
    pos.needsUpdate = true;
  });

  return (
    <group>
      {/* sandy shore ring, just beneath the grass (round, to match the island) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[(WORLD + 16) / 2, 64]} />
        <meshLambertMaterial color="#d8c79a" />
      </mesh>
      {/* sea */}
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#2b6d8c" roughness={0.4} metalness={0} />
      </mesh>
    </group>
  );
}
