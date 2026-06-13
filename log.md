# Log — Nusantara Realm

## 2026-06-13 — Gambang 3D model (6th monster ported)
- Built `src/models/gambang.ts` (flower-spirit bird) from the in-game sprite (no
  ref sheet): a chibi bird whose plump body is a layered bloom of coral/peach
  petals (four overlapping rings of flattened spheres, lower rows splayed out),
  a petal ruff radiating around the face, a crown of upright petals topped by
  golden flower-buds, big teal eyes + catch-light, a small hooked golden beak,
  green leaf wings + a fanned leaf tail, and golden talon legs. Idle: gentle
  breathing + crown-bud sway + soft wing flutter. Registered `gambang`.
- Gotcha: first pass the petals came out as tiny nubs — I'd scaled them off a
  `SphereGeometry(0.1)` base, so the real petals were ~2cm. Rebuilt `petal()` on
  a `SphereGeometry(0.5)` base sized in true world units; body now reads as an
  artichoke-like bloom.
- Verified: tsc clean; QA front + 3/4 in model-viewer (no errors), restored the
  viewer import after; Gambang renders grounded in-world with the proximity
  prompt; full begin→tame→party loop intact (party 0→1, mode→explore, tamed
  hidden, nearby cleared); console clean. Screenshots /tmp/gambang-front.png,
  /tmp/gambang-world.png. 6/12 roster now true 3D.

## 2026-06-13 — Bamut 3D model (5th monster ported)
- Built `src/models/bamut.ts` (mossy boar earth-beast) from the in-game sprite
  (no ref sheet): stocky front-heavy quadruped with a mottled moss CanvasTexture
  hide, shoulder hump, tan snout barrel + nose pad with nostrils, big amber
  eyes, upturned cream tusks, pointed ears, dark hooves, a curly tail, and red
  mushrooms + a fern sprig sprouting from its back. Idle: heavy breathing +
  tail curl-wiggle. Registered `bamut`.
- Verified: tsc clean; QA 3/4 + back in model-viewer (no errors); Bamut renders
  grounded in-world with the proximity prompt; full begin→tame→party loop intact
  (party 0→1, mode→explore, tamed hidden, nearby cleared). Screenshots
  /tmp/bamut-34.png, /tmp/bamut-back.png. 5/12 roster now true 3D.

## 2026-06-13 — Dugang 3D model (4th monster ported)
- Built `src/models/dugang.ts` (dugong/manatee sea-spirit) from the in-game
  sprite (no ref sheet): plump blue-grey body + lighter belly, broad whiskered
  snout with nostrils, big pale-blue eyes, side flippers, tail fluke, a green
  seaweed necklace draped across the chest with a pale scallop-shell pendant,
  and turquoise water-swirl wisps (partial-torus arcs) rising at its sides.
  Idle flourish: slow breathing + the wisps rise and sway. Registered `dugang`.
- Necklace/pendant first rendered buried inside the body sphere; moved them to a
  frontal arc sitting proud of the surface (beads sweep across the front only,
  dipping in the middle; shell hangs at centre).
- Verified: tsc clean; QA 3/4 in model-viewer (no errors); Dugang renders
  grounded in-world with the proximity prompt; full begin→tame→party loop intact
  (party 0→1, mode→explore, tamed hidden, nearby cleared). Screenshots
  /tmp/dugang-v2.png, /tmp/dugang-world.png. 4/12 roster now true 3D.

## 2026-06-13 — Matong 3D model (3rd monster ported)
- Built `src/models/matong.ts` (striped marsupial-tiger forest guardian) from
  the in-game sprite (no ref sheet exists): vibrant orange fur banded with black
  tiger stripes via a CanvasTexture, cream chest/belly, big triangular ears,
  large amber eyes + catch-light, dark nose, short arms with cream paws, stubby
  feet, a banded tapered tail, and a marsupial belly-pouch with a green fern
  sprig. Idle flourish: gentle tail-sway + slow breathing. Registered `matong`.
- Gotcha fixed: a mapped material multiplies its base color by the texture, so
  `mat(FUR, {map})` darkened orange×orange into maroon — set mapped meshes to
  `mat(0xffffff, {map})` so the stripe texture shows true.
- Verified: tsc clean; QA 3/4 + side in model-viewer (no errors); Matong renders
  grounded in-world with the proximity prompt; full begin→tame→party loop intact
  (party 0→1, mode→explore, tamed hidden, nearby cleared). Screenshots
  /tmp/matong-v2.png, /tmp/matong-world.png.

## 2026-06-13 — per-creature idle hook + Camar wing-flap
- Added a reusable per-creature idle-animation hook: a builder may set
  `group.userData.idle = (t) => {...}` referencing its own sub-meshes;
  `MonsterModel` calls it each frame via `useFrame`. Keeps per-species motion
  inside the builder instead of the renderer.
- Camar now slow-flaps its wings at rest: captured `wingR`/`wingL` and drive
  their `rotation.z`/`.x` from `sin(t*2.4)`. Reads as a hovering storm-gull.
