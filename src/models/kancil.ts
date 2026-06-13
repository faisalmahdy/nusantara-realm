import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Kancil Emas — Golden Mousedeer Chimera.
// A from-scratch low-poly 3D model authored in Three.js, matching the official
// character reference sheet (front / 3-4 / side / back + signature details):
//   gold coat with a white chest blaze, concentric batik-diamond flank/rump,
//   tall cream-lined ears, flared cheek ruff, big amber eyes, black hooves,
//   a gold anklet on the front-left leg, slender deer legs.
// ---------------------------------------------------------------------------

const GOLD = 0xd99a2e;
const GOLD_LIGHT = 0xe7b54a;
const GOLD_DARK = 0x9c6418;
const CREAM = 0xf3e4c2;
const AMBER = 0xf0a91e;
const HOOF = 0x161412;
const ANKLET = 0xf4c430;
const NOSE = 0x2a1d14;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04, ...opts });
}

// Crisp concentric batik diamonds (three nested + a centre pip) for the coat.
function batikTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d99a2e';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(108,66,12,0.7)';
  ctx.lineJoin = 'round';
  const diamond = (cx: number, cy: number, r: number, w: number) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.stroke();
  };
  diamond(s / 2, s / 2, 44, 5);
  diamond(s / 2, s / 2, 28, 4);
  diamond(s / 2, s / 2, 13, 3);
  ctx.fillStyle = 'rgba(108,66,12,0.7)';
  ctx.beginPath(); ctx.arc(s / 2, s / 2, 4, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Short, slender deer leg with a black hoof; the upper tilts inward to the hip.
function leg(x: number, z: number, anklet = false): THREE.Group {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.05, 0.34, 10), mat(GOLD));
  upper.position.y = 0.21;
  g.add(upper);
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.078, 0.1, 10), mat(HOOF, { roughness: 0.5 }));
  hoof.position.y = 0.03;
  g.add(hoof);
  if (anklet) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.024, 8, 16), mat(ANKLET, { metalness: 0.6, roughness: 0.28 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    g.add(ring);
  }
  g.position.set(x, 0, z);
  g.rotation.z = -Math.sign(x) * 0.1;
  return g;
}

// Tall ear: gold leaf shell with a darker rim and a bright cream inner lining.
function ear(side: number): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.66, 12), mat(GOLD, { flatShading: true }));
  const rim = new THREE.Mesh(new THREE.ConeGeometry(0.165, 0.6, 12), mat(GOLD_DARK, { flatShading: true }));
  rim.position.z = -0.02;
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.56, 12), mat(CREAM, { flatShading: true }));
  inner.position.z = 0.045;
  g.add(rim, outer, inner);
  g.scale.set(0.6, 1, 0.42);
  g.position.set(side * 0.18, 0.3, -0.06);
  g.rotation.z = side * 0.3;
  g.rotation.x = -0.12;
  return g;
}

// Flared cheek ruff — the chimera's signature fur tuft, gold with a cream tip.
function cheek(side: number): THREE.Group {
  const g = new THREE.Group();
  const fur = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat(GOLD_LIGHT, { flatShading: true }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), mat(CREAM, { flatShading: true }));
  tip.position.y = 0.12;
  g.add(fur, tip);
  g.position.set(side * 0.24, -0.05, 0.04);
  g.rotation.x = -2.3;          // sweep the tuft back along the jaw
  g.rotation.z = side * 0.55;   // and a little outward
  g.scale.set(0.85, 0.9, 0.5);  // flatten so it hugs the cheek
  return g;
}

// Large expressive amber eye with a glossy pupil, catch-light and a soft brow.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 18), mat(AMBER, { roughness: 0.22, emissive: 0x3a2400, emissiveIntensity: 0.45 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 14), mat(0x120b05, { roughness: 0.18 }));
  pupil.position.set(0, 0, 0.07);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.025, 0.03, 0.12);
  const brow = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), mat(GOLD_DARK));
  brow.scale.set(1.05, 0.24, 0.6);
  brow.position.set(0, 0.085, 0.06);
  g.add(brow, ball, pupil, glint);
  g.position.set(side * 0.18, 0.04, 0.235);
  g.rotation.y = side * 0.18;
  return g;
}

