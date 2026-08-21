import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.e2e', quiet: true })

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173'
const startsLocalServer = !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: process.env.E2E_ENABLE_MUTATION_TESTS !== 'true',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.E2E_ENABLE_MUTATION_TESTS === 'true' ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: startsLocalServer ? {
    command: 'npm run dev -- --mode e2e --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
})
