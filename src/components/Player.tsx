import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { loadPixelTexture } from './Sprite3D';
import { useKeyboard } from '../game/useKeyboard';
import { playerPos, cameraState } from '../game/shared';
import { WORLD, COLLIDERS } from '../game/scenery';
import { useGame } from '../game/store';

const SPEED = 10;
const PLAYER_R = 0.55;

export function Player() {
  const keys = useKeyboard();
  const sprite = useRef<THREE.Sprite>(null);
  const walkT = useRef(0);
  const movingAway = useRef(false);
  const tamePressed = useRef(false);

  const frames = useMemo(() => ({
    frontIdle: loadPixelTexture('/sprites/player/front_idle.png'),
    backIdle: loadPixelTexture('/sprites/player/back_idle.png'),
    front: [0, 1, 2, 3].map((i) => loadPixelTexture(`/sprites/player/front_walk_${i}.png`)),
    back: [0, 1, 2, 3].map((i) => loadPixelTexture(`/sprites/player/back_walk_${i}.png`)),
  }), []);

  useFrame((_, dtRaw) => {
    const s = sprite.current;
    if (!s) return;
    const dt = Math.min(dtRaw, 0.05);
    const orbit = cameraState.orbit;

    const forward = new THREE.Vector3(Math.sin(orbit), 0, Math.cos(orbit));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const move = new THREE.Vector3();
    const k = keys.current;
    if (k.forward) move.add(forward);
    if (k.back) move.sub(forward);
    if (k.right) move.add(right);
    if (k.left) move.sub(right);

    const moving = move.lengthSq() > 0;
    if (moving) {
      move.normalize();
      playerPos.addScaledVector(move, dt * SPEED);
      playerPos.x = THREE.MathUtils.clamp(playerPos.x, -WORLD / 2 + 2, WORLD / 2 - 2);
      playerPos.z = THREE.MathUtils.clamp(playerPos.z, -WORLD / 2 + 2, WORLD / 2 - 2);
      // Push out of tree trunks so you can't walk through them.
      for (const c of COLLIDERS) {
        const dx = playerPos.x - c.x;
        const dz = playerPos.z - c.z;
        const minD = c.r + PLAYER_R;
        const d2 = dx * dx + dz * dz;
        if (d2 < minD * minD && d2 > 1e-6) {
          const push = (minD - Math.sqrt(d2)) / Math.sqrt(d2);
          playerPos.x += dx * push;
          playerPos.z += dz * push;
        }
      }
      movingAway.current = move.dot(forward) > 0;
      walkT.current += dt * 8;
    }
    s.position.set(playerPos.x, 0, playerPos.z);

    const mat = s.material as THREE.SpriteMaterial;
    const set = movingAway.current ? frames.back : frames.front;
    mat.map = moving ? set[Math.floor(walkT.current) % 4] : (movingAway.current ? frames.backIdle : frames.frontIdle);
    mat.needsUpdate = true;

    // Press E to start taming the nearby wild.
    const store = useGame.getState();
    if (k.tame && !tamePressed.current) {
      tamePressed.current = true;
      if (store.mode === 'explore' && store.nearbyWildId) store.beginTaming(store.nearbyWildId);
    } else if (!k.tame) {
      tamePressed.current = false;
    }
  });

  return (
    <sprite ref={sprite} position={[0, 0, 8]} scale={[2.3, 2.5, 1]} center={[0.5, 0] as any} renderOrder={1}>
      <spriteMaterial map={frames.frontIdle} transparent alphaTest={0.5} depthWrite />
    </sprite>
  );
}
