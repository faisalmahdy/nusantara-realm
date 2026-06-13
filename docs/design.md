# Design & roadmap

Last touched: 2026-06-14 (ranch: HP persistence + rest)

## Pillars (from Mahdy, msg #126/#128/#130)
- **Pokémon-style taming** — roam, find wild monsters, win them over.
- **Monster Rancher-style raising** — bond, level, care for the roster.
- **Fable-style open world** — continuous explorable 3D realm.
- HD-2D: 2D Nusantara art as billboards in a true 3D world.

## v0 (shipped 2026-06-13)
Explorable overworld, follow camera w/ drag-orbit, player walk frames,
12 wild monsters bobbing in a ring, proximity taming prompt, taming modal
(species stats + treat/tame), party panel. Taming odds scale with rarity.

## Roadmap (priority order — pick ONE per loop iteration)
0. **TRUE 3D MODELS (current focus, Mahdy msg #134)** — replace the 2D
   billboards with from-scratch Three.js meshes built from our character
   reference sheets. See docs/models.md. Refine Kancil, then build out the
   roster (sheets exist for camar/penyu/ubur/karang-raksasa/etc.), add a model
   registry, and render models in the world instead of sprites.
1. **Turn-based battle** — SCAFFOLD SHIPPED (2026-06-13). Engine in
   `src/game/battle.ts` (element pentagon Forest→Earth→Sky→Sea→Spirit, ×1.5/×0.67
   matchups, level-scaled stats, weaken-scaled tame odds), store actions
   (beginBattle/battleAttack/battleTame/battleFlee/endBattle), full-screen
   `BattleScreen.tsx` reusing the 2D attack/hit frames. Reached from the taming
   modal's "Battle to weaken" button (needs ≥1 party monster; empty party still
   direct-tames). XP + level-up DONE (2026-06-13): winning OR taming awards the
   lead monster XP (`xpForDefeating`/`xpToNext`/`applyXp` in battle.ts), rolling
   into stat-raising level-ups; party panel shows XP progress. Move-sets DONE
   (2026-06-13): each monster has a typed Strike (STAB, ×matchup) and a typeless
   Focus Blow (always ×1.0 but higher power) — pick Focus Blow when your element
   is resisted; enemy AI greedily picks its best move (`movesFor`/`pickEnemyMove`
   in battle.ts). Hit juice DONE (2026-06-13): staggered floating damage numbers
   (your strike pops first, then the counter) + a brightness-flash/shake on the
   struck fighter (BattleScreen.tsx, visual-only). STILL TO DO: persist party HP
   between battles, sfx/particles, mobile button sizing.
2. **Ranch / bonding loop** — Feed DONE (2026-06-13): party panel has a per-
   monster Feed button (`feed(uid)` in store.ts) that raises bond +8 (pink bond
   bar, capped 100) and grants +5 XP via `applyXp`; stops rewarding once a
   monster is fully content so it can't be button-mashed for infinite levels.
   Bond perk DONE (2026-06-14): a bonded lead deals up to +20% battle damage
   (`bondAtkMult` in battle.ts, applied in `computeDamage`; shown as ♥bond on the
   battle fighter + a log note at bond≥50). HP persistence + Rest DONE
   (2026-06-14): a monster's battle damage now carries between fights
   (`TamedMonster.hp`); the party panel shows an HP bar + a Rest button (heals to
   full); a fainted lead can't battle until rested. STILL TO DO: a proper ranch
   screen/biome, make Feed/Rest cost something (treats/cooldown) vs free buttons.
3. **Evolution stages** — the 2D game has 2/3-stage chains (e.g. bamut2/bamut3
   assets exist); wire level-gated evolution.
4. **World richness** — biomes (forest vs coast), water plane, day/night, more
   scenery variety, collision with trees.
5. **Polish** — soft shadows/contact shadows under billboards, particle on tame,
   audio, mobile touch controls (on-screen stick + tame button).
6. **Persistence** — save party to localStorage.

## Taste rules (from memory)
- Action-reactive poses ok (hurt/victory/gather); never sleep-on-idle.
- Arenas = simple flat stage, monster reads as standing ON it.
- Keep it readable and performant on mobile (Mahdy tests on phone).
