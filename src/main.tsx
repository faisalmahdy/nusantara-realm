import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useGame } from './game/store';
import { playerPos, cameraState } from './game/shared';

// Debug handle for screenshot/QA tooling.
(window as any).__realm = { store: useGame, playerPos, cameraState };

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
