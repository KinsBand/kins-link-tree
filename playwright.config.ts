import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testIgnore: '**/e2e/tuner/**',
  timeout: 30_000,
  // Audio tests share browser/OS media resources; serialize the smoke suite
  // so the metronome and newly enabled tuner cannot contend for fake devices.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    ...devices['Pixel 7']
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] }
    }
  ],
  webServer: {
    command: 'npm.cmd run dev',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000
  }
});
