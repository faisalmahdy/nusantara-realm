import { useEffect, useReducer } from 'react';
import { useGame } from '../game/store';
import {
  initAudio, playMusic, getMuted, getVolume, setVolume, toggleMute, subscribeAudio,
} from '../game/audio';

// Unlocks the AudioContext on the first user gesture (browser autoplay policy),
// keeps the music loop in sync with the game mode, and renders a small
// mute + volume control. Mounted by the HUD.
export function AudioControls() {
  const mode = useGame((s) => s.mode);
  const [, force] = useReducer((n) => n + 1, 0);

  // First gesture → start audio, then begin the loop for the current mode.
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      initAudio();
      playMusic(useGame.getState().mode === 'battle' ? 'battle' : 'explore');
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Swap the loop when the mode changes (no-op until audio is unlocked).
  useEffect(() => {
    playMusic(mode === 'battle' ? 'battle' : 'explore');
  }, [mode]);

  // Re-render when audio state changes elsewhere.
  useEffect(() => subscribeAudio(force), []);

  const muted = getMuted();
  return (
    <div style={styles.wrap}>
      <button
        style={styles.btn}
        onClick={() => { toggleMute(); force(); }}
        title={muted ? 'Unmute' : 'Mute'}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        min={0} max={1} step={0.05}
        value={getVolume()}
        onChange={(e) => { setVolume(parseFloat(e.target.value)); force(); }}
        style={styles.slider}
        title="Volume"
        aria-label="Volume"
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'fixed', left: 12, top: 54, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' },
  btn: { background: 'rgba(20,28,20,0.8)', color: '#e8e6d8', border: '1px solid rgba(212,176,106,0.5)', borderRadius: 8, width: 30, height: 28, fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 },
  slider: { width: 76, accentColor: '#d4b06a', cursor: 'pointer' },
};
