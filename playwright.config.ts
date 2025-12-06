import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 2 * 60 * 1000,
  expect: {
    timeout: 12_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    actionTimeout: 30_000,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'bash -c "mkdir -p tmp && rm -f tmp/e2e.db && DATABASE_URL=file:./tmp/e2e.db npm run prisma:generate && DATABASE_URL=file:./tmp/e2e.db npx prisma db push --schema src/infra/persistence/prisma/schema.prisma --skip-generate && DATABASE_URL=file:./tmp/e2e.db npm run dev"',
    url: 'http://127.0.0.1:3000',
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:4000',
    },
  },
});
