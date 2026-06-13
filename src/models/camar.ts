import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Camar Badai — Storm-Gull Chimera.
// From-scratch low-poly model matching the reference sheet: slate storm-blue
// plumage with a white face/chest, hooked golden beak, fierce golden eyes under
// a dark brow, a tall spiky crest, big spread wings layered with electric-blue
// lightning-streak feathers, a feathered neck ruff, a turquoise throat gem, a
// pennant tail, and a curling storm wisp.
// ---------------------------------------------------------------------------

const SLATE = 0x5d6d80;
const SLATE_DARK = 0x404b59;
const WHITE = 0xe9eef3;
const BEAK = 0xd8a83e;
const EYE_GOLD = 0xf1b41d;
const TALON = 0xc6a049;
const BOLT = 0x86d6ff;
const GEM = 0x35c4d6;
const CLOUD = 0xc9d3dc;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.05, ...opts });
}

// A flattened blade-feather cone pointing along +Y by default.
function feather(len: number, width: number, color: number, bolt = false): THREE.Mesh {
  const f = new THREE.Mesh(
    new THREE.ConeGeometry(width, len, 6),
    mat(color, { flatShading: true, emissive: bolt ? 0x2370a0 : 0x000000, emissiveIntensity: bolt ? 0.7 : 0 }),
  );
  f.scale.set(1, 1, 0.38); // flatten into a blade
  return f;
}

// One big spread wing: a vertical fan of layered flight feathers rooted at the
// shoulder, longest through the middle (primaries), with two electric-blue
// lightning-streak feathers worked into the layering.
function wing(side: number): THREE.Group {
  const g = new THREE.Group();
  const N = 7;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);                       // 0 inner → 1 outer tip
    const len = 0.5 + 0.55 * Math.sin(t * Math.PI * 0.85); // primaries longest mid-out
    const a = 0.12 + t * 1.05;                   // raise from out-horizontal → up
    const bolt = i === 2 || i === 4;             // two lightning-streak feathers
    const base = i % 2 === 0 ? SLATE : SLATE_DARK;
    const f = feather(len, 0.082, bolt ? BOLT : base, bolt);
    f.rotation.z = -side * (Math.PI / 2 - a);
    f.rotation.y = side * (0.12 + t * 0.55);     // sweep the fan back
    const dirx = Math.cos(a), diry = Math.sin(a);
    f.position.set(side * (dirx * (len * 0.5) + 0.06), diry * (len * 0.5) + 0.02, -0.05 - t * 0.26);
    g.add(f);
  }
  g.position.set(side * 0.22, 0.68, -0.03);
  g.rotation.x = 0.12;
  return g;
}

// Fierce golden eye with a dark slate brow angled inward (raptor glare).
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.072, 16, 16), mat(EYE_GOLD, { roughness: 0.25, emissive: 0x3a2a00, emissiveIntensity: 0.5 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), mat(0x0c0a06, { roughness: 0.2 }));
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.02, 0.022, 0.08);
  const brow = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), mat(SLATE_DARK, { flatShading: true }));
  brow.scale.set(1.2, 0.34, 0.7);
  brow.position.set(0, 0.07, 0.04);
  brow.rotation.z = side * 0.35;                 // inward tilt = angry glare
  g.add(brow, ball, pupil, glint);
  g.position.set(side * 0.12, 0.04, 0.18);
  return g;
}

function leg(x: number): THREE.Group {
  const g = new THREE.Group();
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8), mat(TALON));
  shank.position.y = 0.15;
  g.add(shank);
  [-0.07, 0, 0.07].forEach((tx) => {
    const toe = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), mat(TALON, { flatShading: true }));
    toe.rotation.x = Math.PI / 2.2;
    toe.position.set(tx, 0.02, 0.06);
    g.add(toe);
  });
  g.position.set(x, 0, 0.02);
  return g;
}

