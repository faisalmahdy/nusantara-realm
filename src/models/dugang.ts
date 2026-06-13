import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Dugang — dugong/manatee sea-spirit (gentle reef-dweller).
// From-scratch low-poly model matching the in-game sprite: a plump blue-grey
// body with a lighter belly, a broad whiskered snout with nostrils, big
// pale-blue eyes, side flippers, a tail fluke, a green seaweed necklace with a
// pale scallop-shell pendant, and turquoise water-swirl wisps rising at its sides.
// ---------------------------------------------------------------------------

const BODY = 0x6e8298;
const BELLY = 0xbac7d4;
const EYE = 0x9fcfe0;
const PUPIL = 0x10151a;
const SNOUT = 0x7d91a6;
const SEAWEED = 0x57a046;
const SHELL = 0xdde4ea;
const WATER = 0x78d6e4;
const NOSTRIL = 0x33414e;

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...opts });
}

// Big pale-blue eye with a glossy pupil + catch-light.
function eye(side: number): THREE.Group {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), mat(EYE, { roughness: 0.2, emissive: 0x0c2630, emissiveIntensity: 0.35 }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 12), mat(PUPIL, { roughness: 0.15 }));
  pupil.position.z = 0.045;
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.7 }));
  glint.position.set(side * 0.02, 0.025, 0.08);
  g.add(ball, pupil, glint);
  g.position.set(side * 0.16, 0.12, 0.27);
  g.rotation.y = side * 0.2;
  return g;
}

// Flat paddle flipper hanging at the side.
function flipper(side: number): THREE.Mesh {
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), mat(BODY));
  f.scale.set(0.5, 0.95, 0.32);
  f.position.set(side * 0.42, 0.42, 0.12);
  f.rotation.z = side * 0.5;
  f.rotation.x = 0.3;
  return f;
}

// A rising turquoise water-swirl wisp (a partial torus arc), semi-transparent.
function wisp(side: number): THREE.Mesh {
  const w = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.022, 8, 20, Math.PI * 1.4),
    mat(WATER, { emissive: 0x1d8a9a, emissiveIntensity: 0.7, transparent: true, opacity: 0.7, roughness: 0.3 }),
  );
  w.position.set(side * 0.5, 1.0, 0.0);
  w.rotation.z = side * 0.6;
  w.rotation.y = side * 0.5;
  return w;
}

/** Build the Dugang as a THREE.Group standing on y=0, facing +Z. */
export function buildDugang(): THREE.Group {
  const root = new THREE.Group();

  // Plump blue-grey body.
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 20), mat(BODY));
  body.scale.set(0.92, 0.86, 0.84);
  body.position.set(0, 0.52, 0);
  root.add(body);

  // Lighter belly underlay.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 16), mat(BELLY));
  belly.scale.set(0.7, 0.66, 0.6);
  belly.position.set(0, 0.42, 0.2);
  root.add(belly);

  // Head blends up-front from the body.
  const head = new THREE.Group();
  head.position.set(0, 0.74, 0.06);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 18), mat(BODY));
  skull.scale.set(0.96, 0.9, 0.96);
  head.add(skull);

  // Broad whiskered snout with two nostrils.
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), mat(SNOUT));
  snout.scale.set(0.96, 0.7, 0.8);
  snout.position.set(0, -0.06, 0.24);
  head.add(snout);
  [-0.06, 0.06].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), mat(NOSTRIL, { roughness: 0.5 }));
    nostril.position.set(nx, 0.0, 0.41);
    head.add(nostril);
  });
  // Whisker stubble — tiny dots flanking the snout.
  [-1, 1].forEach((s) => {
    [-0.04, 0.0, 0.04].forEach((dy) => {
      const wd = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), mat(0x4a5663));
      wd.position.set(s * 0.13, -0.06 + dy, 0.34);
      head.add(wd);
    });
  });
  head.add(eye(1), eye(-1));
  root.add(head);

  // Side flippers + tail fluke.
  root.add(flipper(1), flipper(-1));
  const fluke = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), mat(BODY));
  fluke.scale.set(1.5, 0.28, 0.6);
  fluke.position.set(0, 0.32, -0.46);
  fluke.rotation.x = 0.5;
  root.add(fluke);

  // Seaweed necklace — green beads draped across the front of the chest,
  // sitting proud of the body surface and dipping in the middle.
  for (let i = 0; i <= 11; i++) {
    const a = -1.35 + (i / 11) * 2.7; // sweep across the front only
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), mat(SEAWEED, { roughness: 0.55 }));
    bead.position.set(Math.sin(a) * 0.46, 0.66 - Math.cos(a) * 0.08, Math.cos(a) * 0.44);
    root.add(bead);
  }
  // Pale scallop-shell pendant hanging at the centre of the necklace.
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat(SHELL, { roughness: 0.4, flatShading: true }));
  shell.scale.set(1.1, 0.95, 0.4);
  shell.position.set(0, 0.5, 0.47);
  root.add(shell);

  // Turquoise water-swirl wisps (kept referenced for the idle sway).
  const wispR = wisp(1);
  const wispL = wisp(-1);
  root.add(wispR, wispL);

  // Idle flourish — slow breathing + the water wisps rise and sway.
  root.userData.idle = (time: number) => {
    const breathe = 1 + Math.sin(time * 1.6) * 0.02;
    body.scale.set(0.92 * breathe, 0.86, 0.84 * breathe);
    wispR.rotation.z = 0.6 + Math.sin(time * 1.2) * 0.35;
    wispL.rotation.z = -0.6 - Math.sin(time * 1.2 + 0.6) * 0.35;
    wispR.position.y = 1.0 + Math.sin(time * 1.4) * 0.05;
    wispL.position.y = 1.0 + Math.sin(time * 1.4 + 0.8) * 0.05;
  };

  return root;
}
