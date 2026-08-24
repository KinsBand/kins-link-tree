import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321/kins-link-tree',
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
    url: 'http://localhost:4321/kins-link-tree/',
    reuseExistingServer: !process.env.CI,
    timeout: 90_000
  }
});
