import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'tmp-load-check.spec.ts',
  timeout: 45000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'off',
    ...devices['Pixel 7']
  }
});
