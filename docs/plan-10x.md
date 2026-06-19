# Plan: Making Nusantara Realm 10× Better

A strategy doc written as a **writers'-room roundtable of ten game-dev personas**,
each reading the *actual* repo as it stands on 2026-06-19, then a synthesized,
phased roadmap. (This is a longer strategic doc by design — the lean operational
docs in this folder stay < 70 lines; this one is the north star they serve.)

---

## TL;DR

Nusantara Realm is a genuinely promising **monster-taming RPG built on
Indonesian folklore** — a niche nobody owns. The engine work is real: explore →
tame → battle → raise → evolve all function. But today it plays like a
**tech demo**: 12 monsters in a static ring, on one flat green field, in total
silence, with 372 MB of un-optimized 3D models that would crush a phone — which
is the owner's own test device.

**The 10× is not more features. It is turning a sandbox into a *place worth being*.**
Three moves unlock it:

1. **Fix the foundations that block everyone** — compress assets (372 MB → <15 MB),
   add audio, add CI + tests. (Week 1.)
2. **Ship one island, done right** — a vertical slice with narrative, a real
   biome, an economy, party-based battles, and a boss. Prove it's *fun*, not just
   functional. (Weeks 2–6.)
3. **Lean all the way into Nusantara** — folklore, gamelan, batik. That's the moat.

The single biggest unblock-everything fix and the single biggest decision:
**compress the GLBs**, and **resolve the art direction (HD-2D vs stylized 3D)**.

---

## Current-state scorecard

| Dimension | State | Grade |
|---|---|---|
| Core loop (explore→tame→battle→raise) | Implemented, works end-to-end | B+ |
| Battle system (pentagon, moves, XP, bond, HP) | Surprisingly deep for v0 | B |
| World / content | 1 flat biome, 12 static spawns, no respawn, no goals | D |
| Narrative / world identity | None yet (rich folklore unused) | F |
| Art direction | Identity crisis: 2D→Meshy-3D pivot, generic auto-gen hero art | C− |
| Asset pipeline / perf | **372 MB GLBs, avg 9.3 MB, trees 12 MB each** | F |
| Audio | **Total silence — zero assets** | F |
| UX / onboarding / mobile | Touch controls exist; no tutorial, thin UI | C− |
| Code health (tests, CI, lint) | Clean ~4.3k LOC, but **0 tests, no CI, no lint** | C |
| Process | Disciplined AI loop + docs; but drifting, momentum stalled ~5 days | B− |
| Distribution / analytics / community | Deployed, but no telemetry, funnel, or audience | D |

---

## The roundtable

> Personas are lenses, not real people. Indonesian names are used in the spirit
> of the project. Each gives: what they see, the 10× opportunity, and top moves.

