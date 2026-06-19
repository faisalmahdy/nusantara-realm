import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    // The bundle is dominated by three.js, which HD-2D genuinely needs (the
    // world/camera/lighting/sprites are all real 3D). It can't be trimmed away,
    // but splitting the big stable libs into their own chunks lets the browser
    // cache them across app deploys (only the small app chunk changes).
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
