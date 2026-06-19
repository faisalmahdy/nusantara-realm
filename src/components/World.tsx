import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';
import { WorldProp, propGlbId, hasPropGlb } from './WorldProp';
import { SCENERY, WORLD } from '../game/scenery';
import { ART_MODE } from '../game/config';

export function World() {
  const grass = useLoader(THREE.TextureLoader, '/world/grass-base.png');
  const path = useLoader(THREE.TextureLoader, '/world/path.png');

  useMemo(() => {
    grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
    grass.repeat.set(WORLD / 4, WORLD / 4);
    grass.magFilter = THREE.NearestFilter;
    grass.colorSpace = THREE.SRGBColorSpace;
    path.wrapS = path.wrapT = THREE.RepeatWrapping;
    path.repeat.set(1, 22);
    path.colorSpace = THREE.SRGBColorSpace;
  }, [grass, path]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD, WORLD]} />
        <meshLambertMaterial map={grass} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4.5, WORLD]} />
        <meshLambertMaterial map={path} transparent />
      </mesh>
      {SCENERY.map((s, i) => {
        const id = propGlbId(s.url);
        if (ART_MODE !== 'hd2d' && hasPropGlb(id)) {
          const rotationY = ((s.x * 12.9898 + s.z * 78.233) % (Math.PI * 2));
          return (
            <WorldProp key={i} id={id} height={s.height} position={[s.x, 0, s.z]} rotationY={rotationY} />
          );
        }
        return <Sprite3D key={i} url={s.url} height={s.height} position={[s.x, 0, s.z]} />;
      })}
    </group>
  );
}