### 1. Creative Director — "Anjani" (vision & pillars)
**Sees:** The pillars (Pokémon × Monster Rancher × Fable) are clear, and the
*creatures* already carry the soul — Kancil the trickster mousedeer, Naris the
naga, Rabuas the Rafflesia beast, batik-patterned hides. But the **experience**
has no soul yet: no journey, no stakes, no sense of *place*. It's a sandbox, not
a world.
**10× opportunity:** Stop competing with Pokémon on Pokémon's turf. **Own
Nusantara.** No major taming game is built on Indonesian myth — that is the moat
and the press hook. Define a single player fantasy and commit:
> *"You are a young **Pawang** (tamer) journeying a fractured archipelago,
> winning over its mythic beasts to restore the balance the islands have lost."*
**Top moves:** (a) Write a one-page vision/pillars doc. (b) Define the
60-second / 60-minute / 6-hour experience. (c) Pick one signature "wow" moment
(e.g., taming a region's Guardian at dusk as the gamelan swells) and build
toward it.

### 2. Lead Game Designer — "Rama" (systems & loops)
**Sees:** Strong bones — element pentagon (`battle.ts`), bond→+20% damage,
XP/level-up, weaken-then-tame odds. But the systems don't *interlock*: spawns
are a finite static ring of 12 (no respawn), you only ever fight with
`party[0]` (the rest of your roster is decorative), Feed/Rest are free buttons
(no economy), evolution is **cosmetic-only**, and there's no goal or win state.
**10× opportunity:** Make the *team* and the *world* matter.
- **Party-based battles** — switch monsters mid-fight; type coverage becomes a
  real decision (right now a 6-mon party is pointless).
- **Encounter & respawn system** — biome-tagged spawns so the world is huntable,
  not a one-time clear.
- **A real economy** — treats/currency from battles & foraging gate Feed/Rest
  and taming items; turns free buttons into meaningful choices.
- **Goal structure** — region "Guardian" challenges (gym-like) that gate
  progression and give the loop a spine.
- **Evolution as an *event*** — a level-up flourish (and a choice/branch), not a
  silent model swap.
**Top moves (priority):** party switching in battle → respawn/encounter system →
treat economy → first Guardian boss.

### 3. Narrative & World Designer — "Sekar" (story & lore)
**Sees:** A narrative vacuum sitting on top of a goldmine. Every species already
has a folklore-rooted blurb; the reference sheets even include unused myth
figures (Nyai Segara the sea queen, Penunggu Banyan the banyan guardian). None
of it is *in the game.*
**10× opportunity:** A light but evocative narrative spine — you don't need
cutscenes, you need *texture*.
- A framing myth (the archipelago's balance broken; the beasts gone wild).
- **Islands as regions**, each with a culture, biome, and local legend.
- **Lore cards** unlocked on taming (turn the party panel into a living
  almanac) — cheap, high-emotion, drives "gotta tame 'em all."
- A few NPC tamers/villagers with a handful of lines each.
- Treat real Indonesian mythology with respect and credit it (an in-game
  "inspired by" almanac note).
**Top moves:** write a story bible (framing myth + 5 island regions) → lore
cards on tame → first village with 3–4 NPCs.

### 4. Art Director — "Dewi" (visual identity)
**Sees:** A genuine identity crisis in the git history. The project started as
**HD-2D** — hand-drawn 2D sprites as billboards in a 3D world (the *Octopath*
look), which is distinctive, cheap, performant, and the 2D art is genuinely
good. Then it pivoted to **Meshy.ai auto-generated 3D**, which the docs *admit*
is generic ("won't be painterly," `docs/models.md`) — and the result is heavy,
soulless blobs as the hero art. The world is one flat green plane.
**10× opportunity:** **Decide the look and commit.** Recommendation: **make
HD-2D the signature style** — bring back the beautiful 2D creatures as
billboards, use 3D selectively for *environment* (terrain, water, props), and
get a cohesive painterly world around them. (Alternative: commit to consistent
stylized 3D *with a human art pass* — but don't ship auto-gen Meshy as hero
art.) Either way: a real style guide, a batik-inspired UI palette (gold/jewel
tones), and **environment art** — biomes, water, skyboxes, distant vistas.
**Top moves:** make the art-direction call (see Decisions) → style guide →
biome art kit + water/sky → UI reskin with batik motif.

### 5. Technical Artist / 3D Pipeline — "Bayu" (the asset crisis)
**Sees:** **The single most urgent problem in the project.** `public/models/`
is **372 MB across 40 GLBs — averaging 9.3 MB each, with single tree models at
12 MB.** Meshy output is completely un-optimized: no Draco/meshopt geometry
compression, full-resolution PBR textures, no LODs, and ~80 identical trees each
loading their own mesh. A first-time mobile visitor would download hundreds of
MB before seeing anything. **This silently caps the game's reach near zero.**
**10× opportunity:** A real asset pipeline — this alone 10×'s load time and
framerate.
- **`gltf-transform`**: Draco/meshopt geometry + **KTX2/Basis** textures +
  prune/dedupe → typically **10–20× smaller** (372 MB → realistically <20 MB).
- **Instancing** the ~80 trees/ferns (one mesh, many transforms).
- **LODs** + **lazy/streamed loading** (only load models for nearby monsters).
- A **load budget** (target < 15 MB initial) enforced in CI.
**Top moves:** run gltf-transform over all 40 GLBs (compress + KTX2 + prune) →
instance scenery → set & CI-check the budget. *This is the highest-ROI task in
the whole plan.*

### 6. Technical Director / Lead Engineer — "Tio" (architecture & robustness)
**Sees:** A clean, readable R3F codebase (~4.3k LOC, tidy zustand store) — good
hygiene. But **zero tests, no lint/format config, no CI** (the workflow was
deleted), and the build is just `tsc && vite build`. The battle engine
(`battle.ts`) is *pure* and *begging* for unit tests. Player state is a single
global mutable (`shared.ts`) — fine now, won't scale to NPCs/multiplayer. No
error boundary, no telemetry, no perf monitoring.
**10× opportunity:** Make it robust enough to iterate fast without regressions.
- **Vitest** unit tests on `battle.ts` (pure logic → highest test ROI).
- **CI** (GitHub Actions): lint + typecheck + build + **bundle/asset-size gate**.
- **ESLint + Prettier**.
- **Error boundary** + lightweight error reporting (Sentry).
- Perf: instancing, frustum culling, R3F `frameloop="demand"` where possible.
- As content grows, factor a **systems/entity layer** over ad-hoc components.
**Top moves:** Vitest + first `battle.ts` tests → restore CI with a size gate →
error boundary.

### 7. UX / UI & Accessibility — "Indah" (the player's first 5 minutes)
**Sees:** The HUD is inline-styled DOM — functional, minimal. Mobile controls
exist (real credit — the owner tests on a phone) but are always-on and battle
buttons are noted as too small. **There is no onboarding** — a new player is
dropped in cold and must guess everything. No settings menu. No accessibility
(element colors aren't colorblind-safe; no text scaling; no reduced-motion).
**10× opportunity:** Nail the first 60 seconds and the polish layer.
- A **guided intro**: walk → approach → tame → battle, surfaced contextually.
- A proper **responsive, thumb-reachable** mobile UI; bigger battle buttons.
- A **settings panel** (audio, quality, controls, reset/new-game save).
- **Accessibility**: element **icons** (not color alone), scalable text,
  reduced-motion toggle.
- A real **Almanac/Pokédex** screen (ties into Sekar's lore cards).
**Top moves:** tutorial flow → mobile UI pass → settings → element icons.

### 8. Audio Director — "Galih" (the silence)
**Sees:** **Total silence.** `find` confirms zero audio files. For a taming RPG,
audio is half the emotional payload — the tame jingle, the battle theme, the
level-up sting are *the feeling*. Cheap, huge, glaring win.
**10× opportunity:** An audio identity rooted in place.
- A **gamelan**-inspired score — iconic, evocative, almost unused in games — for
  exploration + a driving battle theme.
- Per-biome **ambient beds** (jungle, surf, highland wind).
- Juicy **SFX**: footsteps, tame-success jingle, hit impacts, level-up &
  **evolution** flourishes.
- Tech: Howler.js or Web Audio; small/streamed files; volume + mute in settings.
**Top moves:** wire an audio lib + core SFX set (walk/tame/hit/win/evolve) →
looping gamelan explore + battle themes → settings volume/mute.

### 9. Producer — "Mira" (process & roadmap)
**Sees:** A genuinely effective and unusual process — an **autonomous hourly AI
loop** with a human steering, disciplined `log.md`/docs convention,
one-shippable-change-per-iteration. It produced a lot, fast. **But** the loop
optimizes for *local* wins, which is exactly why the game is feature-rich yet
content-thin and direction-drifting (HD-2D→3D, cosmetic evolution). Momentum has
stalled (~5 days since last commit) and there's no milestone or definition of
"good enough."
**10× opportunity:** Give the loop a **spine** without losing its speed.
- Replace "pick one roadmap item" with **milestone themes** (e.g., *Month 1: the
  Vertical Slice — one island, start to finish*).
- Define the **north-star metric** and a **playable-demo target**.
- Run the autonomous loop *inside* a milestone, with a **human review gate** at
  each milestone boundary.
- Keep the excellent log discipline; add an exit-criteria checklist per milestone.
**Top moves:** convert this plan into milestones with exit criteria → a project
board → a milestone review cadence.

### 10. Growth / Live-Ops / QA / Community — "Eka" (closing the loop with players)
**Sees:** It's deployed (Cloudflare) and public, but **flying blind** — no
analytics, no telemetry, no playtest funnel, no community, no store page. There's
no way to know if anyone plays or where they drop. QA is manual screenshots.
**10× opportunity:** Connect to real players.
- **Privacy-friendly analytics** (Plausible/PostHog) + a funnel:
  load → walk → first tame → first battle → return.
- A **shareable hook**: a "share your team" / screenshot card (organic reach).
- An **itch.io page + devlog** — the Indonesian-folklore angle is press-friendly.
- A small **playtest cohort** (start with the owner's network).
- An automated **Playwright smoke test** of the core loop in CI.
**Top moves:** analytics + core funnel → Playwright smoke test → itch.io page +
first devlog.

---

## Synthesized roadmap (four horizons)

### Horizon 0 — Foundations / "Stop the bleeding" (Week 1)
*High-ROI, low-controversy, unblocks everyone.*
- [x] **Asset weight fixed (2026-06-19)** — superseded by the HD-2D switch +
      removing all 40 GLBs: deploy 385 MB → 13 MB, first load ~11 MB of sprites,
      0 `.glb` fetched. (Made the gltf-transform/compress task moot.)
- [x] **Bundle chunked (2026-06-19)** — 3D path lazy-split; three/react in their
      own cacheable vendor chunks; first-load ~271 KB gzip (three.js floor).
- [n/a] **Instance** scenery — moot in HD-2D (scenery is cheap 2D billboards).
- [x] **Audio (2026-06-19)** — procedural Web Audio engine (`game/audio.ts`):
      gamelan-flavored explore + battle loops, SFX (step/tame/hit/level/evolve/
      battle-start/UI), mute+volume control. Zero asset files (~2 KB gzip).
- [ ] **Restore CI**: lint + typecheck + build + **asset-size gate**.
- [ ] **First tests**: Vitest over `battle.ts` (effectiveness, damage, XP, evo).
- [x] **60-second tutorial (2026-06-19)** — `Tutorial.tsx`: a 5-step contextual
      onboarding chain (walk → approach → E → tame → open Party) that advances as
      the player acts; skippable, shown once (localStorage).

### Horizon 1 — The Vertical Slice: "One island, done right" (Weeks 2–6)
*Prove the game is **fun**, not just functional. This is the make-or-break.*
- [~] **Biome — ocean + beach (2026-06-19)** — `Ocean.tsx`: the island now sits
      in a sea (shore ring + animated water + horizon fade, lit by day/night).
      Still to do: framing myth, terrain variety, distinct sub-biomes.
- [x] **Encounter/respawn (2026-06-19)** — `game/spawns.ts` + GameScene timer:
      tamed slots respawn a fresh random wild after 3.5s so the world stays
      huntable. (Biome-tagged encounter tables still to come.)
- [ ] **Party switching in battle** + a **treat economy** for Feed/Rest/taming.
- [ ] One **Guardian boss** as the region's goal + an evolution-as-event moment.
- [x] **Field Guide / Almanac + folklore lore (2026-06-19)** — `Almanac.tsx`:
      all 12 species with lore that unlocks on taming, "N/12 discovered". Still
      to do: a first **village + NPCs**.
- [ ] A **gamelan** explore theme + battle theme; mobile UI + settings pass.
- [ ] **Analytics funnel** live; **Playwright** smoke test in CI.

### Horizon 2 — Depth & Identity (Months 2–3)
- [ ] **Resolve & execute the art direction** (HD-2D vs stylized 3D — *decide
      before scaling content*).
- [ ] 2–3 more **regions/biomes** with their own myth, monsters, Guardian.
- [ ] **Narrative spine** across regions; accessibility pass (icons, scaling,
      reduced-motion).
- [ ] **Tune from data** (where do players drop? which monsters get tamed?).

### Horizon 3 — Reach (Month 3+)
- [ ] Distribution polish (web + itch.io), **share** hook, devlog cadence.
- [ ] Light **live-ops** (seasonal monster, community challenges).
- [ ] Roster/region expansion driven by what players actually engage with.

---

## Quick wins (this week, in priority order)
1. **Compress the GLBs.** Biggest single quality jump; unblocks mobile (the
   owner's own device). *(Bayu)*
2. **Add core SFX + one music loop.** Silence → soul, cheaply. *(Galih)*
3. **Restore CI + first `battle.ts` tests.** Stop regressions cold. *(Tio)*
4. **A 60-second tutorial.** Turn "what do I do?" into "oh, neat!" *(Indah)*

## Decisions needed from Mahdy
1. **Art direction (the big one): ✅ DECIDED 2026-06-19 — revived HD-2D.** The 2D
   sprites are billboards again behind `ART_MODE='hd2d'`; 3D is opt-in. Bonus: in
   hd2d no GLB is fetched, so this also resolved the 372 MB load problem (Bayu's
   Horizon-0 item) — first load is now ~11 MB of sprites.
2. **Narrative scope:** light texture (lore cards + a framing myth) vs a fuller
   story with NPCs and quests?
3. **Budget/help:** stay AI-assisted only, or bring in a human **composer/artist**
   for hero assets? Affects quality ceiling and timeline.
4. **Process:** adopt **milestone themes** (Horizon model) over the
   one-change-per-hour loop?

## Risks
- **Asset weight kills reach** if not fixed first (Horizon 0, #1).
- **Scope creep** — the AI loop adds features faster than depth; the milestone
  spine (Mira) is the guardrail.
- **Art incoherence** — shipping more auto-gen 3D before the direction is
  settled compounds the problem.
- **Cultural authenticity** — Nusantara folklore is the moat *only if* handled
  with respect and credit.

## North-star metric
**Day-1 return rate of first-time players who complete one tame** — it captures
"did they get in (load/onboarding), did they feel something (audio/juice), and
do they want more (loop/goals)?" all at once. Everything above moves this number.
