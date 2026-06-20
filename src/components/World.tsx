import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { WORLD, sceneryFor } from '../game/scenery';
import { regionById } from '../game/regions';
import { useGame } from '../game/store';

export function World() {
  const regionId = useGame((s) => s.currentRegion);
  const region = regionById(regionId);
  // Preload both ground textures so sailing between regions doesn't re-suspend.
  const [grassBase, grassAlt] = useLoader(THREE.TextureLoader, ['/world/grass-base.png', '/world/grass-alt.png']);
  const path = useLoader(THREE.TextureLoader, '/world/path.png');

  useMemo(() => {
    for (const g of [grassBase, grassAlt]) {
      g.wrapS = g.wrapT = THREE.RepeatWrapping;
      g.repeat.set(WORLD / 4, WORLD / 4);
      g.magFilter = THREE.NearestFilter;
      g.colorSpace = THREE.SRGBColorSpace;
    }
    path.wrapS = path.wrapT = THREE.RepeatWrapping;
    path.repeat.set(1, 19);
    path.colorSpace = THREE.SRGBColorSpace;
  }, [grassBase, grassAlt, path]);

  const grass = region.ground.includes('alt') ? grassAlt : grassBase;
  const scenery = sceneryFor(regionId).scenery;

  return (
    <group>
      {/* Round island silhouette (no hard square corners at the shore). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[WORLD / 2, 64]} />
        <meshLambertMaterial map={grass} />
      </mesh>
      {region.hasPath && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[4.5, WORLD - 12]} />
          <meshLambertMaterial map={path} transparent />
        </mesh>
      )}
      {scenery.map((s, i) => (
        <Sprite3D key={`${regionId}-${i}`} url={s.url} height={s.height} position={[s.x, 0, s.z]} />
      ))}
    </group>
  );
}
