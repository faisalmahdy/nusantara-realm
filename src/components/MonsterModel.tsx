import { useMemo } from 'react';
import * as THREE from 'three';
import { MODEL_BUILDERS } from '../models/registry';

// Renders a from-scratch 3D monster mesh, normalised to a target world height
// and standing on y=0 so it reads as grounded (the parent group handles bob).
export function MonsterModel({ speciesId, height = 2.4 }: { speciesId: string; height?: number }) {
  const object = useMemo(() => {
    const g = MODEL_BUILDERS[speciesId]();
    const box = new THREE.Box3().setFromObject(g);
    const h = box.max.y - box.min.y || 1;
    g.scale.setScalar(height / h);
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    return g;
  }, [speciesId, height]);

  return <primitive object={object} />;
}
