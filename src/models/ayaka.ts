import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Ayaka — a rare dancing flame-spirit (Spirit element). From-scratch low-poly
// model matching the in-game sprite: a fluffy golden ram-bird with big curling
// ram horns, a flickering flame crest, large amber eyes, a small muzzle, fluffy
// cheeks, red batik flame-swirl markings on a golden body, a dramatic phoenix-
// like flame tail-plume sweeping up at the back, and two orange talon legs.
// ---------------------------------------------------------------------------

const BODY = 0xf0a23a;
const BODY_LT = 0xfcd9a0;
const SWIRL = 0xc23418;
const FLAME_RED = 0xd83b1e;
const FLAME_ORG = 0xf4791f;
const FLAME_YEL = 0xfbc638;
const HORN = 0xe2cfa6;
const HORN_DK = 0xc4ab78;
const EYE_AMBER = 0xb5650f;
const PUPIL = 0x140d06;
const NOSE = 0xb85f3a;
const TALON = 0xe88a2a;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02, ...opts });
}

// Golden fluff with red flame-swirl batik curls on the flanks.
function swirlTexture(): THREE.Texture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f0a23a';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#c23418';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const swirls = [[60, 170], [196, 150], [120, 100]];
  swirls.forEach(([cx, cy]) => {
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const r = 10 + k * 11;
      ctx.arc(cx + k * 5, cy, r, Math.PI * 0.1, Math.PI * 1.8);
      ctx.stroke();
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Big sparkly amber eye.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), mat(EYE_AMBER, { roughness: 0.18, emissive: EYE_AMBER, emissiveIntensity: 0.1 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.02, 0.028, 0.08);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.14, 0.04, 0.31);
  g.rotation.y = side * 0.16;
  return g;
}

// A curling ram horn — a ridged partial torus sweeping back and curling forward
// toward the cheek.
function horn(side: number): THREE.Group {
  const g = new THREE.Group();
  const curl = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.045, 10, 22, Math.PI * 1.55),
    mat(HORN, { flatShading: true, roughness: 0.6 }),
  );
  // A few darker ridge rings along the horn for a ram-horn texture.
  for (let k = 0; k < 3; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.052, 6, 16, 0.5), mat(HORN_DK, { flatShading: true }));
    ring.rotation.z = -0.3 - k * 0.5;
    curl.add(ring);
  }
  g.add(curl);
  g.position.set(side * 0.26, 0.2, -0.02);
  g.rotation.y = side * -0.5;
  g.rotation.z = side * 0.4;
  g.rotation.x = -0.3;
  return g;
}

// A single flame tongue (flattened pointed cone).
function flame(color: number, len: number, wid: number): THREE.Mesh {
  const f = new THREE.Mesh(new THREE.ConeGeometry(wid, len, 7), mat(color, { flatShading: true, emissive: color, emissiveIntensity: 0.22 }));
  f.scale.set(1, 1, 0.4);
  return f;
}

// A fan of flame tongues (used for the head crest and the tail-plume). Returns
// the group so the idle can flicker/sway it.
function flameFan(specs: Array<[number, number, number, number]>): THREE.Group {
  // each spec: [len, wid, color, tilt]
  const g = new THREE.Group();
  specs.forEach(([len, wid, color, tilt]) => {
    const holder = new THREE.Group();
    const f = flame(color, len, wid);
    f.position.y = len * 0.45;
    holder.add(f);
    holder.rotation.x = tilt;
    g.add(holder);
  });
  return g;
}

// Fluffy bird leg ending in a little orange talon.
function leg(side: number): THREE.Group {
  const g = new THREE.Group();
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.26, 8), mat(TALON, { roughness: 0.55 }));
  shin.position.y = 0.15;
  const foot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(TALON, { roughness: 0.55 }));
  foot.scale.set(1.1, 0.5, 1.5);
  foot.position.set(0, 0.03, 0.04);
  // three little front toes
  [-0.05, 0, 0.05].forEach((tx) => {
    const toe = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.1, 6), mat(TALON));
    toe.rotation.x = Math.PI / 2;
    toe.position.set(tx, 0.02, 0.12);
    g.add(toe);
  });
  g.add(shin, foot);
  g.position.set(side * 0.12, 0, 0.06);
  return g;
}

