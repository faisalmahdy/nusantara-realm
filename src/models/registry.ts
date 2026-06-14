import * as THREE from 'three';
import { buildKancil } from './kancil';
import { buildCamar } from './camar';
import { buildMatong } from './matong';
import { buildDugang } from './dugang';
import { buildBamut } from './bamut';
import { buildGambang } from './gambang';
import { buildKepiting } from './kepiting';
import { buildBabur } from './babur';
import { buildAyaka } from './ayaka';
import { buildNaris } from './naris';
import { buildWatua } from './watua';
import { buildRabuas } from './rabuas';

// Maps a species id to its from-scratch Three.js builder. Species absent from
// this map still render as 2D billboards in the world (ported over time).
export const MODEL_BUILDERS: Record<string, () => THREE.Group> = {
  kancil: buildKancil,
  camar: buildCamar,
  matong: buildMatong,
  dugang: buildDugang,
  bamut: buildBamut,
  gambang: buildGambang,
  kepiting: buildKepiting,
  babur: buildBabur,
  ayaka: buildAyaka,
  naris: buildNaris,
  watua: buildWatua,
  rabuas: buildRabuas,
};

// Species with a Meshy-generated GLB in public/models/<id>.glb. These take
// priority over the procedural builder (see MonsterModel).
export const GLB_MODELS = new Set<string>([
  'kancil', 'matong', 'dugang', 'camar', 'gambang', 'bamut',
  'ayaka', 'babur', 'kepiting', 'naris', 'watua', 'rabuas',
]);

// Every base-GLB species also shipped evolution-stage models <id>2.glb and
// <id>3.glb in public/models/ (see docs/models.md).
export const GLB_STAGE_MODELS = new Set<string>();
for (const id of GLB_MODELS) { GLB_STAGE_MODELS.add(`${id}2`); GLB_STAGE_MODELS.add(`${id}3`); }

// Resolve a species + evolution stage to its GLB file id (stage 1 = base id).
export function stageGlbId(speciesId: string, stage: number): string {
  return stage <= 1 ? speciesId : `${speciesId}${stage}`;
}

export function hasGlb(id: string): boolean {
  return GLB_MODELS.has(id) || GLB_STAGE_MODELS.has(id);
}

export function hasModel(id: string): boolean {
  return id in MODEL_BUILDERS || GLB_MODELS.has(id);
}
