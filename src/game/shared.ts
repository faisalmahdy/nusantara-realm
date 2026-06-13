import * as THREE from 'three';

// Player world position, written by <Player> each frame and read by wild
// monsters / camera. A shared ref avoids threading state through React props
// every frame.
export const playerPos = new THREE.Vector3(0, 0, 8);

// Camera yaw around the player, driven by pointer drag.
export const cameraState = { orbit: 0.35 };

export interface WildSpawn {
  wildId: string;
  speciesId: string;
  x: number;
  z: number;
  phase: number;
}
