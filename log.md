# Log — Nusantara Realm

## 2026-06-19 — Art-direction decision: revive HD-2D (plan-10x Decision #1)
- Mahdy chose to act on the plan's #1 decision and revert the look to **HD-2D**
  (2D Nusantara sprites as billboards in the 3D world) over the auto-generated
  Meshy 3D models. This also resolves the project's worst problem for free: in
  HD-2D mode **no GLB is fetched** (verified 0 GLB requests), so first load drops
  from ~372 MB of models to ~11 MB of sprites.
- Implemented as one reversible flag: `src/game/config.ts` `ART_MODE` ('hd2d' |
  '3d'). Renderers branch on it:
  - `Player.tsx` — restored the directional walk-frame billboard (front/back
    idle + walk_0..3, picked by walk direction vs camera; idle faces camera),
    via an imperative texture-swap (no per-frame re-renders). 3D GLB path kept
    behind the flag; `useGLTF.preload(player.glb)` now only runs in 3D mode.
  - `WildMonster.tsx` — renders the `idle.png` billboard in hd2d (evolved forms
    reuse the base sprite — no per-stage 2D art exists).
  - `World.tsx` — scenery renders as `Sprite3D` billboards in hd2d (no prop GLBs).
  - `HUD.tsx` — party viewer shows the 2D `idle.png` instead of the 3D canvas.
  - `BattleScreen.tsx` already used 2D frames — unchanged.
- QA: `tsc --noEmit` clean; `vite build` clean; headless Chromium (Playwright)
  shot the opening view, the field (player walking away = back frames), the
  Matong tame prompt, and the party panel — all render the painterly 2D look;
  full tame loop intact (forced tame → party 1, panel shows the 2D Kancil);
  network trace: 0 `.glb`, 23 sprites, console clean (favicon 404 only).
- Follow-up: the Meshy GLBs (`public/models/`, ~372 MB) are now dead weight in
  the repo/deploy — move/remove them once 3D mode is formally retired. Also
  code-split the three/drei 3D path to shrink the 998 KB JS bundle.

## 2026-06-19 — 10× strategy plan (analysis + roadmap)
- Mahdy asked for a full analysis of what the repo is building, its current
  status, and a plan — written "with ten personas of a game-dev team" — for how
  to make the game 10× better.
