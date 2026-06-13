import { useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { playerPos, cameraState } from '../game/shared';

const DIST = 11;
const HEIGHT = 8;

export function CameraRig() {
  const { camera, gl } = useThree();

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    const el = gl.domElement;
    const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; };
    const up = () => { dragging = false; };
    const moveEv = (e: PointerEvent) => {
      if (!dragging) return;
      cameraState.orbit -= (e.clientX - lastX) * 0.005;
      lastX = e.clientX;
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointermove', moveEv);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointermove', moveEv);
    };
  }, [gl]);

  const target = new THREE.Vector3();
  useFrame(() => {
    const o = cameraState.orbit;
    const desired = new THREE.Vector3(
      playerPos.x + Math.sin(o) * -DIST,
      HEIGHT,
      playerPos.z + Math.cos(o) * -DIST,
    );
    camera.position.lerp(desired, 0.12);
    target.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
    camera.lookAt(target);
  });

  return null;
}
