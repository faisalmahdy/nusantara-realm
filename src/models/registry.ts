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

export function hasModel(id: string): boolean {
  return id in MODEL_BUILDERS;
}
