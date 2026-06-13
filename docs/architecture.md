# Architecture

Last touched: 2026-06-13 (turn-based battle scaffold)

## Entry
- `index.html` → `src/main.tsx` (mounts `<App/>`, exposes `window.__realm`).
- `src/App.tsx` — `<Canvas>` (R3F) wrapping `<GameScene>` in `<Suspense>`, plus
  the DOM `<HUD/>` overlay sibling.

## 3D scene (`src/components/`)
- `GameScene.tsx` — lights, fog, background, mounts World/Player/WildMonsters/Camera.
  Builds the wild spawn ring from `SPECIES`.
- `World.tsx` — grass ground plane + path strip (RepeatWrapping) + scattered
  scenery billboards (deterministic mulberry32 RNG, seed 1337). Exports `WORLD=90`.
- `Sprite3D.tsx` — the HD-2D primitive: a camera-facing `<sprite>` with a
  NearestFilter pixel texture, aspect-from-image scaling, base-anchored.
  Also `loadPixelTexture(url)` (cached) for non-suspense texture loads.
- `Player.tsx` — keyboard movement (camera-relative), directional walk-frame
  swap, writes `playerPos`, reads/begins taming on `E`.
- `WildMonster.tsx` — bobbing idle billboard + element ring; proximity sets
  `nearbyWildId`; removed once tamed.
- `CameraRig.tsx` — third-person follow (lerp) + pointer-drag orbit.

## State (`src/game/`)
- `store.ts` — zustand: mode ('explore'|'taming'|'party'|'battle'), party[],
  tamedWildIds[], nearbyWildId, tamingTargetId, battle, message; actions
  beginTaming/cancelTaming/tame, beginBattle/battleAttack/battleTame/battleFlee/
  endBattle, flash.
- `monsters.ts` — `SPECIES` roster + stats, element colors, `speciesById`.
- `battle.ts` — pure battle engine: element pentagon + `effectiveness`,
  `makeCombatant` (level-scaled stats + `movesFor`), `computeDamage(…, move)`,
  `pickEnemyMove` (greedy AI), `tameChance`, XP (`xpForDefeating`/`applyXp`).
- `shared.ts` — module-level `playerPos` Vector3 + `cameraState.orbit`
  (shared refs read every frame, not React state).
- `useKeyboard.ts` — WASD/arrows/E → a mutable ref (no re-renders).

## HUD (`src/components/HUD.tsx`)
DOM overlay: title, controls, taming prompt, flash message, Party button+panel,
and the taming modal. Inline-styled; `pointerEvents:auto` only on interactive bits.
The taming modal shows a "Battle to weaken" button when the party is non-empty.
- `BattleScreen.tsx` — full-screen battle overlay (mounted by HUD when
  mode==='battle'): enemy + player fighters with HP bars, a battle log, and
  Attack/Tame/Flee actions; swaps to the 2D attack/hit sprite frames on a hit.
