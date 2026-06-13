import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { speciesById, ELEMENT_COLOR } from '../game/monsters';
import { xpToNext } from '../game/battle';
import { BattleScreen } from './BattleScreen';

export function HUD() {
  const { mode, party, nearbyWildId, tamingTargetId, message } = useGame();
  const [showParty, setShowParty] = useState(false);
  const hasParty = party.length > 0;

  // Auto-clear the flash message.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => useGame.setState({ message: null }), 1800);
    return () => clearTimeout(t);
  }, [message]);

  const nearbySpecies = nearbyWildId ? speciesById(nearbyWildId.split('-')[1]) : null;
  const tamingSpecies = tamingTargetId ? speciesById(tamingTargetId.split('-')[1]) : null;

  return (
    <div style={styles.root}>
      <div style={styles.title}>
        <span style={{ color: '#d4b06a', fontWeight: 700 }}>Nusantara Realm</span>
        <span style={{ opacity: 0.7 }}> · HD-2D taming RPG</span>
      </div>
      <div style={styles.controls}>WASD / arrows walk · drag to orbit · <b>E</b> to tame</div>

      {nearbySpecies && mode === 'explore' && (
        <div style={styles.prompt}>
          A wild <b style={{ color: ELEMENT_COLOR[nearbySpecies.element] }}>{nearbySpecies.name}</b> is nearby — press <b>E</b> to tame
        </div>
      )}

      {message && <div style={styles.flash}>{message}</div>}

      {/* Party button + panel */}
      <button style={{ ...styles.partyBtn, pointerEvents: 'auto' }} onClick={() => setShowParty((v) => !v)}>
        Party · {party.length}
      </button>
      {showParty && (
        <div style={styles.partyPanel}>
          <div style={styles.panelHead}>Your Tamed Monsters</div>
          {party.length === 0 && <div style={styles.empty}>None yet — tame a wild monster!</div>}
          {party.map((m) => {
            const sp = speciesById(m.speciesId);
            return (
              <div key={m.uid} style={styles.partyRow}>
                <img src={`/sprites/${sp.id}/portrait.png`} style={styles.portrait} alt={sp.name} />
                <div>
                  <div style={{ fontWeight: 600 }}>{m.nickname} <span style={{ color: ELEMENT_COLOR[sp.element], fontSize: 11 }}>{sp.element}</span></div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>Lv {m.level} · XP {m.xp}/{xpToNext(m.level)} · Bond {m.bond}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Taming modal */}
      {mode === 'taming' && tamingSpecies && tamingTargetId && (
        <div style={styles.modalWrap}>
          <div style={styles.modal}>
            <img src={`/sprites/${tamingSpecies.id}/idle.png`} style={styles.modalImg} alt={tamingSpecies.name} />
            <div style={styles.modalName} >{tamingSpecies.name}</div>
            <div style={styles.modalBlurb}>{tamingSpecies.blurb}</div>
            <div style={styles.modalStats}>
              <span>HP {tamingSpecies.baseHp}</span>
              <span>ATK {tamingSpecies.baseAtk}</span>
              <span>DEF {tamingSpecies.baseDef}</span>
              <span>{'★'.repeat(tamingSpecies.rarity)}</span>
            </div>
            <div style={styles.modalBtns}>
              {hasParty && (
                <button style={styles.battleBtn} onClick={() => useGame.getState().beginBattle(tamingTargetId)}>
                  Battle to weaken
                </button>
              )}
              <button style={styles.tameBtn} onClick={() => useGame.getState().tame(tamingSpecies.id, tamingTargetId)}>
                Offer Treat & Tame
              </button>
              <button style={styles.cancelBtn} onClick={() => useGame.getState().cancelTaming()}>
                Back away
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'battle' && <BattleScreen />}
    </div>
  );
}

const font = "system-ui, -apple-system, sans-serif";
const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, zIndex: 10, fontFamily: font, color: '#e8e6d8', pointerEvents: 'none', userSelect: 'none' },
  title: { position: 'fixed', left: 12, top: 10, fontSize: 15, textShadow: '0 1px 3px #000' },
  controls: { position: 'fixed', left: 12, top: 32, fontSize: 12, opacity: 0.85, textShadow: '0 1px 2px #000' },
  prompt: { position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', background: 'rgba(20,28,20,0.82)', padding: '8px 16px', borderRadius: 999, fontSize: 14, textShadow: '0 1px 2px #000', border: '1px solid rgba(212,176,106,0.5)' },
  flash: { position: 'fixed', left: '50%', top: 70, transform: 'translateX(-50%)', background: 'rgba(212,176,106,0.95)', color: '#1a1208', padding: '8px 18px', borderRadius: 8, fontSize: 15, fontWeight: 700 },
  partyBtn: { position: 'fixed', right: 12, top: 12, background: 'rgba(20,28,20,0.85)', color: '#e8e6d8', border: '1px solid rgba(212,176,106,0.6)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontFamily: font, cursor: 'pointer' },
  partyPanel: { position: 'fixed', right: 12, top: 52, width: 230, background: 'rgba(16,22,16,0.94)', border: '1px solid rgba(212,176,106,0.4)', borderRadius: 10, padding: 10, pointerEvents: 'auto' },
  panelHead: { fontSize: 13, fontWeight: 700, color: '#d4b06a', marginBottom: 8 },
  empty: { fontSize: 12, opacity: 0.7 },
  partyRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0' },
  portrait: { width: 38, height: 38, imageRendering: 'pixelated', borderRadius: 6, background: 'rgba(0,0,0,0.3)' },
  modalWrap: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', pointerEvents: 'auto' },
  modal: { width: 320, background: 'linear-gradient(180deg,#1d2a1d,#10160f)', border: '1px solid rgba(212,176,106,0.55)', borderRadius: 14, padding: 18, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' },
  modalImg: { width: 120, height: 120, imageRendering: 'pixelated', objectFit: 'contain' },
  modalName: { fontSize: 20, fontWeight: 800, color: '#d4b06a', marginTop: 4 },
  modalBlurb: { fontSize: 12, opacity: 0.85, margin: '6px 10px 10px' },
  modalStats: { display: 'flex', justifyContent: 'center', gap: 12, fontSize: 12, opacity: 0.9, marginBottom: 14 },
  modalBtns: { display: 'flex', flexDirection: 'column', gap: 8 },
  battleBtn: { background: '#6ab04c', color: '#0d1a08', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font },
  tameBtn: { background: '#d4b06a', color: '#1a1208', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font },
  cancelBtn: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: font },
};
