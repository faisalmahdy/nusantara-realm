import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { SCENERY, WORLD } from '../game/scenery';

export function World() {
  const grass = useLoader(THREE.TextureLoader, '/world/grass-base.png');
  const path = useLoader(THREE.TextureLoader, '/world/path.png');

  useMemo(() => {
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(WORLD / 4, WORLD / 4);
    grass.magFilter = THREE.NearestFilter;
    grass.colorSpace = THREE.SRGBColorSpace;
    path.wrapS = path.wrapT = THREE.RepeatWrapping;
    path.repeat.set(1, 19);
    path.colorSpace = THREE.SRGBColorSpace;
  }, [grass, path]);

  return (
    <group>
      {/* Round island silhouette (no hard square corners at the shore). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[WORLD / 2, 64]} />
        <meshLambertMaterial map={grass} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4.5, WORLD - 12]} />
        <meshLambertMaterial map={path} transparent />
      </mesh>
      {SCENERY.map((s, i) => (
        <Sprite3D key={i} url={s.url} height={s.height} position={[s.x, 0, s.z]} />
      ))}
    </group>
  );
}
