import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { playerPos } from '../game/shared';

const KEY = 'nusantara-realm-tutorial';

// A short, contextual onboarding chain: each step advances when the player
// actually does the thing. Shown once for new players (persisted to
// localStorage); skippable; hidden during battle so it never covers that UI.
const STEPS = [
  'Walk with WASD / arrow keys — or drag the joystick on touch.',
  'Now find a wild monster and walk up close to it.',
  'Press E (or the round ⓔ button) to meet it.',
  'Offer a treat to tame it — or “Battle to weaken” it first for better odds.',
  '🎉 You tamed your first monster! Open “Party” (top-right) anytime to feed, rest, and check on your team.',
];

export function Tutorial() {
  const mode = useGame((s) => s.mode);
  const nearby = useGame((s) => s.nearbyWildId);
  const partyLen = useGame((s) => s.party.length);
  const [done, setDone] = useState(() => {
    try { if (localStorage.getItem(KEY) === 'done') return true; } catch { /* ignore */ }
    return useGame.getState().party.length > 0; // returning player already has progress
  });
  const [step, setStep] = useState(0);
  const [moved, setMoved] = useState(false);
  const start = useRef<{ x: number; z: number } | null>(null);

  // Detect first movement by polling the shared player position (not React state).
  useEffect(() => {
    if (done) return;
    start.current = { x: playerPos.x, z: playerPos.z };
    const id = setInterval(() => {
      const s = start.current;
      if (s && Math.hypot(playerPos.x - s.x, playerPos.z - s.z) > 2) {
        setMoved(true);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, [done]);

  // Advance monotonically as each milestone is reached.
  useEffect(() => {
    let min = 0;
    if (partyLen > 0) min = 4;
    else if (mode === 'taming' || mode === 'battle') min = 3;
    else if (nearby) min = 2;
    else if (moved) min = 1;
    setStep((s) => Math.max(s, min));
  }, [mode, nearby, partyLen, moved]);

  if (done || mode === 'battle') return null;

  const finish = () => {
    try { localStorage.setItem(KEY, 'done'); } catch { /* ignore */ }
    setDone(true);
  };
  const isFinal = step === STEPS.length - 1;

  return (
    <div style={styles.card}>
      <div style={styles.head}>Getting started · {step + 1}/{STEPS.length}</div>
      <div style={styles.tip}>{STEPS[step]}</div>
      <div style={styles.row}>
        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <span key={i} style={{ ...styles.dot, ...(i <= step ? styles.dotOn : null) }} />
          ))}
        </div>
        <button style={isFinal ? styles.primary : styles.skip} onClick={finish}>
          {isFinal ? 'Got it!' : 'Skip'}
        </button>
      </div>
    </div>
  );
}

const font = "system-ui, -apple-system, sans-serif";
const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'fixed', left: '50%', bottom: 150, transform: 'translateX(-50%)',
    width: 'min(420px, 88vw)', background: 'rgba(16,22,16,0.94)', color: '#e8e6d8',
    border: '1px solid rgba(212,176,106,0.6)', borderRadius: 12, padding: '12px 14px',
    fontFamily: font, boxShadow: '0 8px 28px rgba(0,0,0,0.5)', pointerEvents: 'auto', zIndex: 25,
  },
  head: { fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: '#d4b06a', marginBottom: 5 },
  tip: { fontSize: 14, lineHeight: 1.4 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  dots: { display: 'flex', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.22)' },
  dotOn: { background: '#d4b06a' },
  skip: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: font },
  primary: { background: '#d4b06a', color: '#1a1208', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font },
};
