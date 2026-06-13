# 3D models (from-scratch Three.js)

Last touched: 2026-06-13 (Kancil v1 refine)

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

## Registry (wired)
- `src/models/registry.ts` maps species id → builder; `hasModel(id)` gates it.
- `src/components/MonsterModel.tsx` builds the mesh, normalises it to a target
  world height (Box3), enables shadows, renders via `<primitive>`.
- `WildMonster` renders `MonsterModel` when `hasModel`, else the 2D billboard.
  Port a species by adding its builder to the registry.

## Next
- Build Camar, Penyu, Ubur builders (have ref sheets), add to the registry.
- (Decision, msg #138) No paid/credit-gated image-to-3D — all monsters are
  hand-built in Three.js from the reference sheets.
