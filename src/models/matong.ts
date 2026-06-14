import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Matong — striped marsupial-tiger forest guardian.
// From-scratch low-poly model matching the in-game sprite: bright orange fur
// banded with black tiger stripes, a cream chest/belly, big triangular ears,
// large amber eyes, a dark nose, short arms, a banded tail, and a marsupial
// belly-pouch holding a green fern sprig.
// ---------------------------------------------------------------------------

const FUR = 0xe0731e;
const FUR_DARK = 0xab5012;
const CREAM = 0xf2e6c8;
const STRIPE = '#241a12';
const NOSE = 0x241712;
const AMBER = 0xe89a1c;
const FERN = 0x4f9e3a;
const PINK = 0xd58b82;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.74, metalness: 0.03, ...opts });
}

// Orange fur banded with bold black tiger stripes, for the body/head/tail.
function stripeTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e8761b';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = STRIPE;
  ctx.lineCap = 'round';
  // Bold wavy vertical tiger stripes, alternating thick/thin, wrapping around.
  for (let i = 0; i < 9; i++) {
    const x = 4 + i * 14;
    ctx.lineWidth = i % 2 === 0 ? 11 : 6;
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.bezierCurveTo(x + 9, s * 0.33, x - 9, s * 0.66, x + 5, s + 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Bushy white cheek fluff — a fan of cream whisker-tufts sweeping out from the
// lower face, the distinctive marsupial-tiger detail from the sprite.
function cheekTuft(side: number): THREE.Group {
  const g = new THREE.Group();
  [0.95, 1.3, 1.65].forEach((a) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.17, 6), mat(CREAM, { flatShading: true }));
    spike.rotation.z = -side * a;
    g.add(spike);
  });
  g.position.set(side * 0.16, -0.05, 0.14);
  g.scale.set(1, 1, 0.5);
  return g;
}

// Big triangular ear: orange back, pink inner, dark stripe accent.
function ear(side: number): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 10), mat(FUR_DARK, { flatShading: true }));
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 10), mat(PINK, { flatShading: true }));
  inner.position.z = 0.03;
  g.add(outer, inner);
  g.scale.set(0.8, 1, 0.45);
  g.position.set(side * 0.18, 0.27, -0.02);
  g.rotation.z = side * 0.28;
  g.rotation.x = -0.12;
  return g;
}

// Large amber eye with glossy pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), mat(AMBER, { roughness: 0.22, emissive: 0x3a2200, emissiveIntensity: 0.4 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), mat(0x120b05, { roughness: 0.18 }));
  pupil.position.z = 0.055;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.02, 0.025, 0.09);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.13, 0.05, 0.2);
  g.rotation.y = side * 0.16;
  return g;
}

// Short arm hanging at the side, ending in a small paw.
function arm(side: number): THREE.Group {
  const g = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36, 10), mat(FUR));
  limb.position.y = -0.16;
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), mat(CREAM));
  paw.position.y = -0.34;
  g.add(limb, paw);
  g.position.set(side * 0.34, 0.78, 0.06);
  g.rotation.z = side * 0.34;
  return g;
}

// Stubby leg + splayed foot.
function leg(side: number): THREE.Group {
  const g = new THREE.Group();
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 10), mat(FUR));
  shin.position.y = 0.2;
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), mat(CREAM));
  foot.scale.set(1, 0.5, 1.4);
  foot.position.set(0, 0.04, 0.07);
  g.add(shin, foot);
  g.position.set(side * 0.18, 0, 0.02);
  return g;
}

/** Build the Matong as a THREE.Group standing on y=0, facing +Z. */
export function buildMatong(): THREE.Group {
  const root = new THREE.Group();
  const stripes = stripeTexture();

  // Upright pear-shaped torso — orange striped fur.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 18), mat(0xffffff, { map: stripes }));
  body.scale.set(0.74, 0.98, 0.66);
  body.position.set(0, 0.66, 0);
  root.add(body);

  // Cream chest + belly front.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), mat(CREAM));
  belly.scale.set(0.6, 0.9, 0.52);
  belly.position.set(0, 0.62, 0.16);
  root.add(belly);

  // Marsupial pouch with a fern sprig poking out.
  const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(CREAM, { roughness: 0.85 }));
  pouch.scale.set(1, 0.78, 0.55);
  pouch.position.set(0, 0.44, 0.28);
  root.add(pouch);
  [-0.13, 0, 0.13].forEach((a) => {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32 - Math.abs(a) * 0.6, 6), mat(FERN, { flatShading: true }));
    frond.scale.set(1, 1, 0.35);
    frond.position.set(a, 0.6, 0.33);
    frond.rotation.z = -a * 2.2;
    frond.rotation.x = 0.25;
    root.add(frond);
  });

  // Arms + legs.
  root.add(arm(1), arm(-1));
  root.add(leg(1), leg(-1));

  // Head — striped orange dome with cream muzzle.
  const head = new THREE.Group();
  head.position.set(0, 1.18, 0.05);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 22, 18), mat(0xffffff, { map: stripes }));
  skull.scale.set(1.0, 0.94, 0.96);
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), mat(CREAM));
  muzzle.scale.set(0.86, 0.66, 0.86);
  muzzle.position.set(0, -0.1, 0.17);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), mat(NOSE, { roughness: 0.4 }));
  nose.position.set(0, -0.06, 0.3);
  head.add(nose);
  // Dark tiger stripe marks fanning down the forehead.
  [-0.08, 0, 0.08].forEach((mx) => {
    const mark = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.15, 5), mat(NOSE, { flatShading: true }));
    mark.position.set(mx, 0.17, 0.17);
    mark.rotation.x = 0.55;
    mark.rotation.z = mx * 1.6;
    mark.scale.set(1, 1, 0.35);
    head.add(mark);
  });
  head.add(cheekTuft(1), cheekTuft(-1));
  head.add(ear(1), ear(-1));
  head.add(eye(1), eye(-1));
  root.add(head);

  // Long banded tail sweeping back and up.
  const tail = new THREE.Group();
  const segs = [
    { len: 0.28, r0: 0.09, r1: 0.075, y: 0.0 },
    { len: 0.26, r0: 0.075, r1: 0.055, y: 0.22 },
    { len: 0.24, r0: 0.055, r1: 0.03, y: 0.42 },
  ];
  segs.forEach((s, i) => {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(s.r1, s.r0, s.len, 10), mat(0xffffff, { map: stripes }));
    seg.position.set(0, s.y, -i * 0.04);
    tail.add(seg);
  });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), mat(0x241a12));
  tip.position.set(0, 0.56, -0.1);
  tail.add(tip);
  tail.position.set(0, 0.5, -0.42);
  tail.rotation.x = -0.7;
  root.add(tail);

  // Idle flourish — a gentle tail sway + slow breathing.
  root.userData.idle = (time: number) => {
    tail.rotation.z = Math.sin(time * 1.6) * 0.16;
    const breathe = 1 + Math.sin(time * 2.0) * 0.018;
    body.scale.set(0.74 * breathe, 0.98, 0.66 * breathe);
  };

  return root;
}
