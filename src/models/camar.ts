import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Camar Badai — Storm-Gull Chimera.
// From-scratch low-poly model matching the reference sheet: slate storm-blue
// plumage with a white face/chest, hooked golden beak, golden eyes, a spiky
// crest, swept blade-wings with electric-blue lightning-streak feathers, a
// turquoise throat gem, and a pennant tail.
// ---------------------------------------------------------------------------

const SLATE = 0x5d6d80;
const SLATE_DARK = 0x404b59;
const WHITE = 0xe9eef3;
const BEAK = 0xd8a83e;
const EYE_GOLD = 0xf1b41d;
const TALON = 0xc6a049;
const BOLT = 0x86d6ff;
const GEM = 0x35c4d6;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.05, ...opts });
}

// A flattened blade-feather cone pointing along +Y by default.
function feather(len: number, width: number, color: number, bolt = false): THREE.Mesh {
  const f = new THREE.Mesh(
    new THREE.ConeGeometry(width, len, 6),
    mat(color, { flatShading: true, emissive: bolt ? 0x1f5b7a : 0x000000, emissiveIntensity: bolt ? 0.55 : 0 }),
  );
  f.scale.set(1, 1, 0.38); // flatten into a blade
  return f;
}

// One swept wing: a stack of blade feathers fanning outward and back, with a
// single electric-blue lightning-streak feather.
function wing(side: number): THREE.Group {
  const g = new THREE.Group();
  const specs = [
    { len: 0.62, w: 0.09, bolt: false, spread: 0.0 },
    { len: 0.8, w: 0.09, bolt: false, spread: 0.22 },
    { len: 0.74, w: 0.085, bolt: true, spread: 0.44 },
    { len: 0.58, w: 0.08, bolt: false, spread: 0.66 },
  ];
  specs.forEach((s) => {
    const f = feather(s.len, s.w, s.bolt ? BOLT : SLATE, s.bolt);
    // Cone points +Y; rotate so it points outward (+x for right side) and back.
    f.rotation.z = -side * (Math.PI / 2 - 0.15);
    f.rotation.y = side * s.spread;
    f.position.set(side * (0.18 + s.len * 0.42), 0.02 - s.spread * 0.18, -0.06 - s.spread * 0.2);
    g.add(f);
  });
  g.position.set(side * 0.26, 0.66, -0.04);
  g.rotation.x = 0.25; // droop the wings slightly back
  return g;
}

function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), mat(EYE_GOLD, { roughness: 0.25, emissive: 0x3a2a00, emissiveIntensity: 0.45 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mat(0x0c0a06, { roughness: 0.2 }));
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.02, 0.022, 0.08);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.12, 0.04, 0.18);
  return g;
}

function leg(x: number): THREE.Group {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), mat(TALON));
  shank.position.y = 0.15;
  g.add(shank);
  // Three little talons fanning forward.
  [-0.07, 0, 0.07].forEach((tx) => {
    const toe = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), mat(TALON, { flatShading: true }));
    toe.rotation.x = Math.PI / 2.2;
    toe.position.set(tx, 0.02, 0.06);
    g.add(toe);
  });
  g.position.set(x, 0, 0.02);
  return g;
}

/** Build the Camar as a THREE.Group standing on y=0, facing +Z. */
export function buildCamar(): THREE.Group {
  const root = new THREE.Group();

  // Upright teardrop body — slate back, white chest.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 18), mat(SLATE));
  body.scale.set(0.58, 0.74, 0.52);
  body.position.set(0, 0.62, 0);
  root.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), mat(WHITE));
  chest.scale.set(0.5, 0.62, 0.42);
  chest.position.set(0, 0.6, 0.16);
  root.add(chest);

  // Legs + talons.
  root.add(leg(0.13), leg(-0.13));

  // Wings.
  root.add(wing(1), wing(-1));

  // Throat gem pendant.
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), mat(GEM, { metalness: 0.3, roughness: 0.2, emissive: 0x0a3a40, emissiveIntensity: 0.6 }));
  gem.position.set(0, 0.42, 0.27);
  root.add(gem);

  // Head — white face over a slate crown.
  const head = new THREE.Group();
  head.position.set(0, 1.06, 0.06);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), mat(SLATE));
  crown.scale.set(0.96, 0.95, 1.0);
  head.add(crown);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), mat(WHITE));
  face.scale.set(0.82, 0.78, 0.72);
  face.position.set(0, -0.04, 0.13);
  head.add(face);

  // Hooked beak — upper hook + lower mandible.
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.26, 8), mat(BEAK, { flatShading: true }));
  upper.rotation.x = Math.PI / 2;
  upper.position.set(0, -0.02, 0.26);
  head.add(upper);
  const hook = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 6), mat(BEAK, { flatShading: true }));
  hook.rotation.x = Math.PI * 0.78;
  hook.position.set(0, -0.07, 0.34);
  head.add(hook);

  // Spiky crest — slate quills tipped electric blue.
  [-0.12, 0, 0.12].forEach((cx, i) => {
    const quill = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3 - Math.abs(cx) * 0.6, 6), mat(SLATE_DARK, { flatShading: true }));
    quill.position.set(cx, 0.22, -0.04);
    quill.rotation.x = -0.5 - i * 0.05;
    quill.rotation.z = cx * 1.2;
    head.add(quill);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), mat(BOLT, { flatShading: true, emissive: 0x1f5b7a, emissiveIntensity: 0.5 }));
    tip.position.set(cx, 0.34, -0.05);
    tip.rotation.z = cx * 1.2;
    head.add(tip);
  });

  head.add(eye(1), eye(-1));
  root.add(head);

  // Pennant tail — long blade feathers sweeping back and down.
  [-0.08, 0.0, 0.08].forEach((tx) => {
    const t = feather(0.55, 0.07, SLATE, false);
    t.rotation.x = Math.PI * 0.86;
    t.rotation.z = tx * 2.0;
    t.position.set(tx, 0.5, -0.32);
    root.add(t);
  });

  return root;
}
