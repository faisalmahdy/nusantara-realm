// ---------------------------------------------------------------------------
// Art direction (the project's signature-look decision, see docs/plan-10x.md).
//
//   'hd2d' — the 2D Nusantara pixel-art sprites planted as camera-facing
//            billboards in the real 3D world (Octopath-style). Distinctive,
//            cohesive, and very light (~11 MB of sprites). This is the shipped
//            look.
//
//   '3d'   — opt-in legacy mode: wild monsters render as the from-scratch
//            procedural Three.js meshes (src/models/*.ts), lazy-loaded so they
//            never touch the default bundle. The player, scenery and party
//            viewer stay 2D in this mode too — their only 3D form was the Meshy
//            GLB pipeline, which was retired (assets + loaders removed) once
//            HD-2D was chosen, so no `.glb` is fetched in either mode.
// ---------------------------------------------------------------------------
export type ArtMode = 'hd2d' | '3d';

export const ART_MODE: ArtMode = 'hd2d';
