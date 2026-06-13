# 3D models (from-scratch Three.js)

Last touched: 2026-06-13 (Gambang added — 6th monster)

Mahdy's direction (msg #134): make the assets real 3D, built from scratch in
Three.js, using our **character reference sheets** as the guide (not billboards).

## Reference sheets
`/workspace/agent/projects/nusantara-monster/assets/raw/monsters/*_refsheet.png`
Each is a full turnaround: FRONT / 3-4 / SIDE / BACK + expressions + signature
details (palette, motifs). Sheets exist for: camar, kancil, karang-raksasa,
nyai-segara, penunggu-banyan, penyu, raja-wayang, ubur. (Others only have
in-game sprites — model from those + the species blurb.)

## Pattern
- One builder per monster in `src/models/<id>.ts`:
  `export function build<Name>(): THREE.Group` — a low-poly mesh authored from
  primitives (spheres/cylinders/cones), standing on y=0, facing +Z, ~1.2u tall.
- Pull palette + silhouette + signature details straight from the ref sheet
  (e.g. Kancil: gold coat, batik-diamond flank via CanvasTexture, cream-lined
  ears, amber eyes, black hooves, gold anklet on front-left leg).
- Keep it cohesive low-poly/stylised — it won't be painterly like the 2D art;
  aim for "readable and charming," and refine proportions over iterations.

## Viewer
`model-viewer.html` + `src/model-viewer.ts` — studio lighting, ground, shadows,
auto-turntable, drag-to-spin. `window.__model.setRotation(y)` for QA shots.
Open `http://localhost:5181/model-viewer.html`. Swap which builder it imports to
review a different monster.

## Done
- `kancil.ts` — Kancil Emas v1. Chibi proportions matching the ref sheet: big
  rounded head, large amber eyes (+catch-light), big cream-lined leaf ears,
  plump bean body, cream muzzle/belly, batik on flank + rump, short legs tucked
  under the body, gold anklet front-left.
- `camar.ts` — Camar Badai storm-gull: slate body + white chest, hooked golden
  beak, golden eyes, blue-tipped crest, swept blade-wings with electric-blue
  lightning-streak feathers, turquoise throat gem, pennant tail, talon feet.
  Idle: slow wing-flap.
- `matong.ts` — striped marsupial-tiger (modelled from the in-game sprite, no
  ref sheet): orange fur + black tiger stripes (CanvasTexture), cream belly,
  big ears, amber eyes, banded tail, belly-pouch with a green fern. Idle:
  tail-sway + breathing. NB: mapped meshes use `mat(0xffffff,{map})` so the
  texture isn't darkened by a base-color multiply.
- `dugang.ts` — dugong/manatee sea-spirit (from the sprite): plump blue-grey
  body, whiskered snout + nostrils, pale-blue eyes, flippers, tail fluke,
  seaweed necklace + scallop-shell pendant, turquoise water-swirl wisps. Idle:
  breathing + wisp sway. NB: necklace beads sit on a frontal surface arc.
- `bamut.ts` — mossy boar (from the sprite): front-heavy quadruped, mottled moss
  CanvasTexture hide, tan snout + nostrils, amber eyes, cream tusks, hooves,
  curly tail, mushrooms + fern on its back. Idle: breathing + tail wiggle.
- `gambang.ts` — flower-spirit bird (from the sprite): chibi bird whose body is a
  layered bloom of coral/peach petals (rows of flattened spheres, lower rows
  splayed out), petal ruff framing the face, crown of upright petals + golden
  buds, big teal eyes, hooked golden beak, green leaf wings + tail, golden talon
  legs. Idle: breathing + crown-bud sway + soft wing flutter. NB: petals are
  built from `SphereGeometry(0.5)` scaled to real units — sizing off a 0.1 base
  made them tiny nubs first pass.

## Registry (wired)
- `src/models/registry.ts` maps species id → builder; `hasModel(id)` gates it.
- `src/components/MonsterModel.tsx` builds the mesh, normalises it to a target
  world height (Box3), enables shadows, renders via `<primitive>`.
- `WildMonster` renders `MonsterModel` when `hasModel`, else the 2D billboard.
  Port a species by adding its builder to the registry.
- Per-creature idle: a builder may set `group.userData.idle = (t) => {...}`
  (referencing its own sub-meshes); `MonsterModel` calls it each frame. Camar
  uses this for a slow wing-flap.

## Next
- Roster porting (6/12 done: kancil, camar, matong, dugang, bamut, gambang).
  Remaining spawn-slot species — ayaka, babur, kepiting, naris, watua, rabuas —
  are modelled from their in-game sprite + blurb (only kancil/camar have ref
  sheets). Penyu/Ubur/etc. have sheets but no roster slot or modal portrait yet.
- (Decision, msg #138) No paid/credit-gated image-to-3D — all hand-built.
