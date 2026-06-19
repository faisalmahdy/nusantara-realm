import { defineConfig, devices } from '@playwright/test';

// E2E smoke config. Builds are served by `vite preview`; the browser runs
// headless with software WebGL (swiftshader) so it works on CI runners.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 2, // headless WebGL can be slow to warm up — retry to avoid flake
  fullyParallel: false,
  reporter: 'line',
  webServer: {
    command: 'pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    launchOptions: {
      args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
