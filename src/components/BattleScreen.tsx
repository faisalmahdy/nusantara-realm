import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { ELEMENT_COLOR, speciesById } from '../game/monsters';
import { sfx } from '../game/audio';
import type { Combatant } from '../game/battle';

type Pop = { amount: number; key: number };

// Full-screen turn-based battle overlay. Reuses the 2D attack/hit sprite frames
// for a quick lunge + flinch, plus staggered floating damage numbers so a trade
// reads as two distinct hits (your strike, then their counter). Roadmap #1.
export function BattleScreen() {
  const battle = useGame((s) => s.battle);
  const treats = useGame((s) => s.treats);
  const [acting, setActing] = useState(false);
  const [playerDmg, setPlayerDmg] = useState<Pop | null>(null);
  const [enemyDmg, setEnemyDmg] = useState<Pop | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stagger = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHp = useRef<{ p: number; e: number } | null>(null);
  const dmgKey = useRef(0);

  const pHp = battle?.player.hp ?? 0;
  const eHp = battle?.enemy.hp ?? 0;

  // Watch HP deltas to pop damage numbers. The store resolves both hits in one
  // update, so when both sides take damage we show the enemy's first and delay
  // the player's counter-hit number for a beat.
  useEffect(() => {
    if (!battle) { prevHp.current = null; return; }
    if (prevHp.current === null) { prevHp.current = { p: pHp, e: eHp }; return; }
    const dp = prevHp.current.p - pHp;
    const de = prevHp.current.e - eHp;
    prevHp.current = { p: pHp, e: eHp };
    if (de > 0) { setEnemyDmg({ amount: de, key: ++dmgKey.current }); sfx.hit(de >= 22); }
    if (dp > 0) {
      const pop = { amount: dp, key: ++dmgKey.current };
      if (de > 0) {
        if (stagger.current) clearTimeout(stagger.current);
        stagger.current = setTimeout(() => { setPlayerDmg(pop); sfx.hit(dp >= 22); }, 280);
      } else {
        setPlayerDmg(pop);
        sfx.hit(dp >= 22);
      }
    }
  }, [pHp, eHp, battle]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (stagger.current) clearTimeout(stagger.current);
  }, []);
  if (!battle) return null;

  const { player, enemy, log, turn, party, active, mustSwitch } = battle;
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
        <Fighter c={enemy} side="enemy" acting={acting} dmg={enemyDmg} />
        {/* Player — bottom left */}
        <Fighter c={player} side="player" acting={acting} dmg={playerDmg} />
      </div>

      <div style={s.panel}>
        <div style={s.log}>
          {log.slice(-3).map((line, i) => <div key={i} style={{ opacity: i === Math.min(log.length, 3) - 1 ? 1 : 0.55 }}>{line}</div>)}
        </div>

        {over ? (
          <div style={s.actions}>
            <button style={{ ...s.btn, ...s.attack }} onClick={() => useGame.getState().endBattle()}>Continue</button>
          </div>
        ) : mustSwitch ? (
          <div>
            <div style={s.switchHead}>{player.name} fainted! Send out…</div>
            <div style={s.switchRow}>
              {party.map((c, i) => (
                <button key={c.uid} style={{ ...s.swap, opacity: i === active || c.hp <= 0 ? 0.4 : 1 }}
                  disabled={i === active || c.hp <= 0}
                  onClick={() => useGame.getState().battleSwitch(i)}>
                  {c.name}<span style={s.swapHp}>{c.hp}/{c.maxHp}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={s.actions}>
              {player.moves.map((m, i) => (
                <button key={m.name} style={{ ...s.btn, ...s.attack }} disabled={acting} onClick={() => withFx(() => useGame.getState().battleMove(i))}>
                  {m.name}
                  <span style={s.moveType}>{m.element ?? 'Typeless'}</span>
                </button>
              ))}
              <button style={{ ...s.btn, ...s.tame, opacity: treats < 1 ? 0.5 : 1 }} disabled={acting || treats < 1} onClick={() => withFx(() => useGame.getState().battleTame())} title={treats < 1 ? 'No treats left' : 'Offer a treat'}>{treats < 1 ? 'No treats' : 'Tame'}</button>
              <button style={{ ...s.btn, ...s.flee }} disabled={acting} onClick={() => useGame.getState().battleFlee()}>Flee</button>
            </div>
            {party.length > 1 && (
              <div style={s.switchRow}>
                {party.map((c, i) => (
                  <button key={c.uid} style={{ ...s.swap, opacity: i === active || c.hp <= 0 || acting ? 0.4 : 1 }}
                    disabled={i === active || c.hp <= 0 || acting}
                    onClick={() => useGame.getState().battleSwitch(i)}
                    title={i === active ? 'Active' : c.hp <= 0 ? 'Fainted' : `Switch to ${c.name} (costs a turn)`}>
                    {i === active ? '▶ ' : ''}{c.name}<span style={s.swapHp}>{c.hp}/{c.maxHp}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Fighter({ c, side, acting, dmg }: { c: Combatant; side: 'player' | 'enemy'; acting: boolean; dmg: Pop | null }) {
  const sp = speciesById(c.speciesId);
  const frac = c.hp / c.maxHp;
  const barColor = frac > 0.5 ? '#5fcf6a' : frac > 0.25 ? '#e0c452' : '#d65a4a';
  // The acting side lunges with its attack frame; the other flinches with hit.
  const frame = acting ? (side === 'player' ? 'attack' : 'hit') : 'idle';
  const lunge = acting && side === 'player' ? 'translateY(-10px)' : acting && side === 'enemy' ? 'translateX(6px)' : '';

  // Brief flash + shake when this fighter takes a hit.
  const [hurt, setHurt] = useState(false);
  useEffect(() => {
    if (!dmg) return;
    setHurt(true);
    const t = setTimeout(() => setHurt(false), 260);
    return () => clearTimeout(t);
  }, [dmg?.key]);

  const transform = [lunge, hurt ? 'translateX(-5px)' : ''].filter(Boolean).join(' ') || 'none';
  const filter = `drop-shadow(0 6px 8px rgba(0,0,0,0.5))${hurt ? ' brightness(1.7) saturate(2)' : ''}`;

  return (
    <div style={{ ...s.fighter, ...(side === 'enemy' ? s.enemyPos : s.playerPos) }}>
      <div style={s.nameRow}>
        <span style={{ fontWeight: 700 }}>{c.name}</span>
        <span style={{ color: ELEMENT_COLOR[c.element], fontSize: 11 }}>{c.element}</span>
        <span style={{ opacity: 0.7, fontSize: 11 }}>Lv {c.level}</span>
        {c.bond > 0 && <span style={{ color: '#e07ba0', fontSize: 11 }} title={`Bond ${c.bond}/100`}>♥{c.bond}</span>}
      </div>
      <div style={s.barTrack}><div style={{ ...s.barFill, width: `${frac * 100}%`, background: barColor }} /></div>
      <div style={{ fontSize: 10, opacity: 0.7, textAlign: 'right' }}>{c.hp}/{c.maxHp} HP</div>
      <div style={s.spriteWrap}>
        <FloatingDamage key={dmg?.key} pop={dmg} />
        <img
          src={`/sprites/${sp.id}/${frame}.png`}
          style={{ ...s.sprite, transform, transition: 'transform 0.12s', opacity: c.hp <= 0 ? 0.3 : 1, filter }}
          alt={c.name}
        />
      </div>
    </div>
  );
}

// Rises and fades a "-N" number over a fighter when it takes damage.
function FloatingDamage({ pop }: { pop: Pop | null }) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!pop) return;
    const r = requestAnimationFrame(() => setUp(true));
    return () => cancelAnimationFrame(r);
  }, [pop?.key]);
  if (!pop) return null;
  return (
    <div style={{
      position: 'absolute', top: 6, left: '50%', zIndex: 2,
      transform: up ? 'translate(-50%,-48px)' : 'translate(-50%,0)',
      opacity: up ? 0 : 1,
      transition: 'transform 0.78s ease-out, opacity 0.78s ease-out',
      fontWeight: 800, fontSize: 26, color: '#ff6b5a',
      textShadow: '0 2px 4px #000, 0 0 3px #000', pointerEvents: 'none',
    }}>-{pop.amount}</div>
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
  spriteWrap: { position: 'relative', width: 150, height: 156, marginTop: 6 },
  sprite: { width: 150, height: 150, imageRendering: 'pixelated', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))' },
  panel: { background: 'rgba(12,16,12,0.95)', borderTop: '1px solid rgba(212,176,106,0.5)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  log: { minHeight: 54, fontSize: 14, lineHeight: 1.4 },
  actions: { display: 'flex', gap: 10, justifyContent: 'center' },
  btn: { border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: font, minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: 1.1 },
  moveType: { fontSize: 10, fontWeight: 600, opacity: 0.7 },
  attack: { background: '#d4b06a', color: '#1a1208' },
  tame: { background: '#6ab04c', color: '#0d1a08' },
  flee: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.3)' },
  switchHead: { textAlign: 'center', fontSize: 14, marginBottom: 8, color: '#d4b06a', fontWeight: 700 },
  switchRow: { display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  swap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, background: 'rgba(255,255,255,0.08)', color: '#e8e6d8', border: '1px solid rgba(212,176,106,0.4)', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font },
  swapHp: { fontSize: 9, opacity: 0.75, fontWeight: 400 },
};
