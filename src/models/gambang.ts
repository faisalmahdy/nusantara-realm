import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Gambang — flower-spirit bird (resonant spirit-beast).
// From-scratch low-poly model matching the in-game sprite: a plump chibi bird
// whose body is a layered bloom of coral/pink petals, with green leaf wings and
// tail, a crown of petals topped by little golden buds, big teal eyes, a small
// hooked golden beak, and golden talon legs.
// ---------------------------------------------------------------------------

const PETAL = 0xe87a93;
const PETAL_LT = 0xf4a37e;
const PETAL_DK = 0xc85a76;
const LEAF = 0x5fa343;
const LEAF_DK = 0x437a2f;
const BUD = 0xf2c23e;
const BEAK = 0xdda02b;
const EYE = 0x49b6cb;
const PUPIL = 0x10242a;
const LEG = 0xcf9540;
const TALON = 0x8a6326;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.03, ...opts });
}

// A single rounded petal: a flattened, elongated sphere (length along +Y,
// flat face toward +Z). Sizes are in world units.
function petal(color: number, len: number, wid: number): THREE.Mesh {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(color, { flatShading: true }));
  p.scale.set(wid, len, 0.09);
  return p;
}

// A ring of large overlapping petals around the body: each hangs downward from
// the ring height, flat face outward, lower tip splayed out like a bloom.
function petalRing(parent: THREE.Object3D, cy: number, ringR: number, count: number, len: number, color: number, lean: number, phase = 0) {
  for (let i = 0; i < count; i++) {
    const a = phase + (i / count) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.position.set(0, cy, 0);
    holder.rotation.y = a;
    const p = petal(color, len, 0.15);
    p.position.set(0, -len * 0.32, ringR);
    p.rotation.x = lean;
    holder.add(p);
    parent.add(holder);
  }
}

// A pointed green leaf (flattened cone).
function leaf(color: number, h: number): THREE.Mesh {
  const l = new THREE.Mesh(new THREE.ConeGeometry(0.09, h, 7), mat(color, { flatShading: true }));
  l.scale.set(1, 1, 0.28);
  return l;
}

// Big teal eye with a glossy pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), mat(EYE, { roughness: 0.18, emissive: 0x0a3a44, emissiveIntensity: 0.4 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.position.z = 0.05;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.022, 0.028, 0.09);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.12, 0.02, 0.24);
  g.rotation.y = side * 0.2;
  return g;
}

// A golden flower-bud on a short green stem.
function bud(scale: number): THREE.Group {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.1, 6), mat(LEAF_DK));
  stem.position.y = 0.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(BUD, { flatShading: true, emissive: 0x6b4e0a, emissiveIntensity: 0.3 }));
  head.position.y = 0.11;
  g.add(stem, head);
  g.scale.setScalar(scale);
  return g;
}

// A bird leg: golden shank ending in three little talon toes.
function legMesh(side: number): THREE.Group {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.28, 8), mat(LEG));
  shank.position.y = 0.16;
  g.add(shank);
  [-0.5, 0, 0.5].forEach((toe) => {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 6), mat(TALON, { flatShading: true }));
    claw.rotation.x = Math.PI / 2;
    claw.position.set(Math.sin(toe) * 0.05, 0.03, 0.06 + Math.cos(toe) * 0.02);
    g.add(claw);
  });
  g.position.set(side * 0.14, 0, 0.04);
  return g;
}

