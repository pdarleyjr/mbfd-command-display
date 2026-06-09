import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5182',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5182',
    url: 'http://127.0.0.1:5182',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_MOCK: '1',
    },
  },
});
