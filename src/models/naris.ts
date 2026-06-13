import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Naris — a rare storm-touched flyer (Sky element). From-scratch low-poly model
// matching the in-game sprite: a chibi coiled naga (dragon-serpent) with an
// olive-green banded body coiled on the ground, a cream scaled belly, a frilled
// dragon head with big green eyes and a snout, a golden storm-smoke wisp curling
// up from its crown, two little clawed arms resting on the coil, and a tapering
// tail curling up at the back.
// ---------------------------------------------------------------------------

const SCALE_GR = 0x8f9a4e;
const SCALE_DK = 0x5f6b38;
const FRILL = 0x6b7540;
const BELLY = 0xddc986;
const EYE_GR = 0x6fbf6a;
const PUPIL = 0x14130a;
const SMOKE = 0xd9b24a;
const CLAW = 0xe6d8a6;
const NOSTRIL = 0x4a4326;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.04, ...opts });
}

// Olive scales banded with red-brown chevron stripes for the coiled body.
function bandTexture(): THREE.Texture {
  const w = 256, h = 128;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8f9a4e';
  ctx.fillRect(0, 0, w, h);
  // Repeating red-brown bands with dark borders, wrapping the coil.
  for (let x = 0; x < w; x += 52) {
    ctx.fillStyle = '#3a3320';
    ctx.fillRect(x, 0, 30, h);
    ctx.fillStyle = '#9e3b2a';
    ctx.fillRect(x + 5, 0, 20, h);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Big bright green eye with a slit-ish dark pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), mat(EYE_GR, { roughness: 0.16, emissive: EYE_GR, emissiveIntensity: 0.12 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.scale.set(0.6, 1.1, 1);
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.02, 0.025, 0.075);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.15, 0.04, 0.2);
  g.rotation.y = side * 0.3;
  return g;
}

// A golden storm-smoke wisp: a few alternating partial-torus arcs curling up.
function smokeWisp(): THREE.Group {
  const g = new THREE.Group();
  const arcs: Array<[number, number, number]> = [
    [0.09, 0.0, 1],
    [0.07, 0.13, -1],
    [0.05, 0.24, 1],
    [0.035, 0.33, -1],
  ];
  arcs.forEach(([r, y, dir]) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.022, 8, 14, Math.PI * 1.2),
      mat(SMOKE, { emissive: SMOKE, emissiveIntensity: 0.2, roughness: 0.5 }),
    );
    arc.position.y = y;
    arc.rotation.z = dir * 0.6;
    g.add(arc);
  });
  return g;
}

// Little clawed front arm resting forward on the coil.
function arm(side: number): THREE.Group {
  const g = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.2, 8), mat(SCALE_GR));
  limb.rotation.x = 0.9;
  limb.position.set(0, 0.0, 0.08);
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(SCALE_GR));
  paw.position.set(0, -0.08, 0.18);
  [-0.04, 0, 0.04].forEach((cx) => {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.06, 6), mat(CLAW));
    claw.rotation.x = Math.PI / 2;
    claw.position.set(cx, -0.09, 0.24);
    g.add(claw);
  });
  g.add(limb, paw);
  g.position.set(side * 0.2, 0.42, 0.4);
  return g;
}

/** Build the Naris as a THREE.Group standing on y=0, facing +Z. */
export function buildNaris(): THREE.Group {
  const root = new THREE.Group();
  const tex = bandTexture();
  tex.repeat.set(5, 1);

  // Coiled body — a fat banded torus resting on the ground, plus a smaller
  // upper coil set back to suggest a spiral stack.
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.22, 16, 32), mat(0xffffff, { map: tex }));
  coil.rotation.x = Math.PI / 2;
  coil.position.set(0, 0.24, 0);
  root.add(coil);
  const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.2, 16, 28), mat(0xffffff, { map: tex }));
  coil2.rotation.x = Math.PI / 2;
  coil2.position.set(0, 0.42, -0.18);
  root.add(coil2);

  // Cream belly plates stacked up the front of the coil/torso.
  for (let i = 0; i < 5; i++) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.13 - i * 0.012, 0.13 - i * 0.012, 0.04, 14), mat(BELLY, { roughness: 0.6 }));
    plate.rotation.x = Math.PI / 2;
    plate.scale.set(1, 1, 0.5);
    plate.position.set(0, 0.34 + i * 0.13, 0.46 - i * 0.03);
    root.add(plate);
  }

  // Upright tapering torso rising from the front of the coil to the head.
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, 0.62, 14), mat(SCALE_GR));
  torso.position.set(0, 0.7, 0.4);
  torso.rotation.x = 0.18;
  root.add(torso);

  // Little clawed arms.
  root.add(arm(-1), arm(1));

  // Head.
  const head = new THREE.Group();
  head.position.set(0, 1.04, 0.34);
  head.rotation.x = 0.1;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), mat(SCALE_GR));
  skull.scale.set(1, 0.92, 1.08);
  head.add(skull);

  // Snout.
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 14), mat(SCALE_GR));
  snout.scale.set(0.85, 0.7, 1.1);
  snout.position.set(0, -0.08, 0.2);
  head.add(snout);
  [-0.05, 0.05].forEach((nx) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat(NOSTRIL, { roughness: 0.5 }));
    n.position.set(nx, -0.05, 0.34);
    head.add(n);
  });

  // Golden cheek/brow scale patches.
  [-1, 1].forEach((s) => {
    const brow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(BELLY, { flatShading: true }));
    brow.scale.set(1, 0.6, 1);
    brow.position.set(s * 0.13, 0.13, 0.12);
    head.add(brow);
  });

  // Eyes.
  head.add(eye(-1), eye(1));

  // Spiky frill of scales fanning back/around the head.
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI - Math.PI / 2; // -90deg .. +90deg around the back
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.2, 6), mat(FRILL, { flatShading: true }));
    spike.scale.set(1, 1, 0.5);
    spike.position.set(Math.sin(a) * 0.26, 0.06, -Math.cos(a) * 0.22 - 0.02);
    spike.rotation.x = -0.6;
    spike.rotation.z = -Math.sin(a) * 0.8;
    head.add(spike);
  }

  // Storm-smoke wisp curling up from the crown.
  const wisp = smokeWisp();
  wisp.position.set(0, 0.24, -0.02);
  head.add(wisp);
  root.add(head);

  // Tapering tail curling up at the back, ending in a little tuft.
  const tail = new THREE.Group();
  const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.13, 0.5, 10), mat(SCALE_DK));
  seg.position.y = 0.2;
  seg.rotation.x = -0.5;
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 6), mat(SMOKE, { flatShading: true }));
  tuft.position.set(0, 0.42, -0.16);
  tail.add(seg, tuft);
  tail.position.set(0.18, 0.4, -0.5);
  tail.rotation.z = -0.3;
  root.add(tail);

  // Idle flourish — gentle breathing, the smoke wisp curls/sways, the head sways
  // softly, and the tail-tip drifts (storm-touched serpent).
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.6) * 0.02;
    coil.scale.set(breathe, breathe, 1);
    head.rotation.z = Math.sin(time * 1.4) * 0.06;
    wisp.rotation.y = time * 0.8;
    wisp.children.forEach((c, i) => { c.rotation.z = (i % 2 ? -1 : 1) * (0.6 + Math.sin(time * 3 + i) * 0.2); });
    tail.rotation.z = -0.3 + Math.sin(time * 1.8) * 0.12;
  };

  return root;
}
