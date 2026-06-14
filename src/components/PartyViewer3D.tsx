import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { stageGlbId } from '../models/registry';
import { evolutionStage } from '../game/battle';

// The party monster's current evolution-stage GLB, fit to a unit box, centred on
// the origin and slowly turning so its 3D form is readable in the panel.
function Model({ glbId }: { glbId: string }) {
  const { scene } = useGLTF(`/models/${glbId}.glb`);
  const spin = useRef<THREE.Group>(null);
  const object = useMemo(() => {
    const g = scene.clone(true) as THREE.Group;
    const box = new THREE.Box3().setFromObject(g);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = 1.9 / (Math.max(size.x, size.y, size.z) || 1);
    g.scale.setScalar(s);
    g.position.set(-center.x * s, -center.y * s, -center.z * s);
    return g;
  }, [scene]);
  useFrame((_, dt) => { if (spin.current) spin.current.rotation.y += dt * 0.7; });
  return <group ref={spin}><primitive object={object} /></group>;
}

// A small live 3D viewport of a tamed monster, showing the model for its current
// evolution stage. Its own WebGL canvas, separate from the overworld scene.
export function PartyViewer3D({ speciesId, level }: { speciesId: string; level: number }) {
  const glbId = stageGlbId(speciesId, evolutionStage(level));
  return (
    <Canvas
      camera={{ position: [0, 0.3, 3.1], fov: 42 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: 150, touchAction: 'none' }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Suspense fallback={null}>
        <Model glbId={glbId} />
      </Suspense>
    </Canvas>
  );
}
