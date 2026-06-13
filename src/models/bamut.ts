import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Bamut — mossy boar earth-beast.
// From-scratch low-poly model matching the in-game sprite: a stocky quadruped
// boar whose hide is overgrown with green moss, a tan snout with two nostrils,
// big amber eyes, upturned cream tusks, pointed ears, dark hooves, a curly
// tail, with little red mushrooms and fern sprigs sprouting from its back.
// ---------------------------------------------------------------------------

const MOSS_DARK = 0x4f6b2c;
const SKIN = 0xb08968;
const NOSE = 0xc8907c;
const TUSK = 0xece2c6;
const EYE = 0xd9971f;
const HOOF = 0x352a20;
const CAP = 0xb54a30;
const STEM = 0xe7dcc0;
const NOSTRIL = 0x4a2f24;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02, ...opts });
}

// Mottled mossy-green texture: base green flecked with lighter/darker patches.
function mossTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6f8f3e';
  ctx.fillRect(0, 0, s, s);
  const blobs = ['#5b7a30', '#80a04a', '#4f6b2c', '#8cae54'];
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = blobs[i % blobs.length];
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 3 + Math.random() * 7;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A little red-capped mushroom (cream stem + spotted cap).
function mushroom(scale: number): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.1, 8), mat(STEM));
  stem.position.y = 0.05;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(CAP, { flatShading: true }));
  cap.position.y = 0.1;
  g.add(stem, cap);
  g.scale.setScalar(scale);
  return g;
}

// Short fern sprig — a few flattened green blades.
function fern(): THREE.Group {
  const g = new THREE.Group();
  [-0.4, 0, 0.4].forEach((a) => {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 6), mat(MOSS_DARK, { flatShading: true }));
    blade.scale.set(1, 1, 0.3);
    blade.position.y = 0.08;
    blade.rotation.z = a;
    g.add(blade);
  });
  return g;
}

// Big amber eye with glossy pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), mat(EYE, { roughness: 0.22, emissive: 0x3a2200, emissiveIntensity: 0.4 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), mat(0x140d05, { roughness: 0.15 }));
  pupil.position.z = 0.04;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.018, 0.022, 0.075);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.17, 0.16, 0.22);
  g.rotation.y = side * 0.25;
  return g;
}

// Pointed mossy ear.
function ear(side: number): THREE.Mesh {
  const e = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), mat(MOSS_DARK, { flatShading: true }));
  e.scale.set(0.8, 1, 0.5);
  e.position.set(side * 0.2, 0.34, 0.0);
  e.rotation.z = side * 0.5;
  e.rotation.x = -0.3;
  return e;
}

// Stubby leg ending in a dark hoof.
function leg(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.32, 9), mat(MOSS_DARK));
  limb.position.y = 0.18;
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.1, 9), mat(HOOF, { roughness: 0.5 }));
  hoof.position.y = 0.04;
  g.add(limb, hoof);
  g.position.set(x, 0, z);
  return g;
}

/** Build the Bamut as a THREE.Group standing on y=0, facing +Z. */
export function buildBamut(): THREE.Group {
  const root = new THREE.Group();
  const moss = mossTexture();

  // Stocky boar torso — front-heavy, tapering to the rump.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), mat(0xffffff, { map: moss }));
  body.scale.set(0.62, 0.62, 0.92);
  body.position.set(0, 0.5, -0.05);
  root.add(body);
  // Shoulder hump rising toward the head.
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), mat(0xffffff, { map: moss }));
  hump.scale.set(0.62, 0.6, 0.5);
  hump.position.set(0, 0.66, 0.24);
  root.add(hump);

  // Legs (front pair forward, rear pair back).
  root.add(leg(0.26, 0.32), leg(-0.26, 0.32), leg(0.26, -0.34), leg(-0.26, -0.34));

  // Head group at the front.
  const head = new THREE.Group();
  head.position.set(0, 0.6, 0.56);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 18), mat(0xffffff, { map: moss }));
  skull.scale.set(0.92, 0.9, 1.0);
  head.add(skull);

  // Tan snout barrel + nose pad with nostrils.
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.26, 14), mat(SKIN));
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.02, 0.28);
  head.add(snout);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), mat(NOSE));
  pad.scale.set(1, 0.85, 0.5);
  pad.position.set(0, -0.02, 0.42);
  head.add(pad);
  [-0.05, 0.05].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), mat(NOSTRIL, { roughness: 0.5 }));
    nostril.position.set(nx, -0.02, 0.46);
    head.add(nostril);
  });

  // Upturned cream tusks flanking the snout.
  [-1, 1].forEach((s) => {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.18, 7), mat(TUSK, { flatShading: true }));
    tusk.position.set(s * 0.13, -0.06, 0.34);
    tusk.rotation.x = -0.6;
    tusk.rotation.z = s * 0.35;
    head.add(tusk);
  });

  head.add(ear(1), ear(-1));
  head.add(eye(1), eye(-1));
  root.add(head);

  // Mushrooms + fern sprouting from the mossy back.
  const m1 = mushroom(1.0); m1.position.set(-0.16, 0.78, 0.0); root.add(m1);
  const m2 = mushroom(0.7); m2.position.set(0.04, 0.82, 0.12); root.add(m2);
  const m3 = mushroom(0.85); m3.position.set(0.12, 0.74, -0.28); root.add(m3);
  const fr = fern(); fr.position.set(-0.2, 0.7, -0.2); root.add(fr);

  // Curly tail at the rump.
  const tail = new THREE.Group();
  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 18, Math.PI * 1.7), mat(MOSS_DARK, { flatShading: true }));
  curl.rotation.y = Math.PI / 2;
  tail.add(curl);
  tail.position.set(0, 0.62, -0.5);
  tail.rotation.z = 0.4;
  root.add(tail);

  // Idle flourish — slow heavy breathing + a faint tail curl-wiggle.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.4) * 0.016;
    body.scale.set(0.62 * breathe, 0.62 * breathe, 0.92);
    tail.rotation.z = 0.4 + Math.sin(time * 2.2) * 0.18;
  };

  return root;
}
