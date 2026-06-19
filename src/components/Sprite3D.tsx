import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

const cache = new Map<string, THREE.Texture>();

export function loadPixelTexture(url: string): THREE.Texture {
  let t = cache.get(url);
  if (!t) {
    t = new THREE.TextureLoader().load(url);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache.set(url, t);
  }
  return t;
}

interface Sprite3DProps {
  url: string;
  /** world-space height; width is derived from the image aspect ratio */
  height: number;
  position?: [number, number, number];
  /** anchor the sprite at its base so it stands on the ground */
  groundAnchored?: boolean;
  opacity?: number;
  renderOrder?: number;
  /** optional tint multiplied over the texture (e.g. to recolor NPC sprites) */
  color?: string;
}

/**
 * A camera-facing pixel-art billboard. This is the core of the HD-2D look:
 * the 2D Nusantara sprites planted in the real 3D world.
 */
export function Sprite3D({ url, height, position = [0, 0, 0], groundAnchored = true, opacity = 1, renderOrder = 0, color }: Sprite3DProps) {
  const tex = useLoader(THREE.TextureLoader, url);
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    const img = tex.image as HTMLImageElement | undefined;
    if (img && img.width) setAspect(img.width / img.height);
  }, [tex]);

  const center = useMemo<[number, number]>(() => (groundAnchored ? [0.5, 0] : [0.5, 0.5]), [groundAnchored]);

  return (
    <sprite position={position} scale={[height * aspect, height, 1]} center={center as any} renderOrder={renderOrder}>
      <spriteMaterial map={tex} color={color as any} transparent alphaTest={0.5} opacity={opacity} depthWrite />
    </sprite>
  );
}
