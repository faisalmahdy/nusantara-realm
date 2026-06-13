import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Kepiting — armoured reef crab (Sea element).
// From-scratch low-poly model matching the in-game sprite: a wide domed
// orange/tan carapace crusted with cream barnacles, a pink-red coral growth on
// top, two big black eyes on short eyestalks, a lighter front belly-plate, two
// large pincer claws, and three pairs of segmented walking legs.
// ---------------------------------------------------------------------------

const SHELL = 0xc8703a;
const SHELL_LT = 0xe3c48a;
const CLAW = 0xc05a30;
const CLAW_IN = 0xd9917a;
const BARNACLE = 0xd8cba8;
const CORAL = 0xd9573f;
const CORAL_LT = 0xe78a6a;
const LEG = 0xb85a2e;
const EYE = 0x14100c;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.74, metalness: 0.03, ...opts });
}

// Crusty carapace texture: mottled orange with cream barnacle speckles + a few
// darker ring marks, for a weathered reef-shell look.
function shellTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#c8703a';
  ctx.fillRect(0, 0, s, s);
  const tones = ['#b5612e', '#d98a4a', '#a85628', '#e0a268'];
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = tones[i % tones.length];
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cream barnacle freckles.
  ctx.fillStyle = '#d8cba8';
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * s, Math.random() * s, 1.5 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A lumpy cream barnacle nodule (a couple of stacked rings).
function barnacle(scale: number): THREE.Mesh {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.06, 8), mat(BARNACLE, { flatShading: true }));
  b.scale.setScalar(scale);
  return b;
}

// Big black eye on a short orange stalk.
function eyestalk(side: number): THREE.Group {
  const g = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.2, 8), mat(SHELL));
  stalk.position.y = 0.1;
  const ring = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), mat(0xe6b23a, { roughness: 0.4 }));
  ring.position.y = 0.22;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 12), mat(EYE, { roughness: 0.12 }));
  ball.position.set(0, 0.23, 0.03);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.02, 0.26, 0.06);
  g.add(stalk, ring, ball, glint);
  g.position.set(side * 0.17, 0.66, 0.36);
  g.rotation.x = -0.2;
  return g;
}

// A big pincer claw: a segmented arm ending in an open gripper. Returns the
// group plus the movable upper jaw (for the idle open/close).
function claw(side: number): { group: THREE.Group; jaw: THREE.Mesh } {
  const g = new THREE.Group();
  // Upper arm + forearm, bent at the elbow.
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.34, 9), mat(CLAW));
  upper.rotation.z = side * 1.1;
  upper.position.set(side * 0.16, 0.02, 0.0);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 9), mat(CLAW));
  fore.rotation.x = Math.PI / 2;
  fore.position.set(side * 0.32, 0.04, 0.2);
  g.add(upper, fore);
  // Pincer palm (a bulbous claw body).
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(CLAW));
  palm.scale.set(0.9, 0.85, 1.2);
  palm.position.set(side * 0.36, 0.04, 0.42);
  g.add(palm);
  // A few barnacles crusting the outer palm.
  [[0.12, 0.08, 0.4], [0.06, -0.05, 0.5], [0.16, 0.0, 0.46]].forEach(([dx, dy, dz]) => {
    const b = barnacle(0.6);
    b.position.set(side * (0.36 + dx), 0.04 + dy, dz);
    g.add(b);
  });
  // Lower fixed jaw + movable upper jaw, pink inner edges, slightly open.
  const lower = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 9), mat(CLAW, { flatShading: true }));
  lower.rotation.x = Math.PI / 2 + 0.25;
  lower.position.set(side * 0.36, -0.04, 0.62);
  const lowerIn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 8), mat(CLAW_IN, { flatShading: true }));
  lowerIn.rotation.x = Math.PI / 2 + 0.25;
  lowerIn.position.set(side * 0.36, -0.02, 0.6);
  const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 9), mat(CLAW, { flatShading: true }));
  jaw.rotation.x = Math.PI / 2 - 0.25;
  jaw.position.set(side * 0.36, 0.12, 0.62);
  g.add(lower, lowerIn, jaw);
  return { group: g, jaw };
}

