# 3D models

Last touched: 2026-06-14 (Meshy pipeline live — all 12 roster species are GLBs)

## PIVOT — Meshy.ai is now the asset pipeline (msg #212/#226)
Mahdy got a Meshy subscription; we now **generate models with Meshy.ai** instead
of hand-building primitives. Reverses the old msg #138 "no paid image-to-3D".
- **Single sprite wins over refsheet multi-view.** Tested both on Kancil: the
  refsheet's painted shadows bake into the texture (dark/bronze, washed-out
  motif), while the flat in-game sprite stays bright and picks up scene light.
  So feed **`public/sprites/<id>/idle.png`** (one clean front view) every time.
- Pipeline: base64 the sprite → `POST https://api.meshy.ai/openapi/v1/image-to-3d`
  ( `{ image_url, ai_model:"meshy-5", enable_pbr, should_remesh, should_texture }` )
  → poll `GET .../image-to-3d/{id}` to SUCCEEDED → download `model_urls.glb` →
  save `public/models/<id>.glb`. Auth via the OneCLI gateway (Bearer, host
  `api.meshy.ai`, path `/*`). Async (2–4 min/model), consumes credits.
- Loading: `registry.ts` `GLB_MODELS` set + `hasGlb(id)`; `MonsterModel` renders
  `GlbModel` (drei `useGLTF`, Box3-normalised, own Suspense) when `hasGlb`, else
  the procedural builder. QA via `glb-viewer.html?model=/models/<id>.glb`.
- Status: **all 12 roster species are GLBs** (kancil, matong, dugang, camar,
  gambang, bamut, ayaka, babur, kepiting, naris, watua, rabuas) — single-sprite
  image-to-3d, wired into `GLB_MODELS`, live in-game. Batch QA montage approach:
  `node /tmp/shoot.mjs <id...>` (puppeteer + glb-viewer) → sharp grid.
  NB: rabuas/babur 503'd once on submit (transient `service_unavailable`) — just
  resubmit. Meshy caps pending tasks at 10, so the 11th queues after a slot frees.

