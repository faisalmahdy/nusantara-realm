import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Kancil Emas — Golden Mousedeer Chimera.
// A from-scratch low-poly 3D model authored in Three.js, matching the official
// character reference sheet (front / 3-4 / side / back + signature details):
//   gold coat, batik-diamond flank, big cream-lined ears, amber eyes,
//   black hooves, a gold anklet on the front-left leg, slender deer legs.
// ---------------------------------------------------------------------------

const GOLD = 0xd99a2e;
const GOLD_LIGHT = 0xe7b54a;
const CREAM = 0xf3e4c2;
const AMBER = 0xf0a91e;
const HOOF = 0x161412;
const ANKLET = 0xf4c430;
const NOSE = 0x2a1d14;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04, ...opts });
}

// A small canvas texture of the batik diamond motif for the flanks.
function batikTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d99a2e';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(120,78,18,0.65)';
  ctx.lineWidth = 4;
  const draw = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.stroke();
  };
  draw(s / 2, s / 2, 30);
  draw(s / 2, s / 2, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function leg(x: number, z: number, anklet = false): THREE.Group {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.5, 8), mat(GOLD));
  upper.position.y = 0.25;
  g.add(upper);
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.12, 8), mat(HOOF, { roughness: 0.5 }));
  hoof.position.y = 0.02;
  g.add(hoof);
  if (anklet) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 8, 16), mat(ANKLET, { metalness: 0.55, roughness: 0.3 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    g.add(ring);
  }
  g.position.set(x, 0, z);
  return g;
}

function ear(side: number): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.46, 10), mat(GOLD_LIGHT, { flatShading: true }));
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.4, 10), mat(CREAM, { flatShading: true }));
  inner.position.z = 0.02;
  g.add(outer, inner);
  g.scale.set(0.7, 1, 1); // flatten into a leaf-shaped ear
  g.position.set(side * 0.18, 0.32, -0.02);
  g.rotation.z = side * 0.5;
  g.rotation.x = -0.25;
  return g;
}

function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), mat(AMBER, { roughness: 0.25, emissive: 0x3a2400, emissiveIntensity: 0.4 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), mat(0x140d06, { roughness: 0.2 }));
  pupil.position.set(0, 0, 0.06);
  g.add(ball, pupil);
  g.position.set(side * 0.16, 0.05, 0.27);
  return g;
}

/** Build the Kancil as a THREE.Group standing on y=0, facing +Z. */
export function buildKancil(): THREE.Group {
  const root = new THREE.Group();

  // Torso — an elongated, slightly tapered ellipsoid.
  const bodyGeo = new THREE.SphereGeometry(0.42, 24, 18);
  const body = new THREE.Mesh(bodyGeo, mat(GOLD, { map: batikTexture() }));
  body.scale.set(0.62, 0.66, 1.15);
  body.position.set(0, 0.78, 0);
  root.add(body);

  // Cream belly underlay.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), mat(CREAM));
  belly.scale.set(0.5, 0.42, 1.0);
  belly.position.set(0, 0.66, 0.04);
  root.add(belly);

  // Chest / front swell.
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mat(GOLD));
  chest.scale.set(0.7, 0.8, 0.7);
  chest.position.set(0, 0.8, 0.42);
  root.add(chest);

  // Neck.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 12), mat(GOLD));
  neck.position.set(0, 0.98, 0.5);
  neck.rotation.x = 0.7;
  root.add(neck);

  // Head group (sits forward and up).
  const head = new THREE.Group();
  head.position.set(0, 1.18, 0.62);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), mat(GOLD));
  skull.scale.set(0.95, 0.95, 1.0);
  head.add(skull);
  // Snout.
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.3, 12), mat(GOLD_LIGHT));
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.05, 0.26);
  head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat(NOSE, { roughness: 0.4 }));
  nose.position.set(0, -0.03, 0.42);
  head.add(nose);
  head.add(ear(1), ear(-1));
  head.add(eye(1), eye(-1));
  root.add(head);

  // Legs — front pair forward, rear pair back; anklet on the front-left.
  root.add(leg(0.2, 0.42, true));
  root.add(leg(-0.2, 0.42));
  root.add(leg(0.22, -0.4));
  root.add(leg(-0.22, -0.4));

  // Stubby tail.
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 8), mat(CREAM, { flatShading: true }));
  tail.position.set(0, 0.82, -0.6);
  tail.rotation.x = -2.4;
  root.add(tail);

  return root;
}