// A segmented walking leg ending in a pointed tip.
function leg(side: number, z: number, splay: number): THREE.Group {
  const g = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.28, 8), mat(LEG));
  thigh.rotation.z = side * 0.9;
  thigh.position.set(side * 0.12, 0.0, 0);
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.26, 8), mat(LEG));
  shin.position.set(side * 0.24, -0.16, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 7), mat(0x6e3318, { flatShading: true }));
  tip.position.set(side * 0.26, -0.3, 0);
  g.add(thigh, shin, tip);
  g.position.set(side * 0.6, 0.42, z);
  g.rotation.y = side * splay;
  return g;
}

/** Build the Kepiting as a THREE.Group standing on y=0, facing +Z. */
export function buildKepiting(): THREE.Group {
  const root = new THREE.Group();
  const shellTex = shellTexture();

  // Walking legs (3 pairs) — added first so the carapace overhangs them.
  [0.12, -0.14, -0.4].forEach((z, i) => {
    root.add(leg(1, z, 0.4 - i * 0.4), leg(-1, z, 0.4 - i * 0.4));
  });

  // Wide domed carapace.
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.5, 26, 18), mat(0xffffff, { map: shellTex }));
  shell.scale.set(1.5, 0.64, 1.18);
  shell.position.set(0, 0.46, 0);
  root.add(shell);

  // Lighter front belly-plate with two faint mask dimples (echoes the sprite).
  const plate = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 16), mat(SHELL_LT));
  plate.scale.set(1.15, 0.5, 0.42);
  plate.position.set(0, 0.38, 0.5);
  root.add(plate);
  [-1, 1].forEach((s) => {
    const dimple = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), mat(0x8a5a2a));
    dimple.position.set(s * 0.16, 0.42, 0.66);
    root.add(dimple);
  });

  // Cream barnacles crusting the top/back edge of the carapace.
  for (let i = 0; i < 9; i++) {
    const a = -1.3 + (i / 8) * 2.6;
    const b = barnacle(0.7 + Math.random() * 0.5);
    b.position.set(Math.sin(a) * 0.66, 0.6 + Math.cos(a) * 0.06, -0.2 - Math.cos(a) * 0.2);
    root.add(b);
  }

  // Pink-red branching coral growing as a crown on the top centre of the shell.
  const coral = new THREE.Group();
  coral.position.set(0, 0.72, 0.04);
  [[0, 0.0, 0.0, 0.34], [0.55, -0.12, 0.05, 0.28], [-0.55, 0.12, -0.04, 0.26], [0.28, 0.06, -0.12, 0.24], [-0.3, -0.05, 0.12, 0.22]].forEach(([rz, dx, dz, h]) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.04, h, 7), mat(CORAL, { flatShading: true }));
    branch.position.set(dx, h / 2, dz);
    branch.rotation.z = rz;
    coral.add(branch);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(CORAL_LT, { flatShading: true }));
    bulb.position.set(dx + Math.sin(rz) * h * 0.55, h, dz);
    coral.add(bulb);
    // little side nub for a reef-fan feel
    const nub = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(CORAL, { flatShading: true }));
    nub.position.set(dx + Math.sin(rz) * h * 0.3, h * 0.6, dz);
    coral.add(nub);
  });
  root.add(coral);

  // Eyestalks at the front of the shell.
  root.add(eyestalk(1), eyestalk(-1));

  // Two big pincer claws reaching forward.
  const clawR = claw(1);
  const clawL = claw(-1);
  clawR.group.position.set(0.72, 0.34, 0.28);
  clawL.group.position.set(-0.72, 0.34, 0.28);
  root.add(clawR.group, clawL.group);

  // Idle flourish — gentle breathing + claws slowly open/close.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.4) * 0.014;
    shell.scale.set(1.5, 0.64 * breathe, 1.18);
    const open = 0.18 + Math.sin(time * 1.8) * 0.18;
    clawR.jaw.rotation.x = Math.PI / 2 - open;
    clawL.jaw.rotation.x = Math.PI / 2 - open;
  };

  return root;
}
