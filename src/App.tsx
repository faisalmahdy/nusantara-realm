import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';

export default function App() {
  return (
    <>
      <Canvas
        shadows={false}
        dpr={[1, 2]}
        camera={{ fov: 55, near: 0.1, far: 220, position: [0, 8, -3] }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => { gl.outputColorSpace = 'srgb' as any; }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  );
}
