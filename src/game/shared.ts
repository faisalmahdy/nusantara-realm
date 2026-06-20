import * as THREE from 'three';

// Player world position, written by <Player> each frame and read by wild
// monsters / camera. A shared ref avoids threading state through React props
// every frame.
export const playerPos = new THREE.Vector3(0, 0, 8);

// Camera yaw around the player, driven by pointer drag.
export const cameraState = { orbit: 0.35 };

// On-screen joystick vector (screen plane: x = right, y = down), -1..1.
// Written by the touch controls overlay, read by <Player> each frame.
export const touchInput = { x: 0, y: 0 };

// Global day/night level (0 = midnight, 1 = full noon), written by <DayNight>
// each frame and read by the unlit billboards so the 2D sprites darken with the
// 3D scene at night instead of staying fully lit.
export const env = { daylight: 1 };

const _night = new THREE.Color(0.42, 0.48, 0.62); // cool + dim, but still readable
const _white = new THREE.Color(1, 1, 1);

/** Tint a billboard material toward the current daylight, over an optional base color. */
export function applyDaylight(mat: THREE.SpriteMaterial, base?: THREE.Color): void {
  mat.color.copy(_night).lerp(_white, env.daylight);
  if (base) mat.color.multiply(base);
}

export interface WildSpawn {
  wildId: string;
  speciesId: string;
  x: number;
  z: number;
  phase: number;
  // Cosmetic level used to pick the creature's evolution stage (1/2/3) for its
  // 3D model. Battle difficulty still scales to your lead, so this is visual.
  level: number;
  // A region Guardian: a rare, much tougher boss with distinct visuals, a
  // one-time clear reward, and no respawn.
  guardian?: boolean;
}
