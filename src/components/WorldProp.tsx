import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// Scenery props with a Meshy-generated GLB in public/models/<id>.glb.
const PROP_GLBS = new Set<string>(['tree-palm', 'tree-banyan', 'fern']);

// Scenery sprite url (e.g. /world/tree-palm.png) → Meshy GLB id (tree-palm).
export function propGlbId(url: string): string {
  return url.replace(/^.*\//, '').replace(/\.png$/, '');
}

export function hasPropGlb(id: string): boolean {
  return PROP_GLBS.has(id);
}

// A static 3D prop (tree/fern) loaded from its Meshy GLB, normalised to the
// scenery height and planted on the ground. Clones share geometry/material with
// the cached source, so the 80-odd props stay cheap.
export function WorldProp({ id, height, position, rotationY }: {
  id: string;
  height: number;
  position: [number, number, number];
  rotationY: number;
}) {
  const { scene } = useGLTF(`/models/${id}.glb`);
  const object = useMemo(() => {
    const g = scene.clone(true) as THREE.Group;
    const box = new THREE.Box3().setFromObject(g);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = height / (size.y || 1);
    g.scale.setScalar(s);
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    return g;
  }, [scene, height]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={object} />
    </group>
  );
}
