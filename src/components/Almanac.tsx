import { useGame } from '../game/store';
import { SPECIES, ELEMENT_COLOR, ELEMENT_ICON, discoveredSpeciesIds, spriteUrl } from '../game/monsters';

// A Pokédex-style "Field Guide": all species, with folklore lore unlocked once
// you've tamed each. Undiscovered entries show a darkened silhouette + "???".
export function Almanac({ onClose }: { onClose: () => void }) {
  const party = useGame((s) => s.party);
  const tamedWildIds = useGame((s) => s.tamedWildIds);
  const discovered = discoveredSpeciesIds(party.map((m) => m.speciesId), tamedWildIds);

  return (
    <div style={styles.wrap} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <span style={styles.title}>Field Guide</span>
          <span style={styles.count}>{discovered.size}/{SPECIES.length} discovered</span>
          <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={styles.list}>
          {SPECIES.map((sp) => {
            const known = discovered.has(sp.id);
            return (
              <div key={sp.id} style={styles.card}>
                <img
                  src={spriteUrl(sp, 'portrait')}
                  alt={known ? sp.name : 'Undiscovered'}
                  style={{ ...styles.portrait, ...(known ? (sp.tintCss ? { filter: sp.tintCss } : null) : styles.locked) }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.cardHead}>
                    <span style={{ fontWeight: 700 }}>{known ? sp.name : '???'}</span>
                    {known && <span style={{ color: ELEMENT_COLOR[sp.element], fontSize: 12 }}>{ELEMENT_ICON[sp.element]} {sp.element}</span>}
                    {known && <span style={styles.stars}>{'★'.repeat(sp.rarity)}</span>}
                  </div>
                  {known ? (
                    <>
                      <div style={styles.stats}>HP {sp.baseHp} · ATK {sp.baseAtk} · DEF {sp.baseDef}</div>
                      <div style={styles.lore}>{sp.lore}</div>
                    </>
                  ) : (
                    <div style={styles.lore}>Undiscovered — tame one to learn its story.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const font = "system-ui, -apple-system, sans-serif";
const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, zIndex: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', pointerEvents: 'auto', fontFamily: font, color: '#e8e6d8' },
  panel: { width: 'min(460px, 92vw)', maxHeight: '84vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#1b261b,#10160f)', border: '1px solid rgba(212,176,106,0.55)', borderRadius: 14, boxShadow: '0 14px 44px rgba(0,0,0,0.6)' },
  head: { display: 'flex', alignItems: 'baseline', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(212,176,106,0.3)' },
  title: { fontSize: 16, fontWeight: 800, color: '#d4b06a' },
  count: { fontSize: 12, opacity: 0.8, flex: 1 },
  close: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, width: 28, height: 26, fontSize: 13, cursor: 'pointer', fontFamily: font },
  list: { overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 },
  card: { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 9 },
  portrait: { width: 52, height: 52, imageRendering: 'pixelated', borderRadius: 8, background: 'rgba(0,0,0,0.3)', flexShrink: 0 },
  locked: { filter: 'brightness(0) opacity(0.4)' },
  cardHead: { display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' },
  stars: { color: '#d4b06a', fontSize: 11 },
  stats: { fontSize: 11, opacity: 0.7, margin: '2px 0 4px' },
  lore: { fontSize: 12.5, lineHeight: 1.45, opacity: 0.92, fontStyle: 'italic' },
};
