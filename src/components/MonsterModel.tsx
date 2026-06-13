import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MODEL_BUILDERS } from '../models/registry';

// A builder may attach `group.userData.idle = (t) => {...}` to drive a subtle
// per-creature animation (e.g. a wing-flap) referencing its own sub-meshes.
type IdleFn = (t: number) => void;

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

  useFrame((state) => {
    const idle = object.userData.idle as IdleFn | undefined;
    idle?.(state.clock.elapsedTime);
  });

  return <primitive object={object} />;
}
