import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { MODEL_BUILDERS, hasGlb, stageGlbId } from '../models/registry';

// A builder may attach `group.userData.idle = (t) => {...}` to drive a subtle
// per-creature animation (e.g. a wing-flap) referencing its own sub-meshes.
type IdleFn = (t: number) => void;

// Normalise an object to a target world height, centre it on x/z, and drop it
// onto y=0 so it reads as grounded.
function groundAndScale(g: THREE.Group, height: number) {
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
}

// Meshy-generated GLB asset (a species or one of its evolution-stage models).
function GlbModel({ glbId, height }: { glbId: string; height: number }) {
  const { scene } = useGLTF(`/models/${glbId}.glb`);
  const object = useMemo(() => {
    const g = scene.clone(true) as THREE.Group;
    groundAndScale(g, height);
    return g;
  }, [scene, height]);
  return <primitive object={object} />;
}

// From-scratch primitive mesh built by a registry builder.
function ProceduralModel({ speciesId, height }: { speciesId: string; height: number }) {
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

// Renders a 3D monster: a Meshy GLB if one exists for the species, otherwise the
// procedural primitive mesh. The GLB path suspends, so it gets its own boundary
// to avoid blanking the rest of the scene while it loads.
export function MonsterModel({ speciesId, height = 2.4, stage = 1 }: { speciesId: string; height?: number; stage?: number }) {
  const glbId = stageGlbId(speciesId, stage);
  if (hasGlb(glbId)) {
    return (
      <Suspense fallback={null}>
        <GlbModel glbId={glbId} height={height} />
      </Suspense>
    );
  }
  return <ProceduralModel speciesId={speciesId} height={height} />;
}