/** Build the Ayaka as a THREE.Group standing on y=0, facing +Z. */
export function buildAyaka(): THREE.Group {
  const root = new THREE.Group();
  const tex = swirlTexture();

  // Legs.
  root.add(leg(-1), leg(1));

  // Plump fluffy golden body sitting upright (bird-like) with swirl markings.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), mat(0xffffff, { map: tex }));
  body.scale.set(0.92, 1.12, 0.9);
  body.position.set(0, 0.62, 0);
  root.add(body);

  // Cream belly patch.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), mat(BODY_LT));
  belly.scale.set(0.8, 1.0, 0.55);
  belly.position.set(0, 0.55, 0.24);
  root.add(belly);

  // Ruffled feathery skirt — a ring of downward fluff tufts round the lower body.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 6), mat(BODY, { flatShading: true }));
    tuft.position.set(Math.cos(a) * 0.42, 0.36, Math.sin(a) * 0.4);
    tuft.rotation.z = Math.cos(a) * 0.5;
    tuft.rotation.x = -Math.sin(a) * 0.5 + Math.PI;
    root.add(tuft);
  }

  // Head.
  const head = new THREE.Group();
  head.position.set(0, 1.12, 0.06);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 18), mat(BODY));
  skull.scale.set(1, 0.96, 0.96);
  head.add(skull);

  // Small muzzle + nose.
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), mat(BODY_LT));
  muzzle.scale.set(1, 0.8, 0.9);
  muzzle.position.set(0, -0.12, 0.27);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), mat(NOSE, { roughness: 0.5 }));
  nose.position.set(0, -0.08, 0.36);
  head.add(nose);

  // Fluffy cheeks.
  [-1, 1].forEach((s) => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat(BODY, { flatShading: true }));
    cheek.scale.set(1, 0.9, 0.7);
    cheek.position.set(s * 0.24, -0.06, 0.16);
    head.add(cheek);
  });

  // Eyes + curling ram horns.
  head.add(eye(-1), eye(1));
  head.add(horn(-1), horn(1));

  // Flickering flame crest on top of the head.
  const crest = flameFan([
    [0.34, 0.07, FLAME_YEL, 0.0],
    [0.42, 0.08, FLAME_ORG, -0.18],
    [0.5, 0.09, FLAME_RED, 0.0],
    [0.42, 0.08, FLAME_ORG, 0.18],
    [0.32, 0.07, FLAME_YEL, 0.35],
  ]);
  crest.position.set(0, 0.3, -0.02);
  head.add(crest);
  root.add(head);

  // Dramatic phoenix-like flame tail-plume sweeping up and back.
  const tail = flameFan([
    [0.72, 0.13, FLAME_RED, 0.0],
    [0.66, 0.12, SWIRL, -0.22],
    [0.78, 0.14, FLAME_ORG, 0.22],
    [0.6, 0.11, FLAME_YEL, -0.42],
    [0.66, 0.12, FLAME_ORG, 0.45],
    [0.5, 0.1, FLAME_YEL, 0.7],
  ]);
  tail.position.set(0, 0.7, -0.4);
  tail.rotation.x = -0.55;
  root.add(tail);

  // Idle flourish — a dancing spirit: gentle side-sway + breathing, flame crest
  // flicker, and tail-plume sway.
  root.userData.idle = (time: number) => {
    root.rotation.z = Math.sin(time * 1.6) * 0.05;
    const breathe = 1 + Math.sin(time * 1.8) * 0.02;
    body.scale.set(0.92 * breathe, 1.12, 0.9);
    const flick = 1 + Math.sin(time * 7) * 0.08;
    crest.scale.set(1, flick, 1);
    crest.rotation.z = Math.sin(time * 5) * 0.05;
    tail.rotation.z = Math.sin(time * 2.2) * 0.1;
  };

  return root;
}
