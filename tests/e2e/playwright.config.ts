import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const apiCommand = isCI ? "npm run start --workspace @krud/api" : "npm run dev:api";
const webCommand = isCI ? "npm run start --workspace @krud/web" : "npm run dev:web";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  retries: 1,
  webServer: [
    {
      command: apiCommand,
      url: process.env.E2E_API_HEALTH_URL ?? "http://localhost:3001/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: process.env.E2E_API_PORT ?? "3001",
        SLACK_MODE: process.env.E2E_SLACK_MODE ?? "mock",
        GIT_MODE: process.env.E2E_GIT_MODE ?? "links"
      }
    },
    {
      command: webCommand,
      url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
      }
    }
  ],
  reporter: [
    [
      "list"
    ],
    [
      "html",
      {
        open: "never",
        outputFolder: "../../playwright-report"
      }
    ]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
});