/** Build the Gambang as a THREE.Group standing on y=0, facing +Z. */
export function buildGambang(): THREE.Group {
  const root = new THREE.Group();

  // Legs.
  root.add(legMesh(1), legMesh(-1));

  // Inner body core (mostly hidden under petals).
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), mat(PETAL_DK));
  body.scale.set(1, 1.05, 0.95);
  body.position.set(0, 0.58, 0);
  root.add(body);

  // Layered petal bloom over the body — rows from bottom up, alternating tones,
  // lower rows splayed out more so the body reads as an artichoke-like bloom.
  const bloom = new THREE.Group();
  bloom.position.set(0, 0.58, 0);
  petalRing(bloom, -0.18, 0.30, 12, 0.30, PETAL_DK, 0.7, 0.0);
  petalRing(bloom, -0.02, 0.38, 14, 0.34, PETAL, 0.5, 0.22);
  petalRing(bloom, 0.16, 0.36, 13, 0.32, PETAL_LT, 0.3, 0.0);
  petalRing(bloom, 0.30, 0.26, 10, 0.28, PETAL, 0.1, 0.3);
  root.add(bloom);

  // Head.
  const head = new THREE.Group();
  head.position.set(0, 1.02, 0.04);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 16), mat(PETAL_LT));
  head.add(skull);

  // Petal ruff framing the face (radiating outward in the frontal plane).
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.rotation.z = a;
    const p = petal(i % 2 ? PETAL : PETAL_LT, 0.2, 0.11);
    p.position.set(0, 0.3, -0.02);
    holder.add(p);
    head.add(holder);
  }

  // Face: eyes + small hooked golden beak.
  head.add(eye(1), eye(-1));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), mat(BEAK, { flatShading: true }));
  beak.rotation.x = Math.PI / 2 + 0.5;
  beak.position.set(0, -0.05, 0.27);
  head.add(beak);

  // Crown of upright petals + golden buds on top.
  const crown = new THREE.Group();
  crown.position.set(0, 0.26, 0.0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.rotation.y = a;
    const p = petal(PETAL, 0.18, 0.09);
    p.position.set(0, 0.08, 0.05);
    p.rotation.x = -0.4;
    holder.add(p);
    crown.add(holder);
  }
  const b1 = bud(1.0); b1.position.set(0, 0.06, 0);
  const b2 = bud(0.7); b2.position.set(-0.08, 0.04, 0.06);
  const b3 = bud(0.8); b3.position.set(0.08, 0.05, -0.04);
  crown.add(b1, b2, b3);
  head.add(crown);
  root.add(head);

  // Green leaf wings on each side, swept back.
  const wings: THREE.Group[] = [];
  [-1, 1].forEach((side) => {
    const wing = new THREE.Group();
    wing.position.set(side * 0.4, 0.62, -0.04);
    [[0.0, 0.34, 0.1], [0.12, 0.3, -0.2], [-0.12, 0.28, -0.3]].forEach(([dy, h, rot], k) => {
      const l = leaf(k % 2 ? LEAF_DK : LEAF, h);
      l.position.set(0, dy, 0);
      l.rotation.z = side * (0.9 + rot);
      l.rotation.y = side * 0.3;
      wing.add(l);
    });
    root.add(wing);
    wings.push(wing);
  });

  // Green leaf tail fanning out at the back.
  const tail = new THREE.Group();
  tail.position.set(0, 0.5, -0.4);
  [-0.5, -0.2, 0.1, 0.4].forEach((a, k) => {
    const l = leaf(k % 2 ? LEAF : LEAF_DK, 0.34);
    l.position.set(0, 0.0, 0);
    l.rotation.x = -1.4;
    l.rotation.z = a;
    tail.add(l);
  });
  root.add(tail);

  // Idle flourish — gentle breathing, crown buds sway, wings flutter softly.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.6) * 0.02;
    body.scale.set(breathe, 1.05, 0.95 * breathe);
    bloom.scale.set(breathe, 1, breathe);
    b1.rotation.z = Math.sin(time * 1.8) * 0.18;
    b2.rotation.z = Math.sin(time * 1.8 + 0.7) * 0.2;
    b3.rotation.z = Math.sin(time * 1.8 + 1.3) * 0.2;
    wings[0].rotation.z = Math.sin(time * 2.2) * 0.12;
    wings[1].rotation.z = -Math.sin(time * 2.2) * 0.12;
  };

  return root;
}
