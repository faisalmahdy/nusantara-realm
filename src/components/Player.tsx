import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useKeyboard } from '../game/useKeyboard';
import { playerPos, cameraState, touchInput } from '../game/shared';
import { WORLD, COLLIDERS } from '../game/scenery';
import { useGame } from '../game/store';
import { loadPixelTexture } from './Sprite3D';
import { ART_MODE } from '../game/config';

const SPEED = 10;
const PLAYER_R = 0.55;
const PLAYER_HEIGHT = 2.6;

// --- HD-2D player: directional walk-frame billboard ------------------------
const P = '/sprites/player';
const FRONT_IDLE = `${P}/front_idle.png`;
const BACK_IDLE = `${P}/back_idle.png`;
const FRONT_WALK = [0, 1, 2, 3].map((i) => `${P}/front_walk_${i}.png`);
const BACK_WALK = [0, 1, 2, 3].map((i) => `${P}/back_walk_${i}.png`);
const PLAYER_FRAMES = [FRONT_IDLE, BACK_IDLE, ...FRONT_WALK, ...BACK_WALK];

// The Meshy-generated player GLB, normalised to a target height, centred on x/z
// and dropped onto y=0. Its native front faces +Z (same convention as the
// monster GLBs), so the parent group's rotation.y points it where it walks.
// Only used when ART_MODE === '3d'.
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

  // HD-2D billboard: preload every player frame once (cached), then swap the
  // sprite's texture each frame by walk direction — no React re-renders.
  const frames = useMemo(() => {
    const m = new Map<string, THREE.Texture>();
    if (ART_MODE === 'hd2d') for (const u of PLAYER_FRAMES) m.set(u, loadPixelTexture(u));
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

    if (ART_MODE === 'hd2d') {
      // Pick the frame: walking away from the camera shows the back, toward it
      // the front; idle faces the camera. (forward points into the screen.)
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
            const a = img && img.width ? img.width / img.height : 68 / 192;
            spr.scale.set(PLAYER_HEIGHT * a, PLAYER_HEIGHT, 1);
            curUrl.current = url;
          }
        }
      }
    } else {
      // 3D model: turn to face the way you walk; idle faces the camera.
      const desiredYaw = moving ? Math.atan2(move.x, move.z) : Math.atan2(-forward.x, -forward.z);
      let d = desiredYaw - facing.current;
      d = Math.atan2(Math.sin(d), Math.cos(d)); // shortest-path angle
      facing.current += d * Math.min(1, dt * 10);
      g.rotation.y = facing.current;
    }

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
      {ART_MODE === 'hd2d' ? (
        <sprite ref={spriteRef} center={[0.5, 0] as any} scale={[PLAYER_HEIGHT * (68 / 192), PLAYER_HEIGHT, 1]}>
          <spriteMaterial ref={matRef} map={frames.get(FRONT_IDLE)} transparent alphaTest={0.5} depthWrite />
        </sprite>
      ) : (
        <Suspense fallback={null}>
          <PlayerModel />
        </Suspense>
      )}
    </group>
  );
}

if (ART_MODE !== 'hd2d') useGLTF.preload('/models/player.glb');