## Legacy (hand-built primitives — superseded, kept as fallback)
Original direction (msg #134): real 3D built from scratch in Three.js using our
**character reference sheets**. All 12 builders below still exist and render for
any species without a GLB.

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
- `kancil.ts` — Kancil Emas v2 (refined to the ref sheet). Deer silhouette now:
  fuller front chest tapering to a batik-diamond rump, a cream chest blaze, and
  crisper concentric batik diamonds (3 nested + pip). Face gains the chimera's
  flared cheek ruff (gold→cream tufts swept back along the jaw), a forehead
  cowlick, taller dark-rimmed cream-lined ears, and soft brows over the big amber
  eyes (+catch-light). Keeps cream muzzle/belly, black hooves, gold anklet
  front-left. Subtle idle: head bob/sway + periodic ear flick + tail sway.
- `camar.ts` — Camar Badai storm-gull v2 (refined to the ref sheet). Big spread
  wings now: a 7-feather vertical fan per side (primaries longest mid-out) with
  two bright electric-blue lightning-streak feathers worked into the layering.
  Fiercer face: dark slate brows tilted inward over the golden eyes (raptor
  glare). Taller 5-feather back-swept crest (slate/white, bolt-tipped centre),
  plus a feathered neck ruff and a curling storm wisp behind the shoulder. Keeps
  white chest, hooked golden beak, turquoise gem, pennant tail, talon feet. Idle:
  slow wing-beat + crest/wisp drift.
- `matong.ts` — striped marsupial-tiger v2 (from the in-game sprite, no ref
  sheet). Bolder tiger stripes now (9 alternating thick/thin wavy bands), plus
  the sprite's signature face: bushy cream cheek-tuft fans and dark stripe marks
  fanning down the forehead. Keeps cream belly, big ears, amber eyes, banded
  tail, belly-pouch with a green fern. Idle: tail-sway + breathing. NB: mapped
  meshes use `mat(0xffffff,{map})` so the texture isn't darkened by a base
  multiply.
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
- `kepiting.ts` — armoured reef crab (from the sprite): wide domed carapace with
  a mottled crusty CanvasTexture + cream barnacle freckles, lighter tan belly-
  plate with two mask dimples, cream barnacle nodules round the rim, a pink-red
  branching coral crown on top, two black eyes (golden rings + glint) on short
  eyestalks, two big pincer claws (segmented arms + open jaws, barnacle-crusted),
  three pairs of segmented walking legs. Idle: breathing + claws open/close.
- `babur.ts` — winged cloud-piglet (from the sprite; blurb says "tusked" but the
  art is a gentle sky-piglet): plump cream body with soft blue cloud-swirl flank
  markings (CanvasTexture), pink snout disc + nostrils, rosy cheek blush, big
  heterochromia eyes (one amber, one blue) + catch-light, floppy pink ears, four
  little hooves, a curly tail, and a pair of feathered slate-blue wings (broad
  plume fan sweeping up/back). Idle: breathing + gentle wing-flap + tail wiggle.
  NB: feathers are broadened cones (scale 1.4,1,0.55) fanned in the vertical
  plane + splayed outward so the wing reads from front and 3/4, not just side.
- `ayaka.ts` — dancing flame-spirit ram-bird (from the sprite): fluffy golden
  body with red flame-swirl batik markings (CanvasTexture), cream belly, a
  ruffled tuft skirt round the lower body, big curling ram horns (ridged partial
  torus), big amber eyes + catch-light, small muzzle + nose, fluffy cheeks, a
  flickering flame crest on the head, a dramatic phoenix-like flame tail-plume
  sweeping up/back, and two orange talon legs. Flames are flattened emissive
  cones in a fan (`flameFan`). Idle: dancing side-sway + breathing + crest
  flicker + tail sway.
- `naris.ts` — storm-touched coiled naga (from the sprite): an olive-green
  body coiled into two stacked banded toruses (red-brown chevron CanvasTexture),
  cream belly plates up the front, a frilled dragon head (spike fan) with big
  green eyes + catch-light, snout + nostrils, golden brow scales, a golden
  storm-smoke wisp (alternating partial-torus arcs) curling up from the crown,
  two little clawed arms resting on the coil, and a tapering tail curling up at
  the back. Idle: breathing + smoke wisp curl/spin + head sway + tail drift.
- `watua.ts` — treant / root-spirit (from the sprite; blurb says "stone-spirit"
  but the art is a wood/root treant): a stout gnarled bark trunk (wood-grain
  CanvasTexture, body+head merged) with bark ridges, a heavy brow (half-torus),
  big amber eyes + catch-light, a bark nose, a hanging beard of root tendrils,
  stubby gnarled root arms + splayed root feet (tapered cones w/ finger nubs),
  moss patches, and a bushy low-poly leaf canopy (icosahedron clumps) crowning
  the head with willow drooping strands. Idle: slow sway + canopy rustle + beard
  drift.
- `rabuas.ts` — Rafflesia corpse-flower forest beast (from the sprite): a warty
  green body (sphere + 12 wart bumps) on four stubby vine legs ending in bulbous
  leaf-pod feet, crowned by a five-petal Rafflesia bloom (deep-red cream-spotted
  petals via CanvasTexture, cupped forward) ruffing a toothy green toad-face (big
  amber eyes + catch-light, heavy brow, nostrils, dark grin with cream fangs), and
  a couple of curling vine tendrils. Idle: breathing + bloom flex/sway + face bob
  + tendril sway. NB: lower petals tuck behind the body — bloom reads best at 3/4.

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
- Roster porting COMPLETE (12/12): kancil, camar, matong, dugang, bamut, gambang,
  kepiting, babur, ayaka, naris, watua, rabuas. Every roster/spawn-slot species
  now renders as a from-scratch low-poly 3D model with a subtle idle flourish.
  Penyu/Ubur/etc. have ref sheets but no roster slot or modal portrait (port only
  if they get added to the roster).
- (Decision, msg #138) No paid/credit-gated image-to-3D — all hand-built.
