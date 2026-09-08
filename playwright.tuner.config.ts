import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/tuner',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4335', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    // Playwright's Windows WebKit binary exposes no AudioContext. Exercise
    // layout and graceful unavailability there; run all audio cases on macOS.
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] },
      grep: process.platform === 'win32' ? /calibration|both themes|unsupported browsers/ : undefined },
  ],
  webServer: {
    command: 'npm.cmd run dev -- --host 127.0.0.1 --port 4335',
    env: { TUNER_PREVIEW: 'true' },
    url: 'http://127.0.0.1:4335/tuner',
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
