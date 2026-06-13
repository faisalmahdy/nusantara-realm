import * as THREE from 'three';
import { buildKancil } from './models/kancil';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2230);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2.6, 1.6, 3.2);
camera.lookAt(0, 0.85, 0);

// Studio lighting.
scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x30281c, 0.85));
const key = new THREE.DirectionalLight(0xfff2d8, 1.5);
key.position.set(4, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 0.6);
rim.position.set(-4, 3, -4);
scene.add(rim);

// Ground disc.
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3, 48),
  new THREE.MeshStandardMaterial({ color: 0x2a3548, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const model = buildKancil();
model.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
scene.add(model);

// Pointer-drag to spin manually; otherwise auto-rotate.
let dragging = false;
let lastX = 0;
let autoRotate = true;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; autoRotate = false; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  model.rotation.y += (e.clientX - lastX) * 0.01;
  lastX = e.clientX;
});

const clock = new THREE.Clock();
function animate() {
  const dt = clock.getDelta();
  if (autoRotate) model.rotation.y += dt * 0.6;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

(window as any).__model = { scene, model, camera, setRotation: (y: number) => { model.rotation.y = y; autoRotate = false; } };
