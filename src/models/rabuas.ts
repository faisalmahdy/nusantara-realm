import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Rabuas — a brambled, fierce forest beast (Forest element). From-scratch low-
// poly model matching the in-game sprite: a Rafflesia corpse-flower monster — a
// big red bloom of five cream-spotted petals ruffing a toothy green toad-face
// with big amber eyes, sat on a warty green body with stubby vine legs ending
// in bulbous leaf-pod feet, plus a couple of curling vine tendrils.
// ---------------------------------------------------------------------------

const FACE = 0x6f8f3e;
const FACE_DK = 0x4e6b2c;
const WART = 0x8fae54;
const BODY = 0x5f7d35;
const EYE_AMBER = 0xd87a1f;
const PUPIL = 0x140d05;
const FANG = 0xf0ead2;
const MOUTH = 0x40160f;
const POD = 0x7aa048;
const VINE = 0x5a7a30;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.74, metalness: 0.02, ...opts });
}

// Deep red petal skin freckled with cream Rafflesia spots.
function petalTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#b5362a';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#ead9a6';
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 4 + Math.random() * 7;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Big amber eye with a dark pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), mat(EYE_AMBER, { roughness: 0.18, emissive: EYE_AMBER, emissiveIntensity: 0.12 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), mat(PUPIL, { roughness: 0.12 }));
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }));
  glint.position.set(side * 0.02, 0.025, 0.075);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.11, 0.06, 0.2);
  g.rotation.y = side * 0.18;
  return g;
}

// Stubby vine leg ending in a bulbous leaf-pod foot.
function leg(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 8), mat(VINE, { flatShading: true }));
  vine.position.y = 0.1;
  const pod = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(POD, { flatShading: true }));
  pod.scale.set(1.2, 0.8, 1.4);
  pod.position.y = 0.02;
  // two little leaf tips off the pod
  [-1, 1].forEach((s) => {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), mat(POD, { flatShading: true }));
    leaf.scale.set(1, 1, 0.4);
    leaf.position.set(s * 0.1, 0.04, 0.08);
    leaf.rotation.z = s * 0.7;
    g.add(leaf);
  });
  g.add(vine, pod);
  g.position.set(x, 0, z);
  return g;
}

/** Build the Rabuas as a THREE.Group standing on y=0, facing +Z. */
export function buildRabuas(): THREE.Group {
  const root = new THREE.Group();
  const tex = petalTexture();

  // Legs.
  root.add(leg(0.24, 0.22), leg(-0.24, 0.22), leg(0.22, -0.2), leg(-0.22, -0.2));

  // Warty green body.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 18), mat(BODY));
  body.scale.set(1.05, 0.9, 1.0);
  body.position.set(0, 0.46, 0);
  root.add(body);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const yy = 0.4 + (i % 3) * 0.12;
    const rr = 0.42 + (i % 2) * 0.02;
    const wart = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.012, 8, 6), mat(WART, { flatShading: true }));
    wart.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr * 0.95 + 0.05);
    root.add(wart);
  }

  // Rafflesia bloom — five cream-spotted red petals ruffing the face. Built in
  // its own group facing +Z, tilted up slightly toward the viewer.
  const bloom = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const theta = (i / 5) * Math.PI * 2;
    const holder = new THREE.Group();
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), mat(0xffffff, { map: tex }));
    petal.scale.set(0.42, 0.3, 0.07);
    petal.position.set(0.4, 0, 0);
    holder.add(petal);
    holder.rotation.z = theta;
    // cup the petals gently forward
    holder.rotation.y = -0.18;
    bloom.add(holder);
  }
  bloom.position.set(0, 0.92, 0.12);
  bloom.rotation.x = -0.18;
  root.add(bloom);

  // Toothy green toad-face in the centre of the bloom.
  const face = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), mat(FACE));
  skull.scale.set(1.1, 0.95, 0.9);
  face.add(skull);
  // Brow ridge.
  const brow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(FACE_DK, { flatShading: true }));
  brow.scale.set(1.05, 0.5, 0.9);
  brow.position.set(0, 0.1, 0.05);
  face.add(brow);
  // Eyes.
  face.add(eye(-1), eye(1));
  // Nostrils.
  [-0.04, 0.04].forEach((nx) => {
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), mat(FACE_DK, { roughness: 0.5 }));
    n.position.set(nx, -0.05, 0.24);
    face.add(n);
  });
  // Wide toothy grin: a dark mouth with cream fangs.
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat(MOUTH, { roughness: 0.5 }));
  mouth.scale.set(1.2, 0.5, 0.4);
  mouth.position.set(0, -0.12, 0.2);
  face.add(mouth);
  for (let i = 0; i < 4; i++) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 6), mat(FANG, { flatShading: true }));
    fang.position.set(-0.09 + i * 0.06, -0.09 - (i % 2) * 0.02, 0.27);
    fang.rotation.x = Math.PI;
    face.add(fang);
  }
  face.position.set(0, 0.92, 0.26);
  face.rotation.x = -0.12;
  root.add(face);

  // A couple of curling vine tendrils off the body.
  const tendrils: THREE.Mesh[] = [];
  [[-1, 0.35], [1, 0.3]].forEach(([s, y]) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 16, Math.PI * 1.4), mat(VINE, { flatShading: true }));
    t.position.set(s * 0.42, y, 0.1);
    t.rotation.set(0.4, s * 0.8, s * 0.5);
    tendrils.push(t);
    root.add(t);
  });

  // Idle flourish — body breathes, the bloom petals flex/breathe, the face bobs
  // softly, and the vine tendrils sway.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.7) * 0.022;
    body.scale.set(1.05 * breathe, 0.9, 1.0);
    bloom.scale.setScalar(1 + Math.sin(time * 1.9) * 0.03);
    bloom.rotation.z = Math.sin(time * 1.2) * 0.04;
    face.position.y = 0.92 + Math.sin(time * 1.7) * 0.01;
    tendrils.forEach((t, i) => { t.rotation.z = (i ? 1 : -1) * (0.5 + Math.sin(time * 1.5 + i) * 0.18); });
  };

  return root;
}
