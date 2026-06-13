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

// Short, slender leg that tucks up under the plump body. The upper tilts
// inward toward the hip so it reads as attached rather than a floating stilt.
function leg(x: number, z: number, anklet = false): THREE.Group {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.34, 10), mat(GOLD));
  upper.position.y = 0.21;
  g.add(upper);
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 10), mat(HOOF, { roughness: 0.5 }));
  hoof.position.y = 0.03;
  g.add(hoof);
  if (anklet) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.024, 8, 16), mat(ANKLET, { metalness: 0.6, roughness: 0.28 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    g.add(ring);
  }
  g.position.set(x, 0, z);
  g.rotation.z = -Math.sign(x) * 0.12; // splay feet slightly outward
  return g;
}

// Big leaf-shaped ear with a cream inner; stands up and fans outward.
function ear(side: number): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 12), mat(GOLD_LIGHT, { flatShading: true }));
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.52, 12), mat(CREAM, { flatShading: true }));
  inner.position.z = 0.03;
  g.add(outer, inner);
  g.scale.set(0.62, 1, 0.5); // flatten into a leaf-shaped ear
  g.position.set(side * 0.22, 0.26, -0.04);
  g.rotation.z = side * 0.42;
  g.rotation.x = -0.18;
  return g;
}

// Large expressive amber eye (chibi proportions) with a glossy black pupil
// and a small catch-light for life.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 18), mat(AMBER, { roughness: 0.22, emissive: 0x3a2400, emissiveIntensity: 0.45 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 14), mat(0x120b05, { roughness: 0.18 }));
  pupil.position.set(0, 0, 0.07);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.025, 0.03, 0.12);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.18, 0.04, 0.235);
  g.rotation.y = side * 0.18;
  return g;
}

/** Build the Kancil as a THREE.Group standing on y=0, facing +Z. */
export function buildKancil(): THREE.Group {
  const root = new THREE.Group();

  // Torso — a plump, rounded bean sitting low so the legs reach up into it.
  const bodyGeo = new THREE.SphereGeometry(0.45, 24, 18);
  const body = new THREE.Mesh(bodyGeo, mat(GOLD, { map: batikTexture() }));
  body.scale.set(0.82, 0.78, 1.04);
  body.position.set(0, 0.58, -0.02);
  root.add(body);

  // Cream belly underlay (front-lower, like the ref).
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), mat(CREAM));
  belly.scale.set(0.66, 0.56, 0.92);
  belly.position.set(0, 0.46, 0.1);
  root.add(belly);

  // Hindquarter swell carrying the batik diamond toward the rump.
  const rump = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), mat(GOLD, { map: batikTexture() }));
  rump.scale.set(0.78, 0.78, 0.7);
  rump.position.set(0, 0.6, -0.34);
  root.add(rump);

  // Short, thick neck blending body to head.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.26, 14), mat(GOLD));
  neck.position.set(0, 0.84, 0.34);
  neck.rotation.x = 0.62;
  root.add(neck);

  // Head group — large (chibi), sits forward and up.
  const head = new THREE.Group();
  head.position.set(0, 1.04, 0.46);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.32, 22, 18), mat(GOLD));
  skull.scale.set(1.0, 0.94, 0.96);
  head.add(skull);
  // Cream lower-face / muzzle wrap.
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), mat(CREAM));
  muzzle.scale.set(0.78, 0.66, 0.9);
  muzzle.position.set(0, -0.12, 0.18);
  head.add(muzzle);
  // Snout tip.
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), mat(GOLD_LIGHT));
  snout.scale.set(0.85, 0.7, 1.0);
  snout.position.set(0, -0.08, 0.27);
  head.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), mat(NOSE, { roughness: 0.4 }));
  nose.position.set(0, -0.05, 0.37);
  head.add(nose);
  head.add(ear(1), ear(-1));
  head.add(eye(1), eye(-1));
  root.add(head);

  // Legs — tucked under the body; anklet on the front-left.
  root.add(leg(0.18, 0.26, true));
  root.add(leg(-0.18, 0.26));
  root.add(leg(0.2, -0.3));
  root.add(leg(-0.2, -0.3));

  // Stubby upturned tail with a cream tip.
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 10), mat(CREAM, { flatShading: true }));
  tail.position.set(0, 0.66, -0.62);
  tail.rotation.x = -2.2;
  root.add(tail);

  return root;
}