- Read all docs + log + core source (store/battle/monsters/GameScene) and audited
  the assets. Key findings: solid working core loop (explore→tame→battle→raise→
  evolve), but a flat single-biome world with a static finite ring of 12 spawns;
  **zero audio**; **zero tests / no CI / no lint**; and the standout problem —
  **372 MB of un-optimized GLBs (avg 9.3 MB, trees 12 MB each)** that would crush
  mobile (Mahdy's own test device). Plus an unresolved HD-2D→Meshy-3D art pivot.
- Wrote `docs/plan-10x.md`: a ten-persona roundtable (Creative Director, Lead
  Designer, Narrative, Art Director, Tech Artist, Tech Director, UX, Audio,
  Producer, Growth), a current-state scorecard, a 4-horizon roadmap, quick wins,
  risks, decisions needed, and a north-star metric. Added an index.md routing row.
- The 10× thesis: not more features — turn the sandbox into a *place worth being*,
  fix the foundations that block everyone (compress assets, add audio, add CI),
  ship one island done right, and lean all the way into Nusantara folklore.
- No code/gameplay changes this session — analysis + planning only. Top decision
  flagged for Mahdy: resolve the art direction (recommend reviving HD-2D).

## 2026-06-14 — Fixed Cloudflare deploy (msg #252)
- Cloudflare Workers Build failed at install: `pnpm install --frozen-lockfile`
  → "packages field missing or empty". The settings-only `pnpm-workspace.yaml`
  (held `onlyBuiltDependencies: esbuild`) made pnpm 10.x treat the repo as a
  workspace with no packages. Added `packages: [.]` — install now clean on
  pnpm 10.11.1 and 11.6.0.
- The deploy step runs `npx wrangler deploy` (Workers, not Pages), which needs a
  config. Added `wrangler.jsonc`: an assets-only Worker serving `./dist` with
  SPA fallback (`name: nusantara-realm`). `wrangler deploy --dry-run` reads the
  dist assets cleanly, no server script needed.
- Removed the earlier `.github/workflows/deploy-cloudflare.yml` — Cloudflare's
  native Git integration now handles builds, so the Action was redundant and
  would fail on every push without the CF secrets.

## 2026-06-14 — Real party-evolution view + stage-up notice (msg #242)
- Mahdy: "yes build that" — party monsters now visibly evolve as they level.
  Added a live 3D party viewer: `PartyViewer3D.tsx` (its own small `<Canvas>`,
  one at a time to stay under the WebGL-context limit) renders the *selected*
  party monster's current evolution-stage GLB, slowly auto-rotating.
- HUD party panel: rows are now selectable (click to highlight); the panel top
  shows the selected monster's 3D model, a "Stage N" badge, and an "Evolves at
  Lv X" / "Final form reached" line. Stage comes from `evolutionStage(level)`,
  next threshold from `nextEvolutionLevel(level)` (new in battle.ts: [8, 16]).
- Stage-up notice: `store.ts` now pushes "X evolved into its Stage N form!" when
  an XP gain crosses a boundary — in battle wins, battle-tames (battle log) and
  ranch feeding (flash message). Progression numbers are unchanged.
- QA: `tsc` clean; headless render confirms stage-1 lead shows Stage 1 +
  "Evolves at Lv 8", selecting a Lv 18 monster swaps to its Stage 3 model +
  "Final form reached"; only 2 canvases (overworld + viewer), no GLB 404s,
  console clean (favicon only); tame loop intact (party 0→1).

## 2026-06-14 — Wired evolution-stage models (msg #240)
- Final wiring pass: the L2/L3 evolution GLBs now render in-world. Added
  `evolutionStage(level)` (battle.ts: Lv8 → stage 2, Lv16 → stage 3),
  `stageGlbId(speciesId, stage)` + `GLB_STAGE_MODELS` (registry.ts, all 24
  `<id>2`/`<id>3`), and a `stage` prop on `MonsterModel` that loads the matching
  GLB. `GlbModel` now takes a generic `glbId` (species OR evolution model).
- Each wild spawn gets a cosmetic `level` (GameScene: `1 + i*2`, spreading the
  roster evenly across stages 1/2/3 so all evolution models appear in the field).
  WildMonster passes `stage={evolutionStage(spawn.level)}`. **Cosmetic only** —
  battle difficulty still scales to your lead (`beginBattle` untouched), so this
  doesn't rebalance fights. A real level-up evolution mechanic is a follow-up.
- QA: `tsc` clean, all 24 stage GLBs present, headless render loads them with no
  404s, context healthy, tame loop intact. This completes wiring every generated
  asset (props, player, evolutions); the base 12 were already live.

## 2026-06-14 — Wired the 3D player (msg #240)
- Mahdy: "do start 3d player then evolutions, then another assets... loop on it."
  Swapped the 2D billboard player for `player.glb`. `Player.tsx` now renders a
  Box3-normalised GLB (height 2.6) inside its own Suspense; all movement,
  collision (tree push-out), joystick, and E-to-tame logic is unchanged.
- Facing: the model's native front is +Z (same as the monster GLBs), so the
  group's `rotation.y` turns it. While walking it faces the move direction
  (`atan2(move.x, move.z)`); when idle it turns to face the camera
  (`atan2(-forward.x, -forward.z)`), lerped for a smooth turn. Dropped the old
  front/back directional walk-frame sprites — the 3D model rotates instead.
- QA: `tsc` clean, headless render shows the player as a 3D figure on the path
  facing camera, context healthy, console clean (favicon only).

## 2026-06-14 — Wired 3D props into the world (msg #238)
- Mahdy said "yes start wiring it" — began with props (most visible, lowest risk).
  New `WorldProp.tsx`: loads a prop GLB via drei `useGLTF`, Box3-normalises the
  cloned scene to the scenery height, plants it on y=0, applies a deterministic
  per-item `rotationY`, casts/receives shadows. Exports `propGlbId(url)` (maps
  `/world/tree-palm.png` → `tree-palm`) and `hasPropGlb(id)` (set of the 3 props
  that have GLBs: tree-palm, tree-banyan, fern).
- `World.tsx` now renders `<WorldProp>` instead of `<Sprite3D>` for any scenery
  item whose sprite has a GLB; non-GLB scenery still falls back to the billboard.
  ~80 scenery items, but only 3 unique GLBs load (drei caches; each item clones).
- QA: `tsc` clean; headless render shows 3D palms/banyans across the field, WebGL
  context healthy (not lost), console clean (only favicon 404). Tame loop intact
  (programmatic `tame("matong",...)` → party 0→1). Next: 3D player, then evolutions.

## 2026-06-14 — Generated evolutions + player + props (28 GLBs) (msg #234)
- Mahdy asked to also generate the L2/L3 evolution stages, the main character,
  and world props. Batch-generated 28 GLBs via the same single-sprite pipeline:
  24 evolutions (`<id>2`/`<id>3` for all 12, from
  `nusantara-monster/assets/sprites/<id>{2,3}/idle.png`), `player.glb`
  (`sprites/player/front_idle.png`), and props `tree-palm`/`tree-banyan`/`fern`
  (from `public/world/`). Skipped grass/path — those tile, they don't model.
- New batch orchestrator `/tmp/meshy_batch2.mjs`: a queue capped at 8 concurrent
  (under Meshy's 10 limit), auto-refills, resubmits on transient FAILED, and is
  idempotent (skips any `<out>.glb` that already exists). All 28 succeeded, no
  failures this run.
- QA: captured all 28 headless (puppeteer + glb-viewer) into two sharp montages
  (evolutions; player+props) — every model renders bright/clean.
- Assets committed to `public/models/` but **not yet wired**: evolutions need an
  evolution-render path, the player is still a 2D billboard, props are still 2D.
  Offered those as the next step.

## 2026-06-14 — Generated the other 11 Meshy GLBs; full roster is now 3D (msg #228)
- Batch-generated the remaining 11 species (matong, dugang, camar, gambang,
  bamut, ayaka, babur, kepiting, naris, watua, rabuas) via single-sprite
  image-to-3d, same pipeline as Kancil. All wired into `GLB_MODELS`.
- Meshy caps pending tasks at 10, so submitting all 11 at once 429'd the last
  one (rabuas) — orchestrator resubmits it once a slot frees. babur 503'd once
  (transient `service_unavailable`); a resubmit succeeded.
- Built a reusable batch-QA path: `/tmp/shoot.mjs` (puppeteer-core drives the
  glb-viewer headless, waits for `window.__glb.ready`, screenshots each) → a
  sharp 4×3 montage. puppeteer-core + sharp installed temporarily for QA and
  reverted from package.json before commit (not app deps).
- Verified: `tsc --noEmit` clean; all 12 render bright/clean in the viewer;
  in-game tame loop intact (tame kancil → party=['kancil'], mode→explore, no
  console errors beyond a harmless favicon 404).

## 2026-06-14 — PIVOT to Meshy.ai pipeline; Kancil locked in as a GLB (msg #212/#226)
- Mahdy got a Meshy subscription — switched the 3D pipeline from hand-built
  primitives to **Meshy.ai-generated models** (reverses old msg #138).
- Got Meshy connected through the OneCLI gateway: the `credential_not_found`
  was a too-narrow path pattern — fixed by setting Path to `/*` in Advanced
  settings. Balance came back 2100.
- Pipeline: base64 a clean sprite → `POST /openapi/v1/image-to-3d` (meshy-5,
  pbr/remesh/texture) → poll to SUCCEEDED → save `public/models/<id>.glb`.
- A/B'd single-sprite vs refsheet multi-view on Kancil. Single sprite wins:
  the refsheet's painted shadows bake into the texture (dark/bronze, washed
  batik), while the flat sprite stays bright and picks up scene light. So
  `public/sprites/<id>/idle.png` is the standard input.
- Wired GLB loading into the game: `registry.ts` `GLB_MODELS`/`hasGlb`;
  `MonsterModel` renders a drei `useGLTF` `GlbModel` (Box3-normalised, own
  Suspense) when a GLB exists, else the procedural builder. Built a standalone
  QA viewer (`glb-viewer.html?model=/models/<id>.glb`).
- Verified: `tsc --noEmit` clean; Kancil GLB renders in-game, console clean;
  full tame loop intact (tame kancil → party). **kancil** locked in; other 11
  pending Mahdy's go.

## 2026-06-14 — Matong model refined to v2 (roadmap #0)
- Third model-refinement pass. Matong has no turnaround ref sheet, so I worked
  from its in-game `idle.png` sprite.
- Boldened the tiger stripes: 9 alternating thick/thin wavy bands (was 6 thin),
  richer orange base — now reads clearly as a tiger from across the field.
- Added the sprite's face details that were missing: bushy cream cheek-tuft fans
  and three dark stripe marks fanning down the forehead.
- Dev server had died at QA start — rebooted vite (esbuild workaround) before
  shooting.
- Verified: `tsc --noEmit` clean; viewer front/3-4 shots match the sprite;
  console clean; core loop (tame a matong → party) intact.

## 2026-06-14 — Camar model refined to v2 (roadmap #0, msg #206)
- Continued the model-refinement pass; Camar Badai was next (in the roster AND
  has a real ref sheet). Studied `camar_refsheet.png`.
- Rewrote the wings from 4 sparse blades into a 7-feather vertical fan per side
  (primaries longest through the middle) with two bright lightning-streak feathers
  layered in — the storm-gull signature now reads clearly.
- Fiercer face: dark slate brows tilted inward over the golden eyes. Taller
  5-feather back-swept crest (bolt-tipped centre), a feathered neck ruff, and a
  new curling storm wisp behind the shoulder (drifts in the idle).
- Pointed the model-viewer at buildCamar for QA.
- Verified: `tsc --noEmit` clean; viewer front/side shots match the sheet;
  in-game render + console clean; core loop (tame a camar → party) intact.

## 2026-06-14 — Kancil model refined to v2 (roadmap #0, msg #202)
- Mahdy asked to make a 3D model "a lot better"; picked the flagship Kancil
  (starter, only model with a real ref sheet) for the most impact.
- Studied `kancil_refsheet.png` and rewrote `buildKancil()` from the plump-bean
  v1 to a true mousedeer silhouette: fuller front chest tapering to a batik rump,
  a cream chest blaze, crisper concentric batik diamonds (3 nested + centre pip).
- Added the chimera's signature flared cheek ruff (gold→cream tufts swept back
  along the jaw), a forehead cowlick, taller dark-rimmed cream-lined ears, and
  soft brows over the amber eyes. First pass the cheek tufts splayed out like
  horizontal paddles — re-angled them (rot.x -2.3) to hug the cheek.
- Gave it a subtle idle (head bob/sway + periodic ear flick + tail sway) and
  wired the model-viewer loop to run `userData.idle` so it shows in QA.
- Verified: `tsc --noEmit` clean; viewer front/3-4/side shots match the sheet;
  in-game render + console clean; core loop (beginTaming→tame→party) intact.

## 2026-06-14 — Mobile touch controls (roadmap #5)
- The game was keyboard-only — literally unplayable on a phone, which is Mahdy's
  primary test device. Closed that gap.
- New `TouchControls.tsx`: a draggable on-screen joystick (bottom-left) + a round
  E/tame button (bottom-right), mounted by HUD only in explore mode. The joystick
  writes a screen-plane vector into new `shared.touchInput`; Player folds it into
  the camera-relative move vector (up on the stick = forward). The E button calls
  beginTaming on the nearby wild, dimming when none is in range. Controls are
  always-on (also mouse-usable) — can hide on non-touch devices later if wanted.
- tsc clean; console clean. Verified in browser via synthetic pointer events:
  pushing the stick up walked the player forward (0,8 → world edge); releasing
  stopped movement; tapping E with a nearby wild opened the taming modal. Core
  loop intact. Pushed to main.

## 2026-06-14 — Save persistence (roadmap #6)
- Refresh used to wipe your whole party — the biggest gap now that taming, XP,
  bond and HP have real depth. Now progress survives a reload.
- Wrapped the zustand store in `persist` middleware (key `nusantara-realm-save`).
  `partialize` persists only `party` + `tamedWildIds`; transient state (mode,
  battle, nearby/taming targets, message) is excluded so a reload always lands
  in 'explore' with no stale battle. `onRehydrateStorage` resumes `uidCounter`
  past the highest restored uid so new tames can't collide.
- tsc clean; console clean. Verified in browser: tamed a Kancil → save written
  (party 1) → page reload → party + tamedWildIds restored intact (kancil hp 26,
  wild-kancil-1 still removed) → a fresh tame got uid m2 (no collision). Core
  tame loop intact. Pushed to main.

## 2026-06-14 — Tree collision (roadmap #4 world richness)
- Player walked through trees, breaking the solid-world feel. Now you can't.
- Extracted the deterministic scenery layout (mulberry32 seed 1337) out of
  World.tsx into `src/game/scenery.ts`, shared by World (render) and Player
  (collision) so both agree on tree positions. Each scenery item carries a trunk
  radius `r` (banyan 1.4, palm 1.0, fern 0); `COLLIDERS` = the trees.
- Player.tsx does a circular push-out vs COLLIDERS after each move
  (PLAYER_R 0.55): radial resolution, so you slide smoothly around trunks rather
  than sticking. Ferns stay walkable; the central path is already tree-free.
- tsc clean; console clean. Verified collision end-to-end in browser by driving
  the player straight at an isolated tree and sampling min distance to its
  center over the walk: bottomed out at exactly minD (1.95) — never penetrated.
  Core tame loop intact (matong tamed). Pushed to main.

## 2026-06-14 — Day/night cycle (roadmap #4 world richness)
- Checked roadmap #3 (Evolution) first: it's asset-blocked — every species
  folder under public/sprites is just idle/attack/hit/portrait, no evolved-form
  art (the bamut2/bamut3 chains the design doc mentions don't exist in-repo).
  Pivoted to a self-contained #4 slice that needs no new assets.
- New `DayNight.tsx`: a useFrame-driven 120s sun orbit that lerps the sky/fog
  color, sun position/color/intensity, and hemisphere sky/ground colors +
  intensity through noon→dusk→night→dawn. Mutates the scene's own background/fog
  objects in place (no per-frame allocations). Phase-offset so the world loads
  at midday, matching the prior daytime look. GameScene drops its static
  color/fog/lights for `<DayNight/>`.
- tsc clean; console clean; core tame loop verified (party 0→1 via direct tame).
  Two screenshots 45s apart confirm the cycle moves: bright noon → dark, readable
  night (foliage dim, element rings still glow). Pushed to main.

## 2026-06-14 — Persistent battle HP + Rest (roadmap #2)
- Battles now have lasting stakes: damage carries between fights, and the ranch
  is where you recover.
- `battle.ts` — exported `maxHpFor(speciesId, level)`.
- `store.ts` — `TamedMonster.hp` (current HP, init full on tame). `beginBattle`
  starts the lead at its stored HP and refuses if it's fainted (hp 0);
  `endBattle` writes the lead's remaining HP back to the party. New `rest(uid)`
  heals a monster to full.
- `HUD.tsx` — party rows show an HP bar (green/yellow/red) above the bond bar,
  plus a blue Rest button beside Feed (dimmed at full HP).
- QA: tsc clean; in-browser Kancil took a hit to 7 HP, fled, reopened battle
  still at 7 (persisted); a 0-HP lead was blocked ("rest it first"); Rest
  restored full; newly tamed monster starts full; console clean; direct-tame
  loop non-regressed.

## 2026-06-14 — Ranch: bond pays off in battle (roadmap #2, msg #188)
- Made the bond stat matter: a well-fed lead now fights harder, so the Feed
  loop has a real combat payoff.
- `battle.ts` — added `bond` to Combatant + `bondAtkMult(bond)` (1.0→1.2 over
  0..100 bond); `computeDamage` scales the attacker's hit by it. Wilds have
  bond 0 (no bonus).
- `store.ts` — `beginBattle` copies the lead's bond onto the player combatant
  and logs a "+N% damage" note when bond≥50.
- `BattleScreen.tsx` — player fighter name row shows a ♥bond badge.
- QA: tsc clean; in-browser same Kancil(Lv6) vs Bamut Strike hit 32 at bond 0
  vs 43 at bond 100 (+20% on the attack term, shown in log); ♥88 badge rendered;
  console clean; direct-tame loop non-regressed (empty party → tamed Watua).

## 2026-06-13 — Ranch loop, first slice: Feed/bond (roadmap #2)
- Started the raising loop: tamed monsters can now be fed to deepen the bond.
- `store.ts` — new `feed(uid)`: +8 bond (capped 100) and +5 XP via `applyXp`
  (rolls into level-ups). Once bond hits 100 the monster is "already content" —
  no further bond/XP — so the button can't be mashed into infinite levels.
- `HUD.tsx` — each party row gains a pink bond bar (0..100) + a green Feed
  button; row reflowed to flex with the button on the right.
- QA: tsc clean; in-browser fed Kancil 48→56 (others untouched), bond capped at
  100 with the content message, XP accrued; console clean; direct-tame loop
  non-regressed (empty party → tamed Watua → party 1).

## 2026-06-13 — Battle hit juice (roadmap #1 cont.)
- Made trades read as distinct, weighty hits without touching the engine.
- `BattleScreen.tsx` (visual-only) — watches player/enemy HP deltas to pop
  rising/fading "-N" floating damage numbers; the store resolves both hits in
  one update, so the enemy's number shows immediately and the player's
  counter-hit number is staggered ~280ms later. The struck fighter gets a brief
  brightness-flash + shake. New `FloatingDamage` sub-component; sprite wrapped in
  a relative container so numbers position over it.
- No engine/store changes → zero risk to battle math or the tame loop.
- QA: tsc --noEmit clean; in-browser Kancil(Lv9 Forest) vs Bamut(Earth) — Strike
  super-effective 32, Bamut greedily picked Focus Blow (typeless 40) over its
  resisted Strike; floating "-N" nodes confirmed in DOM; console clean;
  direct-tame loop non-regressed (empty party → tamed Watua → party 1).

## 2026-06-13 — Battle move-sets (roadmap #1 cont., msg #182)
- Replaced the single "Attack" with a 2-move kit per monster, making each turn
  a real choice instead of a button-mash.
- `battle.ts` — `Move {name, element|null, power}`; `movesFor(element)` gives a
  typed **Strike** (STAB, power 1.6, uses the element pentagon) and a typeless
  **Focus Blow** (power 2.2, always ×1.0). `computeDamage` now takes a move
  (typeless = no matchup). `pickEnemyMove` = greedy AI (best-damage move).
- `store.ts` — `battleAttack`→`battleMove(moveIndex)`; player picks a move,
  enemy counters with `pickEnemyMove`; tame-fail counter uses it too.
- `BattleScreen.tsx` — one button per move (name + type label) then Tame/Flee.
- Verified in-browser: Forest Kancil vs Spirit Gambang — Strike resisted for 9
  ("not very effective"), typeless Focus Blow hit 21 (2.3× more); Gambang's
  Spirit Strike was super-effective and KO'd the Lv1 Kancil (matchups bite both
  ways). Direct-tame path non-regressed. tsc + console clean. Screenshot
  /tmp/battle-moves.png.

## 2026-06-13 — Battle XP + level-up (roadmap #1 cont., msg #180)
- Winning a battle (enemy faints) or taming a weakened enemy now awards the lead
  party monster XP, which rolls into level-ups that raise its stats next fight.
- `battle.ts` — added `xpForDefeating(enemyLevel)=8+lvl*6`, `xpToNext(level)=
  12+level*8`, and `applyXp(level,xp,gain)` (rolls over multiple level-ups).
- `store.ts` — battleAttack (won branch) + battleTame (success branch) award XP
  to party[0] and log "gained N XP" / "grew to Lv N!".
- `HUD.tsx` — party panel row now shows `Lv · XP x/next · Bond`.
- Verified in-browser: Kancil won vs a Sky Camar (neutral, 16 dmg ×2) → +20 XP →
  Lv 2; then battled+tamed an Earth Watua (super effective) → +26 XP (Lv2, 26/28,
  no level yet — correct) and Watua joined (party→2). Party panel shows XP.
  tsc clean, console clean. Screenshots /tmp/battle-screen.png, /tmp/party-xp.png.

## 2026-06-13 — Turn-based battle scaffold (roadmap #1, msg #178)
- Roster is 12/12 true 3D, so Mahdy green-lit starting the battle system.
  Shipped the first slice: a real, playable weaken→tame battle loop.
- `src/game/battle.ts` — pure engine: element pentagon (Forest→Earth→Sky→Sea→
  Spirit, each ×1.5 vs the next / ×0.67 vs the previous), `makeCombatant` with
  gentle per-level stat scaling, `computeDamage` (atk*1.6 − def*0.8, ×eff),
  `tameChance` that ramps with how weakened the enemy is (up to +0.6 at low HP).
- `store.ts` — new `'battle'` mode + `battle` state; actions beginBattle (lead
  party monster vs the wild; empty party falls back to direct taming),
  battleAttack (player hit → enemy counter), battleTame (weaken-scaled odds; on
  fail the enemy counters), battleFlee, endBattle. Tame success adds to party +
  marks the wild removed.
- `BattleScreen.tsx` — full-screen overlay (enemy top-right, player bottom-left,
  HP bars, 3-line log, Attack/Tame/Flee). Reuses the 2D attack/hit sprite frames
  for a lunge/flinch on each hit. Reached via a "Battle to weaken" button added
  to the taming modal (shows only with ≥1 party monster).
- Verified: tsc clean; in-browser full loop — Forest Kancil vs Earth Bamut read
  "super effective" (14) / Bamut's "not very effective" counter (10), HP bars
  drained, weakened Bamut tamed, party 1→2, wild removed, endBattle→explore with
  message. Direct-tame path non-regressed (party→3). Console clean. Screenshot
  /tmp/battle-screen.png.
- Next slices (see docs/design.md): move-sets, staggered per-hit juice, XP +
  level-up on win, persist party HP, sfx/particles, mobile button sizing.

## 2026-06-13 — Rabuas 3D model (12th & final monster — roster COMPLETE)
- Built `src/models/rabuas.ts` (Rafflesia corpse-flower forest beast) from the
  in-game sprite + blurb: a warty green body (sphere + 12 wart bumps) on four
  stubby vine legs ending in bulbous leaf-pod feet, crowned by a five-petal
  Rafflesia bloom (deep-red cream-spotted petals via CanvasTexture, cupped
  forward) ruffing a toothy green toad-face (big amber eyes + catch-light, heavy
  brow, nostrils, dark grin with cream fangs), plus a couple of curling vine
  tendrils. Idle: breathing + bloom flex/sway + face bob + tendril sway.
  Registered `rabuas`. Hit the TS6133 unused-const trap once more (PETAL only
  used as a hex string inside petalTexture) — removed the const.
- Verified: tsc clean; QA front + 3/4 in model-viewer (bloom reads best at 3/4 —
  the lower petals tuck behind the body in straight-front; face/body/legs read
  well; console clean), restored the viewer import after; Rabuas renders in-world
  at spawn index 11 (wild-rabuas-11, x≈21.7 z≈-12.5) with the proximity prompt;
  full begin→tame→party loop intact (party 0→1 rabuas, mode→explore, nearby
  cleared); console clean. Screenshots /tmp/rabuas-front.png, /tmp/rabuas-34.png.
- **Milestone: all 12 roster monsters are now true from-scratch 3D models, each
  with a subtle idle flourish.** Roster porting (the core of msg #164) is done.

## 2026-06-13 — Watua 3D model (11th monster ported)
- Built `src/models/watua.ts` (treant / root-spirit) from the in-game sprite.
  The roster blurb calls Watua a "stone-spirit," but the art is a wood/root
  treant, so I modelled the sprite: a stout gnarled bark trunk (wood-grain
  CanvasTexture, body+head merged) with bark ridges, a heavy brow (half-torus),
  big amber eyes + catch-light, a bark nose, a hanging beard of root tendrils,
  stubby gnarled root arms + splayed root feet (tapered cones w/ finger nubs),
  moss patches, and a bushy low-poly leaf canopy (icosahedron clumps) crowning
  the head with willow drooping strands. Idle: slow patient sway + canopy
  rustle + beard drift. Registered `watua`. 11/12 roster now true 3D.
- Verified: tsc clean; QA front + 3/4 in model-viewer (face/canopy/arms read
  well; console clean), restored the viewer import after; Watua renders in-world
  at spawn index 10 (wild-watua-10) with the proximity prompt (it blends into
  the foliage, fittingly); full begin→tame→party loop intact (party 0→1,
  mode→explore, tamed flagged, nearby cleared); console clean. Screenshots
  /tmp/watua-front.png, /tmp/watua-34.png, /tmp/watua-world.png.

## 2026-06-13 — Naris 3D model (10th monster ported)
- Built `src/models/naris.ts` (storm-touched coiled naga) from the in-game
  sprite: an olive-green body coiled into two stacked banded toruses (red-brown
  chevron CanvasTexture), cream belly plates up the front, an upright torso
  rising to a frilled dragon head (spike fan) with big green eyes + catch-light,
  snout + nostrils, golden brow scales, a golden storm-smoke wisp (alternating
  partial-torus arcs) curling up from the crown, two little clawed arms resting
  on the coil, and a tapering tail curling up at the back with a golden tuft.
  Idle: breathing + smoke wisp curl/spin + head sway + tail drift. Registered
  `naris`. 10/12 roster now true 3D.
- Verified: tsc clean; QA front + 3/4 in model-viewer (the coiled banded body +
  smoke wisp read great; console clean), restored the viewer import after; Naris
  renders in-world at spawn index 9 (wild-naris-9) with the proximity prompt;
  full begin→tame→party loop intact (party 0→1, mode→explore, tamed flagged,
  nearby cleared); console clean. Screenshots /tmp/naris-front.png,
  /tmp/naris-34.png, /tmp/naris-world.png.

## 2026-06-13 — Ayaka 3D model (9th monster ported)
- Built `src/models/ayaka.ts` (dancing flame-spirit ram-bird) from the in-game
  sprite/portrait: a fluffy golden body with red flame-swirl batik markings
  (CanvasTexture), cream belly, a ruffled tuft skirt round the lower body, big
  curling ram horns (ridged partial-torus), big amber eyes + catch-light, small
  muzzle + nose, fluffy cheeks, a flickering flame crest on the head, a dramatic
  phoenix-like flame tail-plume sweeping up/back, and two orange talon legs.
  Flames are flattened emissive cones arranged in a fan (`flameFan` helper).
  Idle: dancing side-sway + breathing + crest flicker + tail sway. Registered
  `ayaka`. 9/12 roster now true 3D.
- Verified: tsc clean; QA front + 3/4 + back-3/4 in model-viewer (tail-plume
  reads great from behind; console clean), restored the viewer import after;
  Ayaka renders in-world at spawn index 6 (wild-ayaka-6) with the proximity
  prompt; full begin→tame→party loop intact (party 0→1 in 3 tries, mode→explore,
  tamed flagged, nearby cleared); console clean. Screenshots /tmp/ayaka-front.png,
  /tmp/ayaka-back.png, /tmp/ayaka-world.png.

## 2026-06-13 — Babur 3D model (8th monster ported)
- Built `src/models/babur.ts` (winged cloud-piglet) from the in-game sprite. The
  roster blurb calls Babur "tusked and territorial," but the art is a gentle
  sky-touched piglet, so I modelled the sprite: plump cream body with soft blue
  cloud-swirl flank markings (CanvasTexture), pink snout disc + two nostrils,
  rosy cheek blush, big heterochromia eyes (left amber, right blue) + catch-
  light, floppy pink ears, four little hooves, a curly tail, and a pair of
  feathered slate-blue wings. Idle: breathing + gentle wing-flap + tail wiggle.
  Registered `babur`. 8/12 roster now true 3D.
- Wings were the tricky bit: first pass the feathers were narrow flattened cones
  and read as a tiny spiky crest. Broadened each feather (scale 1.4,1,0.55),
  widened the specs, and splayed the fan outward (per-feather rotation.z) so the
  wing reads as a plume fan from the front + 3/4, not just the side.
- Verified: tsc clean; QA front-3/4 + side in model-viewer (console clean),
  restored the viewer import after; Babur renders in-world at spawn index 7
  (wild-babur-7) with the proximity prompt; full begin→tame→party loop intact
  (party 0→1 in 2 tries, mode→explore, tamed flagged, nearby cleared); console
  clean. Screenshots /tmp/babur-v3-34.png, /tmp/babur-world.png.

## 2026-06-13 — Kepiting 3D model (7th monster ported)
- Built `src/models/kepiting.ts` (armoured reef crab) from the in-game sprite
  (no ref sheet): a wide domed carapace with a mottled crusty CanvasTexture +
  cream barnacle freckles, a lighter tan belly-plate with two mask dimples,
  cream barnacle nodules crusting the rim, a pink-red branching coral crown on
  top, two black eyes (golden rings + catch-light) on short eyestalks, two big
  pincer claws (segmented arms + open jaws with pink inner edges, barnacle-
  crusted palms), and three pairs of segmented walking legs. Idle: gentle
  breathing + claws slowly open/close. Registered `kepiting`.
- First pass the coral crown was a tiny bump; enlarged its branches/bulbs +
  added side nubs so it reads as a proper reef fan like the sprite.
- Verified: tsc clean; QA front + 3/4 in model-viewer (console clean), restored
  the viewer import after; Kepiting renders grounded in-world with the proximity
  prompt; full begin→tame→party loop intact (party 0→1, mode→explore, tamed
  hidden, nearby cleared). Screenshots /tmp/kepiting-v2.png, /tmp/kepiting-world.png.
  7/12 roster now true 3D.

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
