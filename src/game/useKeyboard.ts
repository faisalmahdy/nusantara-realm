import { useEffect, useRef } from 'react';

export interface KeyState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  tame: boolean;
}

const MAP: Record<string, keyof KeyState> = {
  w: 'forward', arrowup: 'forward',
  s: 'back', arrowdown: 'back',
  a: 'left', arrowleft: 'left',
  d: 'right', arrowright: 'right',
  e: 'tame',
};

// Shared mutable key state read inside the render loop (avoids re-renders).
export function useKeyboard(): React.MutableRefObject<KeyState> {
  const keys = useRef<KeyState>({ forward: false, back: false, left: false, right: false, tame: false });
  useEffect(() => {
    const set = (down: boolean) => (e: KeyboardEvent) => {
      const k = MAP[e.key.toLowerCase()];
      if (k) keys.current[k] = down;
    };
    const onDown = set(true);
    const onUp = set(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
  return keys;
}