// A small curl of storm cloud — a few overlapping pale puffs.
function stormWisp(): THREE.Group {
  const g = new THREE.Group();
  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 0.1], [0.08, 0.05, 0.0, 0.08], [0.14, 0.12, -0.02, 0.065], [0.17, 0.21, -0.03, 0.05],
  ];
  puffs.forEach(([x, y, z, r]) => {
    const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(CLOUD, { roughness: 1, emissive: 0x33414f, emissiveIntensity: 0.25 }));
    p.position.set(x, y, z);
    g.add(p);
  });
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

  // Feathered neck ruff — a ring of little slate feather tips where head meets body.
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2;
    const ruff = feather(0.2, 0.06, i % 2 ? SLATE : SLATE_DARK);
    ruff.position.set(Math.sin(ang) * 0.21, 0.9, Math.cos(ang) * 0.18 + 0.02);
    ruff.rotation.x = Math.cos(ang) * 0.5 + 0.4;
    ruff.rotation.z = -Math.sin(ang) * 0.5;
    root.add(ruff);
  }

  // Legs + talons.
  root.add(leg(0.13), leg(-0.13));

  // Wings (kept referenced for the idle flap).
  const wingR = wing(1);
  const wingL = wing(-1);
  root.add(wingR, wingL);

  // Throat gem pendant.
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), mat(GEM, { metalness: 0.3, roughness: 0.2, emissive: 0x0a3a40, emissiveIntensity: 0.6 }));
  gem.position.set(0, 0.42, 0.27);
  root.add(gem);

  // Head — white face over a slate crown.
  const head = new THREE.Group();
  head.position.set(0, 1.08, 0.06);
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

  // Tall spiky crest — a back-swept fan of slate/white feathers, bolt-tipped.
  const crestXs = [-0.16, -0.08, 0, 0.08, 0.16];
  crestXs.forEach((cx, i) => {
    const mid = 1 - Math.abs(cx) / 0.16;          // taller toward the centre
    const len = 0.26 + mid * 0.2;
    const quill = feather(len, 0.055, i % 2 ? WHITE : SLATE);
    quill.position.set(cx, 0.2 + mid * 0.08, -0.05);
    quill.rotation.x = -0.55 - mid * 0.15;
    quill.rotation.z = cx * 1.4;
    head.add(quill);
    if (Math.abs(cx) < 0.12) {
      const tip = feather(0.1, 0.03, BOLT, true);
      tip.position.set(cx, 0.34 + mid * 0.1, -0.07);
      tip.rotation.x = -0.55 - mid * 0.15;
      tip.rotation.z = cx * 1.4;
      head.add(tip);
    }
  });

  head.add(eye(1), eye(-1));
  root.add(head);

  // Pennant tail — long blade feathers sweeping back and down.
  [-0.08, 0.0, 0.08].forEach((tx) => {
    const t = feather(0.55, 0.07, tx === 0 ? SLATE : SLATE_DARK, false);
    t.rotation.x = Math.PI * 0.86;
    t.rotation.z = tx * 2.0;
    t.position.set(tx, 0.5, -0.32);
    root.add(t);
  });

  // Storm wisp curling up behind the right shoulder (signature detail).
  const wisp = stormWisp();
  wisp.position.set(0.34, 0.78, -0.18);
  wisp.rotation.z = -0.3;
  root.add(wisp);

  // Idle flourish — a slow wing-beat, crest shiver, and drifting storm wisp.
  root.userData.idle = (time: number) => {
    const flap = Math.sin(time * 2.4) * 0.22;
    wingR.rotation.z = flap;
    wingL.rotation.z = -flap;
    wingR.rotation.x = 0.12 + flap * 0.2;
    wingL.rotation.x = 0.12 + flap * 0.2;
    wisp.position.y = 0.78 + Math.sin(time * 1.3) * 0.04;
    wisp.rotation.z = -0.3 + Math.sin(time * 0.9) * 0.12;
    const s = 1 + Math.sin(time * 1.7) * 0.06;
    wisp.scale.set(s, s, s);
  };

  return root;
}