/** Build the Kancil as a THREE.Group standing on y=0, facing +Z. */
export function buildKancil(): THREE.Group {
  const root = new THREE.Group();

  // Torso — a deer barrel, longer than wide, carrying the batik on its flanks.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 18), mat(GOLD, { map: batikTexture() }));
  body.scale.set(0.8, 0.8, 1.18);
  body.position.set(0, 0.6, -0.04);
  root.add(body);

  // Fuller chest swelling up at the front (the fawn's deep chest).
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), mat(GOLD));
  chest.scale.set(0.78, 0.84, 0.72);
  chest.position.set(0, 0.64, 0.34);
  root.add(chest);

  // Cream belly underlay.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), mat(CREAM));
  belly.scale.set(0.64, 0.54, 0.98);
  belly.position.set(0, 0.46, 0.08);
  root.add(belly);

  // White chest blaze rising up the front toward the throat.
  const blaze = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), mat(CREAM));
  blaze.scale.set(0.62, 1.0, 0.4);
  blaze.position.set(0, 0.66, 0.5);
  root.add(blaze);

  // Hindquarter swell carrying the batik diamond onto the rump.
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), mat(GOLD, { map: batikTexture() }));
  rump.scale.set(0.8, 0.8, 0.72);
  rump.position.set(0, 0.62, -0.38);
  root.add(rump);

  // Short, thick neck blending body to head.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.3, 14), mat(GOLD));
  neck.position.set(0, 0.86, 0.36);
  neck.rotation.x = 0.6;
  root.add(neck);

  // Head group — large (chibi), sits forward and up.
  const head = new THREE.Group();
  const headBaseY = 1.06;
  head.position.set(0, headBaseY, 0.48);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 18), mat(GOLD));
  skull.scale.set(1.0, 0.96, 0.96);
  head.add(skull);
  // Little forehead cowlick peak between the ears.
  const cowlick = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), mat(GOLD_LIGHT, { flatShading: true }));
  cowlick.position.set(0, 0.3, 0.04);
  cowlick.rotation.x = -0.2;
  head.add(cowlick);
  // Cream lower-face / muzzle wrap.
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), mat(CREAM));
  muzzle.scale.set(0.78, 0.66, 0.92);
  muzzle.position.set(0, -0.12, 0.18);
  head.add(muzzle);
  // Snout tip.
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), mat(GOLD_LIGHT));
  snout.scale.set(0.85, 0.7, 1.0);
  snout.position.set(0, -0.09, 0.27);
  head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), mat(NOSE, { roughness: 0.4 }));
  nose.position.set(0, -0.06, 0.37);
  head.add(nose);
  head.add(cheek(1), cheek(-1));
  const earL = ear(1);
  const earR = ear(-1);
  head.add(earL, earR);
  head.add(eye(1), eye(-1));
  root.add(head);

  // Legs — tucked under the body; anklet on the front-left.
  root.add(leg(0.18, 0.28, true));
  root.add(leg(-0.18, 0.28));
  root.add(leg(0.2, -0.32));
  root.add(leg(-0.2, -0.32));

  // Stubby upturned tail with a cream tip.
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 10), mat(CREAM, { flatShading: true }));
  tail.position.set(0, 0.68, -0.66);
  tail.rotation.x = -2.2;
  root.add(tail);

  // Subtle idle: gentle head bob/sway, a periodic ear flick, soft tail sway.
  const earBaseX = earL.rotation.x;
  root.userData.idle = (t: number) => {
    head.position.y = headBaseY + Math.sin(t * 1.6) * 0.018;
    head.rotation.z = Math.sin(t * 0.8) * 0.04;
    const flick = Math.max(0, Math.sin(t * 0.9)) ** 10;
    earL.rotation.x = earBaseX - flick * 0.5;
    tail.rotation.z = Math.sin(t * 2.4) * 0.22;
  };

  return root;
}
