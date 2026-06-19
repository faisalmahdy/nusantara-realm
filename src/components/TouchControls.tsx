import { useRef, useState } from 'react';
import { useGame } from '../game/store';
import { touchInput } from '../game/shared';

const BASE_R = 56; // px, max thumb travel from center

// On-screen joystick (move) + tame button, for playing on a phone where there's
// no keyboard. Writes the joystick vector into shared.touchInput each pointer move.
export function TouchControls() {
  const baseRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const { mode, nearbyWildId, nearbyNpcId } = useGame();
  const canTame = mode === 'explore' && (!!nearbyWildId || !!nearbyNpcId);

  const update = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > BASE_R) { dx = (dx / dist) * BASE_R; dy = (dy / dist) * BASE_R; }
    setKnob({ x: dx, y: dy });
    touchInput.x = dx / BASE_R;
    touchInput.y = dy / BASE_R;
  };

  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    touchInput.x = 0;
    touchInput.y = 0;
  };

  const tame = () => {
    const s = useGame.getState();
    if (s.mode !== 'explore') return;
    if (s.nearbyWildId) s.beginTaming(s.nearbyWildId);
    else if (s.nearbyNpcId) s.talkToNpc(s.nearbyNpcId);
  };

  return (
    <>
      <div
        ref={baseRef}
        style={styles.joyBase}
        onPointerDown={(e) => { active.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (active.current) update(e.clientX, e.clientY); }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <div style={{ ...styles.joyKnob, transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>

      <button
        style={{ ...styles.tameBtn, opacity: canTame ? 1 : 0.4 }}
        onPointerDown={(e) => { e.preventDefault(); tame(); }}
      >
        E
      </button>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  joyBase: {
    position: 'fixed', left: 24, bottom: 28, width: 112, height: 112, borderRadius: '50%',
    background: 'rgba(20,28,20,0.4)', border: '2px solid rgba(212,176,106,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'auto', touchAction: 'none', zIndex: 11,
  },
  joyKnob: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'rgba(212,176,106,0.85)', border: '2px solid rgba(255,255,255,0.4)',
  },
  tameBtn: {
    position: 'fixed', right: 28, bottom: 40, width: 76, height: 76, borderRadius: '50%',
    background: 'rgba(106,176,76,0.9)', color: '#0d1a08', border: '2px solid rgba(255,255,255,0.5)',
    fontSize: 26, fontWeight: 800, fontFamily: 'system-ui, sans-serif',
    pointerEvents: 'auto', touchAction: 'none', zIndex: 11, cursor: 'pointer',
  },
};
