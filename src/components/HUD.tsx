import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { speciesById, ELEMENT_COLOR } from '../game/monsters';
import { xpToNext, maxHpFor, evolutionStage, nextEvolutionLevel } from '../game/battle';
import { BattleScreen } from './BattleScreen';
import { TouchControls } from './TouchControls';
import { PartyViewer3D } from './PartyViewer3D';
import { ART_MODE } from '../game/config';

export function HUD() {
  const { mode, party, nearbyWildId, tamingTargetId, message } = useGame();
  const [showParty, setShowParty] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const hasParty = party.length > 0;
  const selected = party.find((m) => m.uid === selectedUid) ?? party[0];

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
          {selected && (() => {
            const sp = speciesById(selected.speciesId);
            const stage = evolutionStage(selected.level);
            const nextLv = nextEvolutionLevel(selected.level);
            return (
              <div style={styles.viewer}>
                {ART_MODE === 'hd2d' ? (
                  <img src={`/sprites/${selected.speciesId}/idle.png`} style={styles.viewerImg} alt={selected.nickname} />
                ) : (
                  <PartyViewer3D speciesId={selected.speciesId} level={selected.level} />
                )}
                <div style={styles.viewerOverlay}>
                  <span style={{ color: ELEMENT_COLOR[sp.element], fontWeight: 700 }}>{selected.nickname}</span>
                  <span style={styles.stageBadge}>Stage {stage}</span>
                </div>
                <div style={styles.evoLine}>
                  {nextLv ? `Evolves at Lv ${nextLv}` : 'Final form reached'}
                </div>
              </div>
            );
          })()}
          {party.map((m) => {
            const sp = speciesById(m.speciesId);
            const maxHp = maxHpFor(m.speciesId, m.level);
            const hpFrac = Math.max(0, m.hp) / maxHp;
            const hpColor = hpFrac > 0.5 ? '#5fcf6a' : hpFrac > 0.25 ? '#e0c452' : '#d65a4a';
            const isSelected = selected?.uid === m.uid;
            return (
              <div
                key={m.uid}
                style={{ ...styles.partyRow, ...(isSelected ? styles.partyRowActive : null) }}
                onClick={() => setSelectedUid(m.uid)}
              >
                <img src={`/sprites/${sp.id}/portrait.png`} style={styles.portrait} alt={sp.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{m.nickname} <span style={{ color: ELEMENT_COLOR[sp.element], fontSize: 11 }}>{sp.element}</span></div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>Lv {m.level} · XP {m.xp}/{xpToNext(m.level)}</div>
                  <div style={styles.statTrack} title={`HP ${Math.max(0, m.hp)}/${maxHp}`}>
                    <div style={{ ...styles.statFill, width: `${hpFrac * 100}%`, background: hpColor }} />
                  </div>
                  <div style={styles.statTrack} title={`Bond ${m.bond}/100`}>
                    <div style={{ ...styles.statFill, width: `${m.bond}%`, background: '#e07ba0' }} />
                  </div>
                </div>
                <div style={styles.rowBtns}>
                  <button style={{ ...styles.rowBtn, ...styles.feedBtn, opacity: m.bond >= 100 ? 0.5 : 1 }} onClick={() => useGame.getState().feed(m.uid)}>Feed</button>
                  <button style={{ ...styles.rowBtn, ...styles.restBtn, opacity: m.hp >= maxHp ? 0.5 : 1 }} onClick={() => useGame.getState().rest(m.uid)}>Rest</button>
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

      {mode === 'explore' && <TouchControls />}
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
  viewer: { position: 'relative', background: 'radial-gradient(circle at 50% 35%, rgba(60,80,55,0.5), rgba(0,0,0,0.3))', borderRadius: 8, marginBottom: 8, border: '1px solid rgba(212,176,106,0.25)' },
  viewerImg: { display: 'block', width: '100%', height: 150, objectFit: 'contain', imageRendering: 'pixelated', padding: '10px 0' },
  viewerOverlay: { position: 'absolute', left: 8, top: 6, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, textShadow: '0 1px 2px #000', pointerEvents: 'none' },
  stageBadge: { background: 'rgba(212,176,106,0.9)', color: '#1a1208', borderRadius: 999, padding: '1px 8px', fontSize: 10, fontWeight: 800 },
  evoLine: { position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center', fontSize: 10, opacity: 0.8, textShadow: '0 1px 2px #000', pointerEvents: 'none' },
  partyRow: { display: 'flex', gap: 8, alignItems: 'center', padding: '5px 6px', borderRadius: 6, cursor: 'pointer' },
  partyRowActive: { background: 'rgba(212,176,106,0.14)', outline: '1px solid rgba(212,176,106,0.4)' },
  portrait: { width: 38, height: 38, imageRendering: 'pixelated', borderRadius: 6, background: 'rgba(0,0,0,0.3)' },
  statTrack: { height: 5, marginTop: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' },
  statFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
  rowBtns: { display: 'flex', flexDirection: 'column', gap: 4 },
  rowBtn: { border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font },
  feedBtn: { background: '#6ab04c', color: '#0d1a08' },
  restBtn: { background: '#5a9fd4', color: '#08131a' },
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
