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

export function hasGlb(id: string): boolean {
  return GLB_MODELS.has(id);
}

export function hasModel(id: string): boolean {
  return id in MODEL_BUILDERS || GLB_MODELS.has(id);
}
