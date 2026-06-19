// ---------------------------------------------------------------------------
// Art direction (the project's signature-look decision, see docs/plan-10x.md).
//
//   'hd2d' — the 2D Nusantara pixel-art sprites planted as camera-facing
//            billboards in the real 3D world (Octopath-style). Distinctive,
//            cohesive, and very light: ~11 MB of sprites instead of ~372 MB of
//            Meshy GLBs, so it loads on a phone. This is now the shipped look.
//
//   '3d'   — the Meshy-generated GLB models (player/monsters/props). Kept as an
//            opt-in fallback so the work isn't lost and the two can be compared.
//
// Flipping this one constant swaps every renderer (player, wild monsters,
// scenery props, party viewer) between the two pipelines. In 'hd2d' mode no
// GLB is ever fetched.
// ---------------------------------------------------------------------------
export type ArtMode = 'hd2d' | '3d';

export const ART_MODE: ArtMode = 'hd2d';
