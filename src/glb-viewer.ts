import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Standalone QA viewer for Meshy-generated GLB assets.
// Pass ?model=/models/kancil.glb to choose which file to load.

const params = new URLSearchParams(location.search);
const url = params.get('model') ?? '/models/kancil.glb';

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

scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x30281c, 0.9));
const key = new THREE.DirectionalLight(0xfff2d8, 1.6);
key.position.set(4, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc0ff, 0.6);
rim.position.set(-4, 3, -4);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3, 48),
  new THREE.MeshStandardMaterial({ color: 0x2a3548, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pivot = new THREE.Group();
scene.add(pivot);

const loader = new GLTFLoader();
loader.load(
  url,
  (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    // Normalise to ~1.2u tall, centre on the ground at y=0.
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 1.2 / (size.y || 1);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    pivot.add(model);
    (window as any).__glb = { model, pivot, ready: true, size: size.toArray() };
  },
  undefined,
  (err) => {
    console.error('[glb-viewer] failed to load', url, err);
    (window as any).__glb = { ready: false, error: String(err) };
  },
);

let dragging = false;
let lastX = 0;
let autoRotate = true;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; autoRotate = false; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  pivot.rotation.y += (e.clientX - lastX) * 0.01;
  lastX = e.clientX;
});

const clock = new THREE.Clock();
function animate() {
  const dt = clock.getDelta();
  if (autoRotate) pivot.rotation.y += dt * 0.6;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

(window as any).__glbViewer = { scene, camera, pivot, setRotation: (y: number) => { pivot.rotation.y = y; autoRotate = false; } };
