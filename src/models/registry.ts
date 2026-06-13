import * as THREE from 'three';
import { buildKancil } from './kancil';
import { buildCamar } from './camar';
import { buildMatong } from './matong';
import { buildDugang } from './dugang';

// Maps a species id to its from-scratch Three.js builder. Species absent from
// this map still render as 2D billboards in the world (ported over time).
export const MODEL_BUILDERS: Record<string, () => THREE.Group> = {
  kancil: buildKancil,
  camar: buildCamar,
  matong: buildMatong,
  dugang: buildDugang,
};

export function hasModel(id: string): boolean {
  return id in MODEL_BUILDERS;
}