- Verified: tsc clean; console clean; Camar renders in-world with the proximity
  prompt; full begin→tame→party loop intact (party 0→1, mode→explore, tamed
  hidden, nearby cleared). Note: R3F v8 `canvas.__r3f` is unreadable here, so the
  flap is confirmed by clean typecheck + the same useFrame path that already
  drives the working bob/face-player. Screenshot /tmp/camar-flap-3.png.

## 2026-06-13 — wild monsters turn to face the player
- `WildMonster.useFrame` now smoothly rotates the group to face the player when
  within ~20u (shortest-path angle lerp, frame-rate independent). Idle bob is
  gentler at rest and livelier within tame range. Reusable for every 3D model;
  harmless for billboards (Sprites always face the camera) and the flat element
  ring (rotationally symmetric, stays flat).
- Verified: tsc clean; Camar visibly orients toward the trainer (side-view
  shot /tmp/camar-face-profile.png); no console errors; begin→tame→party still
  works (party=1, explore, nearby cleared).

## 2026-06-13 — Camar storm-gull 3D model (2nd monster ported)
- Built `src/models/camar.ts` (Camar Badai): slate body + white chest, hooked
  golden beak, golden eyes, blue-tipped spiky crest, swept blade-wings with
  electric-blue lightning-streak feathers, turquoise throat gem, pennant tail,
  talon feet. Registered `camar` in the model registry.
- Note: only kancil + camar have BOTH a ref sheet and a wild-spawn slot. Sheet-
  only species (penyu/ubur/…) need a roster slot + taming-modal portrait before
  they can be added — captured in docs/models.md Next. (Built a penyu.ts this
  run, then removed it since it had nowhere to render + no modal portrait.)
- Verified: tsc clean; QA turntable 3/4 + back in model-viewer (no errors);
  Camar renders grounded in-world; drove begin→tame→party (party=1, explore,
  nearby cleared). Screenshots /tmp/camar-34.png, /tmp/camar-world2.png.

## 2026-06-13 — model registry: 3D Kancil renders in the world
- Added `src/models/registry.ts` (species id → builder, `hasModel`) and
  `src/components/MonsterModel.tsx` (builds mesh, normalises to world height via
  Box3, shadows, `<primitive>`). `WildMonster` now renders the 3D model when a
  builder exists, else falls back to the 2D billboard. Kancil is the first ported.
- Exposed `cameraState` on `window.__realm` for QA orbit control.
- Verified: tsc clean; Kancil mesh renders grounded in-world, no console errors;
  proximity prompt fires; drove begin→tame→party (party=1, mode back to explore,
  nearby cleared — race fix holds). Screenshot /tmp/realm-kancil-clear.png.

## 2026-06-13 — Kancil v1 refine + image-to-3D decision (msg #138)
- Mahdy: no paid/credit-gated image-to-3D generators. All reachable ones (Meshy/
  Tripo) gate behind small free caps; open-source (TripoSR/InstantMesh/Hunyuan3D)
  need a GPU we don't have. Decision: every monster is hand-built in Three.js
  from the reference sheets. Recorded in docs/models.md.
- Refined `src/models/kancil.ts` toward the ref sheet's chibi look: bigger
  rounded head, large amber eyes (+catch-light), big cream-lined leaf ears,
  plump bean body sitting low, cream muzzle/belly, batik on flank + rump,
  short legs tucked under the body (no longer floating stilts), splayed feet.
- tsc clean; QA turntable front + 3/4 in model-viewer, no console errors.
  Screenshots /tmp/kancil-v1-front.png, /tmp/kancil-v1-34.png (sent).

## 2026-06-13 — pivot to true 3D models (msg #134)
- Mahdy: make assets real 3D, built from scratch in Three.js, using our
  character reference sheets (turnaround sheets in nusantara-monster/assets/raw).
- Built first from-scratch model: `src/models/kancil.ts` (Kancil Emas — gold
  coat, batik flank, cream-lined ears, amber eyes, black hooves, gold anklet)
  + a turntable viewer (`model-viewer.html` / `src/model-viewer.ts`).
- v0 model is recognisable but rough (legs/proportions need refining). tsc clean,
  rendered + screenshot in browser. Set this as roadmap item #0; loop will refine
  then build out the roster. See docs/models.md.

## 2026-06-13 — v0 created & shipped
- Proved feasibility first with a Three.js HD-2D POC (separate `nusantara-3d/`):
  Nusantara sprites as billboards in a 3D world. Screenshot sent, approved.
- Scaffolded the real game in React-three-fiber per Mahdy's request (msg #130).
- Built: 3D overworld (grass/path/scenery), follow camera + drag-orbit, player
  with directional walk frames, 12-monster wild roster (bobbing billboards +
  element rings), proximity taming prompt, taming modal w/ species stats, and a
  party panel. Zustand store; rarity-scaled taming odds.
- Fixed a one-frame race where a just-tamed monster re-flagged itself "nearby"
  (WildMonster.useFrame now reads live `tamedWildIds`).
- `tsc --noEmit` clean. Verified in agent-browser: render OK, no console errors,
  full explore→approach→E→tame→party loop works.
- Created public repo github.com/faisalmahdy/nusantara-realm; pushed v0 (62482d1).
- Scaffolded indexed docs (index/log/docs) per the standing convention.
- Pending: set up the hourly improvement loop; begin roadmap item #1 (battle).
