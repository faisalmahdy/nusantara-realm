import { useEffect, useRef, useState } from 'react';
import { World } from './World';
import { Ocean } from './Ocean';
import { Player } from './Player';
import { WildMonster } from './WildMonster';
import { Npc } from './Npc';
import { Dock } from './Dock';
import { CameraRig } from './CameraRig';
import { DayNight } from './DayNight';
import { useGame } from '../game/store';
import { makeInitialSpawns, respawnTamed } from '../game/spawns';
import { regionById } from '../game/regions';
import { NPCS } from '../game/npcs';

const RESPAWN_DELAY = 3500; // ms after a tame before a fresh wild appears in the slot

export function GameScene() {
  const currentRegion = useGame((s) => s.currentRegion);
  const [spawns, setSpawns] = useState(() => makeInitialSpawns(regionById(currentRegion)));
  const counter = useRef(1000); // monotonic source for fresh respawn ids
  const tamedWildIds = useGame((s) => s.tamedWildIds);

  // Rebuild the wild ring whenever you sail to a different region.
  useEffect(() => {
    setSpawns(makeInitialSpawns(regionById(currentRegion)));
  }, [currentRegion]);

  // When a wild in the field gets tamed, repopulate its slot with a fresh wild
  // after a short delay so the island stays huntable instead of emptying out.
  useEffect(() => {
    const tamed = new Set(tamedWildIds);
    if (!spawns.some((s) => tamed.has(s.wildId))) return;
    const t = setTimeout(() => {
      setSpawns((prev) => {
        const res = respawnTamed(prev, new Set(useGame.getState().tamedWildIds), counter.current);
        counter.current = res.counter;
        return res.changed ? res.spawns : prev;
      });
    }, RESPAWN_DELAY);
    return () => clearTimeout(t);
  }, [tamedWildIds, spawns]);

  return (
    <>
      <DayNight />

      <Ocean />
      <World />
      <Player />
      <Dock />
      {NPCS.filter((n) => n.region === currentRegion).map((n) => (
        <Npc key={n.id} npc={n} />
      ))}
      {spawns.map((s) => (
        <WildMonster key={s.wildId} spawn={s} />
      ))}
      <CameraRig />
    </>
  );
}
