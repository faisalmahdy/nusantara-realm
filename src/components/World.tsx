import { useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { Sprite3D } from './Sprite3D';

export const WORLD = 90;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Scenery { url: string; height: number; x: number; z: number; }

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

  const scenery = useMemo<Scenery[]>(() => {
    const rng = mulberry32(1337);
    const out: Scenery[] = [];
    for (let i = 0; i < 80; i++) {
      const x = (rng() - 0.5) * (WORLD - 8);
      const z = (rng() - 0.5) * (WORLD - 8);
      if (Math.abs(x) < 3.5) continue; // keep the path clear
      const k = rng();
      if (k < 0.42) out.push({ url: '/world/tree-banyan.png', height: 7, x, z });
      else if (k < 0.72) out.push({ url: '/world/tree-palm.png', height: 6.5, x, z });
      else out.push({ url: '/world/fern.png', height: 1.7, x, z });
    }
    return out;
  }, []);

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
      {scenery.map((s, i) => (
        <Sprite3D key={i} url={s.url} height={s.height} position={[s.x, 0, s.z]} />
      ))}
    </group>
  );
}
