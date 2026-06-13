import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { ELEMENT_COLOR, speciesById } from '../game/monsters';
import type { Combatant } from '../game/battle';

// Full-screen turn-based battle overlay. Reuses the 2D attack/hit sprite frames
// for a quick lunge + flinch when an action lands. First slice of roadmap #1.
export function BattleScreen() {
  const battle = useGame((s) => s.battle);
  const [acting, setActing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!battle) return null;

  const { player, enemy, log, turn } = battle;
  const over = turn === 'over';

  // Show the attack/hit frames briefly, then run the store action.
  const withFx = (run: () => void) => {
    if (acting || over) return;
    setActing(true);
    run();
    timer.current = setTimeout(() => setActing(false), 420);
  };

  return (
    <div style={s.wrap}>
      <div style={s.arena}>
        {/* Enemy — top right */}
        <Fighter c={enemy} side="enemy" acting={acting} />
        {/* Player — bottom left */}
        <Fighter c={player} side="player" acting={acting} />
      </div>

      <div style={s.panel}>
        <div style={s.log}>
          {log.slice(-3).map((line, i) => <div key={i} style={{ opacity: i === Math.min(log.length, 3) - 1 ? 1 : 0.55 }}>{line}</div>)}
        </div>

        {!over ? (
          <div style={s.actions}>
            {player.moves.map((m, i) => (
              <button key={m.name} style={{ ...s.btn, ...s.attack }} disabled={acting} onClick={() => withFx(() => useGame.getState().battleMove(i))}>
                {m.name}
                <span style={s.moveType}>{m.element ?? 'Typeless'}</span>
              </button>
            ))}
            <button style={{ ...s.btn, ...s.tame }} disabled={acting} onClick={() => withFx(() => useGame.getState().battleTame())}>Tame</button>
            <button style={{ ...s.btn, ...s.flee }} disabled={acting} onClick={() => useGame.getState().battleFlee()}>Flee</button>
          </div>
        ) : (
          <div style={s.actions}>
            <button style={{ ...s.btn, ...s.attack }} onClick={() => useGame.getState().endBattle()}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Fighter({ c, side, acting }: { c: Combatant; side: 'player' | 'enemy'; acting: boolean }) {
  const sp = speciesById(c.speciesId);
  const frac = c.hp / c.maxHp;
  const barColor = frac > 0.5 ? '#5fcf6a' : frac > 0.25 ? '#e0c452' : '#d65a4a';
  // The acting side lunges with its attack frame; the other flinches with hit.
  const frame = acting ? (side === 'player' ? 'attack' : 'hit') : 'idle';
  const lunge = acting && side === 'player' ? 'translateY(-10px)' : acting && side === 'enemy' ? 'translateX(6px)' : 'none';

  return (
    <div style={{ ...s.fighter, ...(side === 'enemy' ? s.enemyPos : s.playerPos) }}>
      <div style={s.nameRow}>
        <span style={{ fontWeight: 700 }}>{c.name}</span>
        <span style={{ color: ELEMENT_COLOR[c.element], fontSize: 11 }}>{c.element}</span>
        <span style={{ opacity: 0.7, fontSize: 11 }}>Lv {c.level}</span>
      </div>
      <div style={s.barTrack}><div style={{ ...s.barFill, width: `${frac * 100}%`, background: barColor }} /></div>
      <div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right' }}>{c.hp}/{c.maxHp} HP</div>
      <img
        src={`/sprites/${sp.id}/${frame}.png`}
        style={{ ...s.sprite, transform: lunge, transition: 'transform 0.12s', opacity: c.hp <= 0 ? 0.3 : 1 }}
        alt={c.name}
      />
    </div>
  );
}

const font = "system-ui, -apple-system, sans-serif";
const s: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,rgba(10,16,12,0.6),rgba(8,10,14,0.85))', pointerEvents: 'auto', fontFamily: font, color: '#e8e6d8' },
  arena: { position: 'relative', flex: 1 },
  fighter: { position: 'absolute', width: 200, textAlign: 'left' },
  enemyPos: { right: '8%', top: '12%' },
  playerPos: { left: '8%', bottom: '8%' },
  nameRow: { display: 'flex', gap: 8, alignItems: 'baseline', textShadow: '0 1px 2px #000' },
  barTrack: { height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.18)', marginTop: 3 },
  barFill: { height: '100%', borderRadius: 5, transition: 'width 0.3s ease' },
  sprite: { width: 150, height: 150, imageRendering: 'pixelated', objectFit: 'contain', display: 'block', marginTop: 6, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))' },
  panel: { background: 'rgba(12,16,12,0.95)', borderTop: '1px solid rgba(212,176,106,0.5)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  log: { minHeight: 54, fontSize: 14, lineHeight: 1.4 },
  actions: { display: 'flex', gap: 10, justifyContent: 'center' },
  btn: { border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font, minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1.1 },
  moveType: { fontSize: 10, fontWeight: 600, opacity: 0.7 },
  attack: { background: '#d4b06a', color: '#1a1208' },
  tame: { background: '#6ab04c', color: '#0d1a08' },
  flee: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.3)' },
};
