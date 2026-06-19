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
