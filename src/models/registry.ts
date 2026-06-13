import * as THREE from 'three';
import { buildKancil } from './kancil';

// Maps a species id to its from-scratch Three.js builder. Species absent from
// this map still render as 2D billboards in the world (ported over time).
export const MODEL_BUILDERS: Record<string, () => THREE.Group> = {
  kancil: buildKancil,
};

export function hasModel(id: string): boolean {
  return id in MODEL_BUILDERS;
}
