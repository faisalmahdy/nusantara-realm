import React from 'react';

interface State {
  error: Error | null;
}

// Catches render-time crashes anywhere in the tree and shows a friendly recovery
// screen (reload, or wipe a possibly-corrupt save) instead of a blank page.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Nusantara Realm crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.title}>The realm stumbled.</div>
          <div style={styles.msg}>
            Something went wrong. Reload to return to the island — or start a fresh
            save if it keeps happening.
          </div>
          <div style={styles.row}>
            <button style={styles.primary} onClick={() => location.reload()}>Reload</button>
            <button
              style={styles.ghost}
              onClick={() => {
                try { localStorage.removeItem('nusantara-realm-save'); } catch { /* ignore */ }
                location.reload();
              }}
            >
              Reset save &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const font = "system-ui, -apple-system, sans-serif";
const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#10160f,#0a0d12)', color: '#e8e6d8', fontFamily: font, padding: 20 },
  card: { width: 'min(420px, 92vw)', background: 'rgba(20,28,20,0.9)', border: '1px solid rgba(212,176,106,0.5)', borderRadius: 14, padding: 22, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' },
  title: { fontSize: 20, fontWeight: 800, color: '#d4b06a', marginBottom: 8 },
  msg: { fontSize: 14, lineHeight: 1.5, opacity: 0.9, marginBottom: 18 },
  row: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  primary: { background: '#d4b06a', color: '#1a1208', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font },
  ghost: { background: 'transparent', color: '#e8e6d8', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: font },
};
