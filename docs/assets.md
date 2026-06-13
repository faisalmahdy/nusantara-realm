# Assets

Last touched: 2026-06-13

All art reused from the 2D Nusantara Monster project — no new art generated yet.

## Source
`/workspace/agent/projects/nusantara-monster/public/`
- `sprites/<id>/{idle,attack,hit,portrait}.png` per monster
- `sprites/player/{front_idle,back_idle,front_walk_0..3,back_walk_0..3,...}.png`
- `assets/world/{grass-base,grass-alt,path,tree-banyan,tree-palm,fern}.png`

## In this project (`public/`)
- `world/` — grass-base, grass-alt, path, tree-banyan, tree-palm, fern.
- `sprites/player/` — full player frame set (idle + walk, front + back).
- `sprites/<id>/` — 12-monster roster, each idle/attack/hit/portrait:
  matong, kancil, dugang, camar, gambang, bamut, ayaka, babur, kepiting,
  naris, watua, rabuas. (banyan/karang/penyu/ubur/warking also copied, unused.)

## Notes
- Pixel-art filtering: NearestFilter, SRGBColorSpace, anisotropy 4.
- attack/hit frames are shipped but NOT yet used — reserved for the battle loop.
- To add more monsters: copy the dir into `public/sprites/<id>/` and add a
  `SPECIES` entry in `src/game/monsters.ts`.
- New art (if generated): Higgsfield CLI, `gpt_image_2` (see memory skill).
