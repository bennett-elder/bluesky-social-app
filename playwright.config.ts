import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
  testDir: './__e2e__/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  timeout: 180000, // 3 minutes
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Run with visible browser
      },
    },
  ],
  webServer: {
    command: 'yarn web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
})
