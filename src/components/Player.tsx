import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../game/useKeyboard';
import { playerPos, cameraState, touchInput, applyDaylight } from '../game/shared';
import { WORLD, COLLIDERS } from '../game/scenery';
import { useGame } from '../game/store';
import { loadPixelTexture } from './Sprite3D';
import { sfx } from '../game/audio';

const SPEED = 10;
const PLAYER_R = 0.55;
const PLAYER_HEIGHT = 2.6;
const PLAYER_ASPECT = 68 / 192; // source frame is 68×192

// HD-2D player: a directional walk-frame billboard.
const P = '/sprites/player';
const FRONT_IDLE = `${P}/front_idle.png`;
const FRONT_WALK = [0, 1, 2, 3].map((i) => `${P}/front_walk_${i}.png`);
const BACK_WALK = [0, 1, 2, 3].map((i) => `${P}/back_walk_${i}.png`);
const PLAYER_FRAMES = [FRONT_IDLE, `${P}/back_idle.png`, ...FRONT_WALK, ...BACK_WALK];

export function Player() {
  const keys = useKeyboard();
  const group = useRef<THREE.Group>(null);
  const tamePressed = useRef(false);
  const stepT = useRef(0);

  // Preload every player frame once (cached), then swap the sprite's texture
  // each frame by walk direction — no React re-renders.
  const frames = useMemo(() => {
    const m = new Map<string, THREE.Texture>();
    for (const u of PLAYER_FRAMES) m.set(u, loadPixelTexture(u));
    return m;
  }, []);
  const spriteRef = useRef<THREE.Sprite>(null);
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const curUrl = useRef('');

  useFrame((state, dtRaw) => {
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
      // Keep the player on the round island.
      const maxR = WORLD / 2 - 2;
      const pr = Math.hypot(playerPos.x, playerPos.z);
      if (pr > maxR) { playerPos.x *= maxR / pr; playerPos.z *= maxR / pr; }
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
      stepT.current += dt;
      if (stepT.current >= 0.34) { stepT.current = 0; sfx.step(); }
    } else {
      stepT.current = 0.34; // first step lands promptly when you start walking
    }
    g.position.set(playerPos.x, 0, playerPos.z);

    // Pick the frame: walking away from the camera shows the back, toward it the
    // front; idle faces the camera. (forward points into the screen.)
    const mat = matRef.current;
    const spr = spriteRef.current;
    if (mat && spr) {
      let url = FRONT_IDLE;
      if (moving) {
        const away = move.dot(forward) > 0;
        const f = Math.floor(state.clock.elapsedTime * 8) % 4;
        url = away ? BACK_WALK[f] : FRONT_WALK[f];
      }
      if (url !== curUrl.current) {
        const tex = frames.get(url);
        if (tex) {
          mat.map = tex;
          mat.needsUpdate = true;
          const img = tex.image as HTMLImageElement | undefined;
          const a = img && img.width ? img.width / img.height : PLAYER_ASPECT;
          spr.scale.set(PLAYER_HEIGHT * a, PLAYER_HEIGHT, 1);
          curUrl.current = url;
        }
      }
    }

    if (mat) applyDaylight(mat); // darken with the day/night cycle

    // Press E to start taming the nearby wild.
    const store = useGame.getState();
    if (k.tame && !tamePressed.current) {
      tamePressed.current = true;
      if (store.mode === 'explore') {
        if (store.nearbyWildId) store.beginTaming(store.nearbyWildId);
        else if (store.nearbyNpcId) store.talkToNpc(store.nearbyNpcId);
      }
    } else if (!k.tame) {
      tamePressed.current = false;
    }
  });

  return (
    <group ref={group} position={[0, 0, 8]}>
      <sprite ref={spriteRef} center={[0.5, 0] as any} scale={[PLAYER_HEIGHT * PLAYER_ASPECT, PLAYER_HEIGHT, 1]}>
        <spriteMaterial ref={matRef} map={frames.get(FRONT_IDLE)} transparent alphaTest={0.5} depthWrite />
      </sprite>
    </group>
  );
}
