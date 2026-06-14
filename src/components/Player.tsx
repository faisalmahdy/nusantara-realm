import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useKeyboard } from '../game/useKeyboard';
import { playerPos, cameraState, touchInput } from '../game/shared';
import { WORLD, COLLIDERS } from '../game/scenery';
import { useGame } from '../game/store';

const SPEED = 10;
const PLAYER_R = 0.55;
const PLAYER_HEIGHT = 2.6;

// The Meshy-generated player GLB, normalised to a target height, centred on x/z
// and dropped onto y=0. Its native front faces +Z (same convention as the
// monster GLBs), so the parent group's rotation.y points it where it walks.
function PlayerModel() {
  const { scene } = useGLTF('/models/player.glb');
  const object = useMemo(() => {
    const g = scene.clone(true) as THREE.Group;
    const box = new THREE.Box3().setFromObject(g);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = PLAYER_HEIGHT / (size.y || 1);
    g.scale.setScalar(s);
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    return g;
  }, [scene]);
  return <primitive object={object} />;
}

export function Player() {
  const keys = useKeyboard();
  const group = useRef<THREE.Group>(null);
  const facing = useRef(0);
  const tamePressed = useRef(false);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
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
    // On-screen joystick (mobile): up on the stick = forward.
    if (touchInput.x !== 0 || touchInput.y !== 0) {
      move.addScaledVector(right, touchInput.x);
      move.addScaledVector(forward, -touchInput.y);
    }

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
    }
    g.position.set(playerPos.x, 0, playerPos.z);

    // Turn to face the way you walk; when idle, turn to face the camera.
    const desiredYaw = moving
      ? Math.atan2(move.x, move.z)
      : Math.atan2(-forward.x, -forward.z);
    let d = desiredYaw - facing.current;
    d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest-path angle
    facing.current += d * Math.min(1, dt * 10);
    g.rotation.y = facing.current;

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
    <group ref={group} position={[0, 0, 8]}>
      <Suspense fallback={null}>
        <PlayerModel />
      </Suspense>
    </group>
  );
}

useGLTF.preload('/models/player.glb');
