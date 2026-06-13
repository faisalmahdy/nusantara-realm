import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Babur — winged cloud-piglet (Earth element, but a gentle sky-touched pig).
// From-scratch low-poly model matching the in-game sprite: a plump cream pig
// with soft blue cloud-swirl flank markings, big heterochromia eyes (one amber,
// one blue), a pink snout + nostrils, floppy pink ears, rosy cheeks, little
// hooves, a curly tail, and a pair of feathered slate-blue wings on its back.
// ---------------------------------------------------------------------------

const BODY = 0xf6ede4;
const PINK = 0xef9fa1;
const PINK_DK = 0xd97f86;
const SNOUT = 0xec9499;
const NOSTRIL = 0xb85f68;
const HOOF = 0xc7b29a;
const EYE_AMBER = 0xc8841f;
const EYE_BLUE = 0x3f9bd0;
const PUPIL = 0x14100c;
const WING_DK = 0x6f8bb0;
const WING_MD = 0x9db8d8;
const WING_LT = 0xc8d8ea;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02, ...opts });
}

// Cream body texture with a few soft blue cloud-swirl markings on the flanks.
function cloudTexture(): THREE.Texture {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f6ede4';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#a9c2e0';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // A few curling cloud swirls placed around the wrap.
  const swirls = [[60, 150], [180, 120], [120, 190]];
  swirls.forEach(([cx, cy]) => {
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      const r = 14 + k * 12;
      ctx.arc(cx + k * 6, cy, r, Math.PI * 0.2, Math.PI * 1.7);
      ctx.stroke();
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Big sparkly eye (color varies for the heterochromia).
function eye(side: number, color: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 16), mat(color, { roughness: 0.16, emissive: color, emissiveIntensity: 0.12 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.position.z = 0.05;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.025, 0.03, 0.09);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.16, 0.05, 0.33);
  g.rotation.y = side * 0.18;
  return g;
}

// Floppy pink ear (outer + inner), drooping forward.
function ear(side: number): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 8), mat(BODY, { flatShading: true }));
  outer.scale.set(1, 1, 0.45);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 8), mat(PINK_DK, { flatShading: true }));
  inner.scale.set(1, 1, 0.4);
  inner.position.z = 0.03;
  g.add(outer, inner);
  g.position.set(side * 0.24, 0.28, 0.06);
  g.rotation.z = side * 0.5;
  g.rotation.x = 0.5;
  return g;
}

// Short cream leg ending in a little hoof.
function leg(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.28, 10), mat(BODY));
  limb.position.y = 0.16;
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.08, 10), mat(HOOF, { roughness: 0.5 }));
  hoof.position.y = 0.04;
  g.add(limb, hoof);
  g.position.set(x, 0, z);
  return g;
}

// A single feather — a broad, gently flattened plume so the wing reads as a
// soft feathered fan (not a thin spike) from the front and 3/4 angles too.
function feather(color: number, len: number, wid: number): THREE.Mesh {
  const f = new THREE.Mesh(new THREE.ConeGeometry(wid, len, 7), mat(color, { flatShading: true }));
  f.scale.set(1.4, 1, 0.55);
  return f;
}

// A feathered wing — a broad fan of slate-to-light feathers sweeping up and
// back from the shoulder, tilted outward to the side. Returns the group so the
// idle can flap it from its root.
function wing(side: number): THREE.Group {
  const g = new THREE.Group();
  // [length, color, width] from the long rear feathers to the short front ones.
  const specs: Array<[number, number, number]> = [
    [0.78, WING_DK, 0.15],
    [0.74, WING_DK, 0.15],
    [0.66, WING_MD, 0.145],
    [0.56, WING_MD, 0.14],
    [0.46, WING_LT, 0.13],
    [0.38, WING_LT, 0.12],
  ];
  specs.forEach(([len, color, wid], i) => {
    const holder = new THREE.Group();
    const f = feather(color, len, wid);
    f.position.y = len * 0.45;
    holder.add(f);
    // Fan the feathers in the vertical plane (front upright, rear swept back)
    // and splay them outward so the wing reads as a broad fan from the front.
    holder.rotation.x = -0.1 + i * 0.3;
    holder.rotation.z = side * (0.05 + i * 0.05);
    g.add(holder);
  });
  g.position.set(side * 0.34, 0.74, 0.0);
  g.rotation.z = side * 0.55;
  g.rotation.y = side * 0.28;
  return g;
}

/** Build the Babur as a THREE.Group standing on y=0, facing +Z. */
export function buildBabur(): THREE.Group {
  const root = new THREE.Group();
  const tex = cloudTexture();

  // Legs.
  root.add(leg(0.26, 0.34), leg(-0.26, 0.34), leg(0.26, -0.3), leg(-0.26, -0.3));

  // Plump body with cloud-swirl markings.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), mat(0xffffff, { map: tex }));
  body.scale.set(1.12, 0.96, 1.32);
  body.position.set(0, 0.62, -0.02);
  root.add(body);

  // Head.
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0.6);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.4, 22, 18), mat(BODY));
  skull.scale.set(1, 0.96, 0.94);
  head.add(skull);

  // Pink snout disc with two nostrils.
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.12, 14), mat(SNOUT));
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, 0.4);
  head.add(snout);
  [-0.06, 0.06].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mat(NOSTRIL, { roughness: 0.5 }));
    nostril.scale.set(1, 1.3, 0.6);
    nostril.position.set(nx, -0.04, 0.47);
    head.add(nostril);
  });

  // Rosy cheek blush.
  [-1, 1].forEach((s) => {
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(PINK, { roughness: 0.6 }));
    blush.scale.set(1.1, 0.7, 0.25);
    blush.position.set(s * 0.27, -0.04, 0.28);
    head.add(blush);
  });

  // Heterochromia eyes (left amber, right blue) + floppy ears.
  head.add(eye(-1, EYE_AMBER), eye(1, EYE_BLUE));
  head.add(ear(1), ear(-1));
  root.add(head);

  // Curly tail at the rump.
  const tail = new THREE.Group();
  const curl = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 8, 18, Math.PI * 1.8), mat(BODY, { flatShading: true }));
  curl.rotation.y = Math.PI / 2;
  tail.add(curl);
  tail.position.set(0.04, 0.7, -0.66);
  tail.rotation.z = 0.5;
  root.add(tail);

  // Feathered wings on the back.
  const wingR = wing(1);
  const wingL = wing(-1);
  root.add(wingR, wingL);

  // Idle flourish — breathing + gentle wing-flap + tail wiggle.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.5) * 0.018;
    body.scale.set(1.12 * breathe, 0.96, 1.32);
    const flap = Math.sin(time * 2.6) * 0.2;
    wingR.rotation.z = 0.5 + flap;
    wingL.rotation.z = -0.5 - flap;
    tail.rotation.z = 0.5 + Math.sin(time * 2.0) * 0.2;
  };

  return root;
}
