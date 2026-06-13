import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Watua — a patient highland stone/root-spirit (Earth element). From-scratch
// low-poly model matching the in-game sprite: a stout gnarled bark trunk with a
// furrowed wood-grain face, big amber eyes under a heavy brow, a hanging beard
// of root tendrils, stubby gnarled root arms and feet, mossy accents, and a
// bushy leaf canopy crowning the head with willow-like drooping strands.
// ---------------------------------------------------------------------------

const BARK = 0x6e5234;
const BARK_LT = 0x8a6a44;
const BARK_DK = 0x3e2e1a;
const LEAF = 0x5a9540;
const LEAF_DK = 0x3a6b2c;
const LEAF_LT = 0x7bb84e;
const MOSS = 0x7a9a45;
const EYE_AMBER = 0xceaa2e;
const PUPIL = 0x140f06;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts });
}

// Vertical wood-grain bark for the trunk.
function woodTexture(): THREE.Texture {
  const w = 128, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6e5234';
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    ctx.strokeStyle = i % 2 ? '#5a4228' : '#8a6a44';
    const x = (i / 16) * w + 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= h; y += 24) ctx.lineTo(x + Math.sin(y * 0.06 + i) * 5, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Big amber eye sunk under the brow, with a dark pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), mat(EYE_AMBER, { roughness: 0.22, emissive: EYE_AMBER, emissiveIntensity: 0.1 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.position.z = 0.05;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.025, 0.03, 0.09);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.15, 0.74, 0.3);
  g.rotation.y = side * 0.2;
  return g;
}

// A clump of leaves (flat-shaded spheres in mixed greens).
function leafClump(x: number, y: number, z: number, scale: number): THREE.Mesh {
  const cols = [LEAF, LEAF_DK, LEAF_LT];
  const m = new THREE.Mesh(
    new THREE.IcosahedronGeometry(scale, 0),
    mat(cols[Math.floor(Math.random() * cols.length)], { flatShading: true }),
  );
  m.position.set(x, y, z);
  m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  return m;
}

// A stubby gnarled root limb (tapered, slightly bent) with little root fingers.
function rootLimb(len: number, rad: number): THREE.Group {
  const g = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.6, rad, len, 8), mat(BARK, { flatShading: true }));
  limb.position.y = -len / 2;
  g.add(limb);
  for (let i = 0; i < 3; i++) {
    const finger = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.4, len * 0.5, 6), mat(BARK_LT, { flatShading: true }));
    finger.position.set((i - 1) * rad * 0.7, -len - len * 0.18, 0.02);
    finger.rotation.x = Math.PI;
    finger.rotation.z = (i - 1) * 0.3;
    g.add(finger);
  }
  return g;
}

/** Build the Watua as a THREE.Group standing on y=0, facing +Z. */
export function buildWatua(): THREE.Group {
  const root = new THREE.Group();
  const tex = woodTexture();

  // Root feet splaying at the base.
  [-1, 1].forEach((s) => {
    const foot = rootLimb(0.22, 0.13);
    foot.position.set(s * 0.22, 0.24, 0.12);
    foot.rotation.x = 0.5;
    foot.rotation.z = s * 0.2;
    root.add(foot);
  });

  // Stout gnarled bark trunk (body + head merged), wider at the base.
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 1.04, 16), mat(0xffffff, { map: tex }));
  trunk.position.y = 0.6;
  root.add(trunk);
  // A couple of bark ridges down the front for gnarl.
  [-0.16, 0.0, 0.16].forEach((rx, i) => {
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.85, 8), mat(BARK_DK, { flatShading: true }));
    ridge.scale.set(1, 1, 0.5);
    ridge.position.set(rx, 0.5, 0.34 + (i === 1 ? 0.03 : 0));
    root.add(ridge);
  });

  // Heavy brow ridge over the eyes.
  const brow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI), mat(BARK_LT, { flatShading: true }));
  brow.rotation.z = Math.PI;
  brow.scale.set(1.05, 0.7, 0.6);
  brow.position.set(0, 0.86, 0.32);
  root.add(brow);

  // Eyes.
  root.add(eye(-1), eye(1));

  // Bark nose bump.
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(BARK_LT, { flatShading: true }));
  nose.scale.set(0.8, 1.3, 0.8);
  nose.position.set(0, 0.62, 0.42);
  root.add(nose);

  // Beard of hanging root tendrils below the face.
  const beard = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const t = (i - 3) / 3;
    const len = 0.3 - Math.abs(t) * 0.1;
    const tendril = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, len, 6), mat(BARK, { flatShading: true }));
    tendril.position.set(t * 0.22, 0.46 - len / 2, 0.4 - Math.abs(t) * 0.06);
    tendril.rotation.z = t * 0.25;
    beard.add(tendril);
  }
  root.add(beard);

  // Stubby gnarled root arms from the sides.
  [-1, 1].forEach((s) => {
    const arm = rootLimb(0.28, 0.1);
    arm.position.set(s * 0.46, 0.62, 0.16);
    arm.rotation.z = s * 1.0;
    arm.rotation.x = 0.3;
    root.add(arm);
  });

  // Moss patches on the bark.
  [[0.2, 0.34, 0.36], [-0.26, 0.5, 0.3], [0.0, 0.28, 0.42]].forEach(([mx, my, mz]) => {
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(MOSS, { flatShading: true }));
    moss.scale.set(1.3, 0.5, 0.6);
    moss.position.set(mx, my, mz);
    root.add(moss);
  });

  // Bushy leaf canopy crowning the head.
  const canopy = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 0.18 + Math.random() * 0.22;
    canopy.add(leafClump(Math.cos(a) * r, 0.05 + Math.random() * 0.18, Math.sin(a) * r - 0.02, 0.13 + Math.random() * 0.07));
  }
  // A few central top leaves.
  canopy.add(leafClump(0, 0.24, 0, 0.16), leafClump(0.08, 0.18, 0.06, 0.14));
  // Willow-like drooping strands down the sides.
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 2; i++) {
      const strand = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.34, 6), mat(LEAF_DK, { flatShading: true }));
      strand.scale.set(1, 1, 0.5);
      strand.position.set(s * (0.34 + i * 0.06), -0.16, 0.18 - i * 0.12);
      strand.rotation.x = Math.PI;
      canopy.add(strand);
    }
  });
  canopy.position.set(0, 1.12, 0);
  root.add(canopy);

  // Idle flourish — a patient tree-spirit: very slow breathing/sway, leaf canopy
  // rustles gently, and the beard tendrils drift.
  root.userData.idle = (time: number) => {
    const sway = Math.sin(time * 0.8) * 0.025;
    root.rotation.z = sway;
    canopy.rotation.z = -sway * 2 + Math.sin(time * 1.1) * 0.03;
    canopy.scale.setScalar(1 + Math.sin(time * 1.3) * 0.015);
    beard.rotation.z = Math.sin(time * 0.9) * 0.05;
  };

  return root;
}
