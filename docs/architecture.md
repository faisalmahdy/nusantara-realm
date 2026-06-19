# Architecture

Last touched: 2026-06-19 (Meshy GLB pipeline retired; bundle chunked)

## Art mode (`src/game/config.ts`)
- `ART_MODE` ('hd2d' | '3d') switches the visual pipeline. **'hd2d'** (default,
  shipped): everything is 2D sprites as billboards (player, wild monsters,
  scenery, party viewer). **'3d'** (opt-in legacy): only wild monsters render as
  the from-scratch procedural meshes — `MonsterModel` + the `models/*.ts`
  builders are **code-split into a lazy chunk** (`WildMonster` lazy-imports it),
  so they never load in HD-2D. Player/scenery/party-viewer stay 2D in both modes.
- **No `.glb` is ever fetched.** The Meshy GLB pipeline (assets in
  `public/models/`, the `drei useGLTF` loaders, and `WorldProp`/`PartyViewer3D`/
  the player GLB) was removed once HD-2D was chosen — first load is sprites only.
- Build (`vite.config.ts`): three + react are split into their own cacheable
  vendor chunks; only the small app chunk (~57 KB gzip) changes per deploy.

## Entry
- `index.html` → `src/main.tsx` (mounts `<App/>`, exposes `window.__realm`).
- `src/App.tsx` — `<Canvas>` (R3F) wrapping `<GameScene>` in `<Suspense>`, plus
  the DOM `<HUD/>` overlay sibling.

## 3D scene (`src/components/`)
- `GameScene.tsx` — mounts DayNight/World/Player/WildMonsters/Camera.
  Builds the wild spawn ring from `SPECIES`.
- `DayNight.tsx` — animates a 120s day/night cycle (useFrame): orbits the sun,
  lerps sky/fog + sun + hemisphere colors and intensities through
  noon→dusk→night→dawn. Mutates the scene's own background/fog objects in place.
  Starts at midday (+0.25 phase offset).
- `World.tsx` — grass ground plane + path strip (RepeatWrapping) + scattered
  scenery billboards from `game/scenery.ts`.
- `game/scenery.ts` — deterministic scenery layout (mulberry32, seed 1337),
  shared by World (render) and Player (collision). Exports `WORLD=90`, `SCENERY`
  (each with a trunk radius `r`; ferns r=0), and `COLLIDERS` (trees only).
- `Sprite3D.tsx` — the HD-2D primitive: a camera-facing `<sprite>` with a
  NearestFilter pixel texture, aspect-from-image scaling, base-anchored.
  Also `loadPixelTexture(url)` (cached) for non-suspense texture loads.
- `Player.tsx` — keyboard movement (camera-relative), directional walk-frame
  swap, writes `playerPos`, reads/begins taming on `E`. Resolves circular
  push-out against `COLLIDERS` each move (slides around tree trunks).
- `WildMonster.tsx` — bobbing idle billboard + element ring; proximity sets
  `nearbyWildId`; removed once tamed.
- `CameraRig.tsx` — third-person follow (lerp) + pointer-drag orbit.

## State (`src/game/`)
- `store.ts` — zustand (wrapped in `persist`: saves party + tamedWildIds to
  localStorage `nusantara-realm-save`, rehydrate restores uidCounter):
  mode ('explore'|'taming'|'party'|'battle'), party[],
  tamedWildIds[], nearbyWildId, tamingTargetId, battle, message; actions
  beginTaming/cancelTaming/tame, beginBattle/battleMove/battleTame/battleFlee/
  endBattle, feed (ranch: +bond/+XP, capped), rest (heal to full), flash.
  TamedMonster carries `hp` (persists battle wear; endBattle writes it back,
  beginBattle reads it and blocks a fainted lead).
- `monsters.ts` — `SPECIES` roster + stats, element colors, `speciesById`.
- `battle.ts` — pure battle engine: element pentagon + `effectiveness`,
  `makeCombatant` (level-scaled stats + `movesFor`), `computeDamage(…, move)`
  (scales the attacker by `bondAtkMult` — bonded lead hits up to +20% harder),
  `pickEnemyMove` (greedy AI), `tameChance`, XP (`xpForDefeating`/`applyXp`).
- `shared.ts` — module-level `playerPos` Vector3 + `cameraState.orbit` +
  `touchInput` joystick vector (shared refs read every frame, not React state).
- `useKeyboard.ts` — WASD/arrows/E → a mutable ref (no re-renders).
- `audio.ts` — procedural Web Audio engine (no asset files): gamelan-ish
  `explore`/`battle` music loops (look-ahead scheduler) + SFX; exposes
  `initAudio`/`playMusic`/`stopMusic`/`sfx.*` + mute/volume (persisted). The
  store calls `sfx.*` on game events; all calls no-op until the context unlocks.

## HUD (`src/components/HUD.tsx`)
DOM overlay: title, controls, taming prompt, flash message, Party button+panel,
and the taming modal. Inline-styled; `pointerEvents:auto` only on interactive bits.
The taming modal shows a "Battle to weaken" button when the party is non-empty.
- `TouchControls.tsx` — on-screen joystick (writes `shared.touchInput`) + E/tame
  button; mounted by HUD in explore mode for phone play.
- `AudioControls.tsx` — unlocks the AudioContext on first gesture, syncs the
  music loop to game `mode` (explore↔battle), renders the mute + volume control.
The party panel rows show HP + bond bars and Feed/Rest buttons (store `feed`/`rest`).
- `BattleScreen.tsx` — full-screen battle overlay (mounted by HUD when
  mode==='battle'): enemy + player fighters with HP bars, a battle log, and
  per-move/Tame/Flee actions; swaps to the 2D attack/hit sprite frames on a hit.
  Hit juice (visual-only): tracks HP deltas to pop staggered floating damage
  numbers (enemy first, player counter delayed ~280ms) + a flash/shake on the
  struck fighter.
