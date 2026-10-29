import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['klick/**/*.spec.js', 'regression/**/*.spec.js', 'zwei-personen.spec.js'],
  timeout: 60_000,
  expect: { timeout: 8_000 },
  workers: 1,
  reporter: [['list']],
  use: { browserName: 'chromium', trace: 'retain-on-failure' }
});
