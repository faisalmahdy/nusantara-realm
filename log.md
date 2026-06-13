# Log — Nusantara Realm

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
