import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { env } from '../game/shared';
import { useGame } from '../game/store';
import { regionById } from '../game/regions';

// One full day/night cycle, in seconds. Starts at midday (see the +0.25 offset).
const DAY_LENGTH = 120;

export function DayNight() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();

  const c = useMemo(
    () => ({
      skyDay: new THREE.Color('#8fb6d6'),
      skyNight: new THREE.Color('#161f30'),
      skyDusk: new THREE.Color('#e0895a'),
      sunDay: new THREE.Color('#fff2d0'),
      sunDusk: new THREE.Color('#ff9d5c'),
      sunNight: new THREE.Color('#8fa8d8'),
      hemiSkyDay: new THREE.Color('#cfe3ff'),
      hemiSkyNight: new THREE.Color('#2a3650'),
      hemiGroundDay: new THREE.Color('#4a6038'),
      hemiGroundNight: new THREE.Color('#14180f'),
      tmpSky: new THREE.Color(),
      tmpSun: new THREE.Color(),
      tmpHemiSky: new THREE.Color(),
      tmpHemiGround: new THREE.Color(),
      tmpHaze: new THREE.Color(),
      bg: new THREE.Color('#8fb6d6'),
    }),
    [],
  );

  // Mutate the scene's own background + fog each frame instead of re-creating them.
  useMemo(() => {
    scene.background = c.bg;
    scene.fog = new THREE.Fog(c.bg.clone(), 42, 92);
  }, [scene, c]);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime / DAY_LENGTH + 0.25) % 1; // 0..1, load = noon
    const ang = t * Math.PI * 2;
    const elev = Math.sin(ang); // -1..1, peaks at noon (t=0.25)
    const daylight = THREE.MathUtils.clamp(elev * 1.4 + 0.35, 0, 1);
    env.daylight = daylight; // share with the unlit billboards (Sprite3D / Player)
    // Warm horizon band, only while the sun is at/above the horizon (dawn & dusk).
    const glow = THREE.MathUtils.clamp(1 - Math.abs(elev) * 2.5, 0, 1) * THREE.MathUtils.clamp(elev + 0.5, 0, 1);

    c.tmpSky.lerpColors(c.skyNight, c.skyDay, daylight);
    c.tmpSky.lerp(c.skyDusk, glow * 0.7);
    // Region mood: blend the sky/fog toward a haze colour (e.g. volcanic ember),
    // eased down at night so it never washes out the dark.
    const haze = regionById(useGame.getState().currentRegion).skyHaze;
    if (haze) { c.tmpHaze.set(haze.color); c.tmpSky.lerp(c.tmpHaze, haze.amount * (0.4 + daylight * 0.6)); }
    c.bg.copy(c.tmpSky);
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(c.tmpSky);

    if (sun.current) {
      sun.current.position.set(Math.cos(ang) * 30, Math.max(2, Math.sin(ang) * 40), 12);
      sun.current.intensity = THREE.MathUtils.clamp(elev, 0, 1) * 1.1 + 0.08;
      c.tmpSun.lerpColors(c.sunNight, c.sunDay, daylight);
      c.tmpSun.lerp(c.sunDusk, glow);
      if (haze) c.tmpSun.lerp(c.tmpHaze, haze.amount * 0.5);
      sun.current.color.copy(c.tmpSun);
    }
    if (hemi.current) {
      hemi.current.intensity = 0.4 + daylight * 0.55;
      c.tmpHemiSky.lerpColors(c.hemiSkyNight, c.hemiSkyDay, daylight);
      c.tmpHemiGround.lerpColors(c.hemiGroundNight, c.hemiGroundDay, daylight);
      hemi.current.color.copy(c.tmpHemiSky);
      hemi.current.groundColor.copy(c.tmpHemiGround);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={[new THREE.Color('#cfe3ff'), new THREE.Color('#4a6038'), 0.95]} />
      <directionalLight ref={sun} position={[20, 40, 12]} intensity={1.15} color={'#fff2d0'} />
    </>
  );
}
